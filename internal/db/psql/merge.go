package psql

import (
	"context"
	"fmt"
	"strings"

	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/repository"
	"github.com/jackc/pgx/v5"
)

func (d *Psql) MergeTracks(ctx context.Context, fromId, toId int32) error {
	l := logger.FromContext(ctx)
	l.Info().Msgf("Merging track %d into track %d", fromId, toId)
	tx, err := d.conn.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		l.Err(err).Msg("Failed to begin transaction")
		return fmt.Errorf("MergeTracks: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := d.q.WithTx(tx)
	from, err := qtx.GetTrack(ctx, fromId)
	if err != nil {
		return fmt.Errorf("MergeTracks: GetTrack: %w", err)
	}
	to, err := qtx.GetTrack(ctx, toId)
	if err != nil {
		return fmt.Errorf("MergeTracks: GetTrack: %w", err)
	}
	err = qtx.UpdateTrackIdForListens(ctx, repository.UpdateTrackIdForListensParams{
		TrackID:   fromId,
		TrackID_2: toId,
	})
	if err != nil {
		return fmt.Errorf("MergeTracks: UpdateTrackIdForListens: %w", err)
	}
	if from.ReleaseID != to.ReleaseID {
		// tracks are from different releases, track artist should be associated with to.release
		artists, err := qtx.GetTrackArtists(ctx, fromId)
		if err != nil {
			return fmt.Errorf("MergeTracks: GetTrackArtists: %w", err)
		}
		for _, artist := range artists {
			err = qtx.AssociateArtistToRelease(ctx, repository.AssociateArtistToReleaseParams{
				ArtistID:  artist.ID,
				ReleaseID: to.ReleaseID,
			})
			if err != nil {
				return fmt.Errorf("MergeTracks: AssociateArtistToRelease: %w", err)
			}
		}
	}
	err = qtx.CleanOrphanedEntries(ctx)
	if err != nil {
		l.Err(err).Msg("MergeTracks: Failed to clean orphaned entries")
		return err
	}
	return tx.Commit(ctx)
}

func (d *Psql) SplitArtists(ctx context.Context, fromId int32, toIds []int32, createMissing bool, newArtistNames []string) error {
	l := logger.FromContext(ctx)
	l.Info().Msgf("Splitting artist %d into artists %v with new names %v", fromId, toIds, newArtistNames)
	
	tx, err := d.conn.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		l.Err(err).Msg("Failed to begin transaction")
		return fmt.Errorf("SplitArtists: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := d.q.WithTx(tx)
	
	// Get the original artist
	originalArtist, err := qtx.GetArtist(ctx, fromId)
	if err != nil {
		return fmt.Errorf("SplitArtists: GetArtist: %w", err)
	}
	
	// Get all track associations for the original artist (with is_primary)
	originalTrackAssociations, err := qtx.GetArtistTrackAssociations(ctx, fromId)
	if err != nil {
		return fmt.Errorf("SplitArtists: GetArtistTrackAssociations: %w", err)
	}
	l.Debug().Msgf("Found %d track associations for artist %d", len(originalTrackAssociations), fromId)
	
	// Get all release associations for the original artist (with is_primary)
	originalReleaseAssociations, err := qtx.GetArtistReleaseAssociations(ctx, fromId)
	if err != nil {
		return fmt.Errorf("SplitArtists: GetArtistReleaseAssociations: %w", err)
	}
	l.Debug().Msgf("Found %d release associations for artist %d", len(originalReleaseAssociations), fromId)
	
	// Collect all target artist IDs (existing + newly created)
	allTargetIds := make([]int32, 0, len(toIds)+len(newArtistNames))
	
	// Process existing target IDs
	for _, targetId := range toIds {
		// Check if target artist exists
		existingArtist, err := qtx.GetArtist(ctx, targetId)
		if err != nil {
			if err == pgx.ErrNoRows && createMissing {
				// This shouldn't happen as toIds should contain valid IDs,
				// but handle it gracefully by creating an artist without a name
				newArtist, err := qtx.InsertArtist(ctx, repository.InsertArtistParams{
					MusicBrainzID: originalArtist.MusicBrainzID,
					Image:         originalArtist.Image,
					ImageSource:   originalArtist.ImageSource,
				})
				if err != nil {
					return fmt.Errorf("SplitArtists: InsertArtist: %w", err)
				}
				allTargetIds = append(allTargetIds, newArtist.ID)
			} else if err != pgx.ErrNoRows {
				return fmt.Errorf("SplitArtists: GetArtist: %w", err)
			}
		} else {
			allTargetIds = append(allTargetIds, existingArtist.ID)
		}
	}
	
	// Create new artists from names
	for _, artistName := range newArtistNames {
		artistName = strings.TrimSpace(artistName)
		if artistName == "" {
			continue
		}
		
		// Create new artist (without MusicBrainz ID as it's a new/manual artist)
		newArtist, err := qtx.InsertArtist(ctx, repository.InsertArtistParams{
			MusicBrainzID: nil,
			Image:         originalArtist.Image,
			ImageSource:   originalArtist.ImageSource,
		})
		if err != nil {
			return fmt.Errorf("SplitArtists: InsertArtist for new name '%s': %w", artistName, err)
		}
		
		// Add the name as primary alias
		err = qtx.InsertArtistAlias(ctx, repository.InsertArtistAliasParams{
			ArtistID:  newArtist.ID,
			Alias:     artistName,
			Source:    "manual",
			IsPrimary: true,
		})
		if err != nil {
			return fmt.Errorf("SplitArtists: InsertArtistAlias for '%s': %w", artistName, err)
		}
		
		allTargetIds = append(allTargetIds, newArtist.ID)
		l.Debug().Msgf("Created new artist '%s' with ID %d", artistName, newArtist.ID)
	}
	
	// For each target artist, associate the tracks and releases
	for _, targetId := range allTargetIds {
		// Associate tracks with target artist (preserving is_primary from original)
		for _, trackAssoc := range originalTrackAssociations {
			err = qtx.AssociateArtistToTrack(ctx, repository.AssociateArtistToTrackParams{
				ArtistID:  targetId,
				TrackID:   trackAssoc.TrackID,
				IsPrimary: trackAssoc.IsPrimary,
			})
			if err != nil {
				return fmt.Errorf("SplitArtists: AssociateArtistToTrack: %w", err)
			}
		}
		
		// Associate releases with target artist (preserving is_primary from original)
		for _, releaseAssoc := range originalReleaseAssociations {
			err = qtx.AssociateArtistToRelease(ctx, repository.AssociateArtistToReleaseParams{
				ArtistID:  targetId,
				ReleaseID: releaseAssoc.ReleaseID,
				IsPrimary: releaseAssoc.IsPrimary,
			})
			if err != nil {
				return fmt.Errorf("SplitArtists: AssociateArtistToRelease: %w", err)
			}
		}
	}
	
	// Clean up orphaned entries
	err = qtx.CleanOrphanedEntries(ctx)
	if err != nil {
		l.Err(err).Msg("Failed to clean orphaned entries")
		return fmt.Errorf("SplitArtists: CleanOrphanedEntries: %w", err)
	}
	
	return tx.Commit(ctx)
}

func (d *Psql) MergeAlbums(ctx context.Context, fromId, toId int32, replaceImage bool) error {
	l := logger.FromContext(ctx)
	l.Info().Msgf("Merging album %d into album %d", fromId, toId)
	tx, err := d.conn.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		l.Err(err).Msg("Failed to begin transaction")
		return fmt.Errorf("MergeAlbums: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := d.q.WithTx(tx)

	fromArtists, err := qtx.GetReleaseArtists(ctx, fromId)
	if err != nil {
		return fmt.Errorf("MergeAlbums: GetReleaseArtists: %w", err)
	}

	err = qtx.UpdateReleaseForAll(ctx, repository.UpdateReleaseForAllParams{
		ReleaseID:   fromId,
		ReleaseID_2: toId,
	})
	if err != nil {
		return fmt.Errorf("MergeAlbums: %w", err)
	}
	if replaceImage {
		old, err := qtx.GetRelease(ctx, fromId)
		if err != nil {
			return fmt.Errorf("MergeAlbums: %w", err)
		}
		err = qtx.UpdateReleaseImage(ctx, repository.UpdateReleaseImageParams{
			ID:          toId,
			Image:       old.Image,
			ImageSource: old.ImageSource,
		})
		if err != nil {
			return fmt.Errorf("MergeAlbums: %w", err)
		}
	}

	for _, artist := range fromArtists {
		err = qtx.AssociateArtistToRelease(ctx, repository.AssociateArtistToReleaseParams{
			ArtistID:  artist.ID,
			ReleaseID: toId,
		})
		if err != nil {
			return fmt.Errorf("MergeAlbums: AssociateArtistToRelease: %w", err)
		}
	}

	err = qtx.CleanOrphanedEntries(ctx)
	if err != nil {
		l.Err(err).Msg("Failed to clean orphaned entries")
		return fmt.Errorf("MergeAlbums: CleanOrphanedEntries: %w", err)
	}
	return tx.Commit(ctx)
}

func (d *Psql) MergeArtists(ctx context.Context, fromId, toId int32, replaceImage bool) error {
	l := logger.FromContext(ctx)
	l.Info().Msgf("Merging artist %d into artist %d", fromId, toId)
	tx, err := d.conn.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		l.Err(err).Msg("Failed to begin transaction")
		return fmt.Errorf("MergeArtists: %w", err)
	}
	defer tx.Rollback(ctx)
	qtx := d.q.WithTx(tx)
	err = qtx.DeleteConflictingArtistTracks(ctx, repository.DeleteConflictingArtistTracksParams{
		ArtistID:   fromId,
		ArtistID_2: toId,
	})
	if err != nil {
		l.Err(err).Msg("Failed to delete conflicting artist tracks")
		return fmt.Errorf("MergeArtists: %w", err)
	}
	err = qtx.DeleteConflictingArtistReleases(ctx, repository.DeleteConflictingArtistReleasesParams{
		ArtistID:   fromId,
		ArtistID_2: toId,
	})
	if err != nil {
		l.Err(err).Msg("Failed to delete conflicting artist releases")
		return fmt.Errorf("MergeArtists: %w", err)
	}
	err = qtx.UpdateArtistTracks(ctx, repository.UpdateArtistTracksParams{
		ArtistID:   fromId,
		ArtistID_2: toId,
	})
	if err != nil {
		l.Err(err).Msg("Failed to update artist tracks")
		return fmt.Errorf("MergeArtists: %w", err)
	}
	err = qtx.UpdateArtistReleases(ctx, repository.UpdateArtistReleasesParams{
		ArtistID:   fromId,
		ArtistID_2: toId,
	})
	if err != nil {
		l.Err(err).Msg("Failed to update artist releases")
		return fmt.Errorf("MergeArtists: %w", err)
	}
	if replaceImage {
		old, err := qtx.GetArtist(ctx, fromId)
		if err != nil {
			return fmt.Errorf("MergeAlbums: %w", err)
		}
		err = qtx.UpdateArtistImage(ctx, repository.UpdateArtistImageParams{
			ID:          toId,
			Image:       old.Image,
			ImageSource: old.ImageSource,
		})
		if err != nil {
			return fmt.Errorf("MergeAlbums: %w", err)
		}
	}
	err = qtx.CleanOrphanedEntries(ctx)
	if err != nil {
		l.Err(err).Msg("Failed to clean orphaned entries")
		return fmt.Errorf("MergeArtists: %w", err)
	}
	return tx.Commit(ctx)
}
