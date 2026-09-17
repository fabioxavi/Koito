package psql

import (
	"context"
	"fmt"

	"github.com/gabehf/koito/internal/db"
)

func (d *Psql) GetCleanModeCandidates(ctx context.Context) (*db.CleanModeCandidates, error) {
	artists, err := d.getArtistsWithoutListens(ctx)
	if err != nil {
		return nil, err
	}
	albums, err := d.getAlbumsWithoutListens(ctx)
	if err != nil {
		return nil, err
	}
	tracks, err := d.getTracksWithoutListens(ctx)
	if err != nil {
		return nil, err
	}

	return &db.CleanModeCandidates{
		Artists: artists,
		Albums:  albums,
		Tracks:  tracks,
	}, nil
}

func (d *Psql) getArtistsWithoutListens(ctx context.Context) ([]db.ItemWithoutListens, error) {
	const query = `
		SELECT a.id, a.name
		FROM artists_with_name a
		WHERE NOT EXISTS (
			SELECT 1
			FROM artist_tracks at
			JOIN listens l ON l.track_id = at.track_id
			WHERE at.artist_id = a.id
		)
		ORDER BY a.name ASC;
	`
	rows, err := d.conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("getArtistsWithoutListens: query failed: %w", err)
	}
	defer rows.Close()
	items := make([]db.ItemWithoutListens, 0)
	for rows.Next() {
		var item db.ItemWithoutListens
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, fmt.Errorf("getArtistsWithoutListens: scan failed: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (d *Psql) getAlbumsWithoutListens(ctx context.Context) ([]db.ItemWithoutListens, error) {
	const query = `
		SELECT r.id, r.title
		FROM releases_with_title r
		WHERE NOT EXISTS (
			SELECT 1
			FROM tracks t
			JOIN listens l ON l.track_id = t.id
			WHERE t.release_id = r.id
		)
		ORDER BY r.title ASC;
	`
	rows, err := d.conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("getAlbumsWithoutListens: query failed: %w", err)
	}
	defer rows.Close()
	items := make([]db.ItemWithoutListens, 0)
	for rows.Next() {
		var item db.ItemWithoutListens
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, fmt.Errorf("getAlbumsWithoutListens: scan failed: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func (d *Psql) getTracksWithoutListens(ctx context.Context) ([]db.ItemWithoutListens, error) {
	const query = `
		SELECT t.id, t.title
		FROM tracks_with_title t
		WHERE NOT EXISTS (
			SELECT 1
			FROM listens l
			WHERE l.track_id = t.id
		)
		ORDER BY t.title ASC;
	`
	rows, err := d.conn.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("getTracksWithoutListens: query failed: %w", err)
	}
	defer rows.Close()
	items := make([]db.ItemWithoutListens, 0)
	for rows.Next() {
		var item db.ItemWithoutListens
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			return nil, fmt.Errorf("getTracksWithoutListens: scan failed: %w", err)
		}
		items = append(items, item)
	}
	return items, rows.Err()
}
