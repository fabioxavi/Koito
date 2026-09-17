package psql

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/models"
	"github.com/gabehf/koito/internal/repository"
)

type duplicateListenRow struct {
	TrackID         int32
	TrackTitle      string
	Artists         []byte
	PreviousListen  time.Time
	DuplicateListen time.Time
	DurationSeconds int32
	DiffSeconds     int32
}

func (d *Psql) GetListensPaginated(ctx context.Context, opts db.GetItemsOpts) (*db.PaginatedResponse[*models.Listen], error) {
	l := logger.FromContext(ctx)
	offset := (opts.Page - 1) * opts.Limit
	t1, t2 := db.TimeframeToTimeRange(opts.Timeframe)
	if opts.Limit == 0 {
		opts.Limit = DefaultItemsPerPage
	}
	var listens []*models.Listen
	var count int64
	if opts.TrackID > 0 {
		l.Debug().Msgf("Fetching %d listens on page %d from range %v to %v",
			opts.Limit, opts.Page, t1.Format("Jan 02, 2006"), t2.Format("Jan 02, 2006"))
		rows, err := d.q.GetLastListensFromTrackPaginated(ctx, repository.GetLastListensFromTrackPaginatedParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			Limit:        int32(opts.Limit),
			Offset:       int32(offset),
			ID:           int32(opts.TrackID),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: GetLastListensFromTrackPaginated: %w", err)
		}
		listens = make([]*models.Listen, len(rows))
		for i, row := range rows {
			t := &models.Listen{
				Track: models.Track{
					Title: row.TrackTitle,
					ID:    row.TrackID,
				},
				Time: row.ListenedAt,
			}
			err = json.Unmarshal(row.Artists, &t.Track.Artists)
			if err != nil {
				return nil, fmt.Errorf("GetListensPaginated: Unmarshal: %w", err)
			}
			listens[i] = t
		}
		count, err = d.q.CountListensFromTrack(ctx, repository.CountListensFromTrackParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			TrackID:      int32(opts.TrackID),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: CountListensFromTrack: %w", err)
		}
	} else if opts.AlbumID > 0 {
		l.Debug().Msgf("Fetching %d listens on page %d from range %v to %v",
			opts.Limit, opts.Page, t1.Format("Jan 02, 2006"), t2.Format("Jan 02, 2006"))
		rows, err := d.q.GetLastListensFromReleasePaginated(ctx, repository.GetLastListensFromReleasePaginatedParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			Limit:        int32(opts.Limit),
			Offset:       int32(offset),
			ReleaseID:    int32(opts.AlbumID),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: GetLastListensFromReleasePaginated: %w", err)
		}
		listens = make([]*models.Listen, len(rows))
		for i, row := range rows {
			t := &models.Listen{
				Track: models.Track{
					Title: row.TrackTitle,
					ID:    row.TrackID,
				},
				Time: row.ListenedAt,
			}
			err = json.Unmarshal(row.Artists, &t.Track.Artists)
			if err != nil {
				return nil, fmt.Errorf("GetListensPaginated: Unmarshal: %w", err)
			}
			listens[i] = t
		}
		count, err = d.q.CountListensFromRelease(ctx, repository.CountListensFromReleaseParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			ReleaseID:    int32(opts.AlbumID),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: CountListensFromRelease: %w", err)
		}
	} else if opts.ArtistID > 0 {
		l.Debug().Msgf("Fetching %d listens on page %d from range %v to %v",
			opts.Limit, opts.Page, t1.Format("Jan 02, 2006"), t2.Format("Jan 02, 2006"))
		rows, err := d.q.GetLastListensFromArtistPaginated(ctx, repository.GetLastListensFromArtistPaginatedParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			Limit:        int32(opts.Limit),
			Offset:       int32(offset),
			ArtistID:     int32(opts.ArtistID),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: GetLastListensFromArtistPaginated: %w", err)
		}
		listens = make([]*models.Listen, len(rows))
		for i, row := range rows {
			t := &models.Listen{
				Track: models.Track{
					Title: row.TrackTitle,
					ID:    row.TrackID,
				},
				Time: row.ListenedAt,
			}
			err = json.Unmarshal(row.Artists, &t.Track.Artists)
			if err != nil {
				return nil, fmt.Errorf("GetListensPaginated: Unmarshal: %w", err)
			}
			listens[i] = t
		}
		count, err = d.q.CountListensFromArtist(ctx, repository.CountListensFromArtistParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			ArtistID:     int32(opts.ArtistID),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: CountListensFromArtist: %w", err)
		}
	} else {
		l.Debug().Msgf("Fetching %d listens on page %d from range %v to %v",
			opts.Limit, opts.Page, t1.Format("Jan 02, 2006"), t2.Format("Jan 02, 2006"))
		rows, err := d.q.GetLastListensPaginated(ctx, repository.GetLastListensPaginatedParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
			Limit:        int32(opts.Limit),
			Offset:       int32(offset),
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: GetLastListensPaginated: %w", err)
		}
		listens = make([]*models.Listen, len(rows))
		for i, row := range rows {
			t := &models.Listen{
				Track: models.Track{
					Title: row.TrackTitle,
					ID:    row.TrackID,
				},
				Time: row.ListenedAt,
			}
			err = json.Unmarshal(row.Artists, &t.Track.Artists)
			if err != nil {
				return nil, fmt.Errorf("GetListensPaginated: Unmarshal: %w", err)
			}
			listens[i] = t
		}
		count, err = d.q.CountListens(ctx, repository.CountListensParams{
			ListenedAt:   t1,
			ListenedAt_2: t2,
		})
		if err != nil {
			return nil, fmt.Errorf("GetListensPaginated: CountListens: %w", err)
		}
		l.Debug().Msgf("Database responded with %d tracks out of a total %d", len(rows), count)
	}

	return &db.PaginatedResponse[*models.Listen]{
		Items:        listens,
		TotalCount:   count,
		ItemsPerPage: int32(opts.Limit),
		HasNextPage:  int64(offset+len(listens)) < count,
		CurrentPage:  int32(opts.Page),
	}, nil
}

func (d *Psql) SaveListen(ctx context.Context, opts db.SaveListenOpts) error {
	l := logger.FromContext(ctx)
	if opts.TrackID == 0 {
		return errors.New("required parameter TrackID missing")
	}
	if opts.Time.IsZero() {
		opts.Time = time.Now()
	}
	var client *string
	if opts.Client != "" {
		client = &opts.Client
	}
	l.Debug().Msgf("Inserting listen for track with id %d at time %v into DB", opts.TrackID, opts.Time)
	return d.q.InsertListen(ctx, repository.InsertListenParams{
		TrackID:    opts.TrackID,
		ListenedAt: opts.Time,
		UserID:     opts.UserID,
		Client:     client,
	})
}

func (d *Psql) DeleteListen(ctx context.Context, trackId int32, listenedAt time.Time) error {
	l := logger.FromContext(ctx)
	if trackId == 0 {
		return errors.New("required parameter 'trackId' missing")
	}
	l.Debug().Msgf("Deleting listen from track %d at time %s from DB", trackId, listenedAt)
	return d.q.DeleteListen(ctx, repository.DeleteListenParams{
		TrackID:    trackId,
		ListenedAt: listenedAt,
	})
}

func (d *Psql) GetDuplicateListens(ctx context.Context, opts db.GetItemsOpts) ([]db.DuplicateListen, error) {
	t1, t2 := db.TimeframeToTimeRange(opts.Timeframe)
	limit := opts.Limit
	if limit <= 0 {
		limit = DefaultItemsPerPage
	}
	offset := (opts.Page - 1) * limit
	if opts.Page <= 0 {
		offset = 0
	}

	const query = `
		SELECT
			t.id AS track_id,
			t.title AS track_title,
			get_artists_for_track(t.id) AS artists,
			l1.listened_at AS previous_listen,
			l2.listened_at AS duplicate_listen,
			t.duration AS duration_seconds,
			EXTRACT(EPOCH FROM (l2.listened_at - l1.listened_at))::int AS diff_seconds
		FROM listens l1
		JOIN listens l2 ON l1.track_id = l2.track_id AND l2.listened_at > l1.listened_at
		JOIN tracks_with_title t ON l1.track_id = t.id
		WHERE l1.listened_at BETWEEN $1 AND $2
			AND l2.listened_at BETWEEN $1 AND $2
			AND EXTRACT(EPOCH FROM (l2.listened_at - l1.listened_at)) < t.duration
		ORDER BY l2.listened_at DESC
		LIMIT $3 OFFSET $4;
	`

	rows, err := d.conn.Query(ctx, query, t1, t2, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("GetDuplicateListens: query failed: %w", err)
	}
	defer rows.Close()

	duplicates := make([]db.DuplicateListen, 0, limit)
	for rows.Next() {
		var row duplicateListenRow
		if err := rows.Scan(
			&row.TrackID,
			&row.TrackTitle,
			&row.Artists,
			&row.PreviousListen,
			&row.DuplicateListen,
			&row.DurationSeconds,
			&row.DiffSeconds,
		); err != nil {
			return nil, fmt.Errorf("GetDuplicateListens: scan failed: %w", err)
		}

		var artists []models.SimpleArtist
		if err := json.Unmarshal(row.Artists, &artists); err != nil {
			return nil, fmt.Errorf("GetDuplicateListens: artists unmarshal failed: %w", err)
		}
		duplicates = append(duplicates, db.DuplicateListen{
			TrackID:         row.TrackID,
			TrackTitle:      row.TrackTitle,
			Artists:         artists,
			PreviousListen:  row.PreviousListen,
			DuplicateListen: row.DuplicateListen,
			DurationSeconds: row.DurationSeconds,
			DiffSeconds:     row.DiffSeconds,
		})
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("GetDuplicateListens: rows iteration failed: %w", err)
	}

	return duplicates, nil
}
