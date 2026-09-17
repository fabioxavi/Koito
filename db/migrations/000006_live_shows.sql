-- +goose Up
-- Live Shows feature: Store attended concerts with Setlist.fm integration
-- Tables for linking artists/songs from Setlist.fm to Koito's database

-- Live shows attended by the user
CREATE TABLE live_shows (
    id SERIAL PRIMARY KEY,
    setlistfm_id VARCHAR(255) UNIQUE, -- Setlist.fm setlist ID
    artist_name VARCHAR(255) NOT NULL, -- Artist name as returned by Setlist.fm
    venue_name VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    event_date DATE NOT NULL,
    tour_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link between Setlist.fm artists and Koito artists
-- Allows manual matching when automatic matching fails
CREATE TABLE live_show_artists (
    id SERIAL PRIMARY KEY,
    live_show_id INTEGER NOT NULL REFERENCES live_shows(id) ON DELETE CASCADE,
    setlistfm_artist_name VARCHAR(255) NOT NULL, -- Name from Setlist.fm
    koito_artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL, -- Linked Koito artist (can be NULL for manual linking)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(live_show_id, setlistfm_artist_name)
);

-- Link between Setlist.fm songs and Koito songs
CREATE TABLE live_show_songs (
    id SERIAL PRIMARY KEY,
    live_show_id INTEGER NOT NULL REFERENCES live_shows(id) ON DELETE CASCADE,
    setlistfm_song_name VARCHAR(255) NOT NULL, -- Song name from Setlist.fm
    koito_song_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL, -- Linked Koito song (can be NULL for manual linking)
    song_order INTEGER, -- Position in setlist
    is_cover BOOLEAN DEFAULT FALSE,
    cover_artist_name VARCHAR(255), -- If it's a cover, the original artist name
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(live_show_id, setlistfm_song_name, song_order)
);

-- Index for faster queries
CREATE INDEX idx_live_shows_event_date ON live_shows(event_date);
CREATE INDEX idx_live_shows_artist_name ON live_shows(artist_name);
CREATE INDEX idx_live_show_artists_live_show_id ON live_show_artists(live_show_id);
CREATE INDEX idx_live_show_songs_live_show_id ON live_show_songs(live_show_id);

-- +goose Down
DROP TABLE IF EXISTS live_show_songs;
DROP TABLE IF EXISTS live_show_artists;
DROP TABLE IF EXISTS live_shows;
