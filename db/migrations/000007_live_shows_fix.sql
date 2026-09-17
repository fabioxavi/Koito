-- +goose Up
-- Fix for live shows tables (if previous migration failed)

-- Create live_shows table if not exists
CREATE TABLE IF NOT EXISTS live_shows (
    id SERIAL PRIMARY KEY,
    setlistfm_id VARCHAR(255) UNIQUE,
    artist_name VARCHAR(255) NOT NULL,
    venue_name VARCHAR(255),
    city VARCHAR(255),
    country VARCHAR(255),
    event_date DATE NOT NULL,
    tour_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create live_show_artists table if not exists
CREATE TABLE IF NOT EXISTS live_show_artists (
    id SERIAL PRIMARY KEY,
    live_show_id INTEGER NOT NULL REFERENCES live_shows(id) ON DELETE CASCADE,
    setlistfm_artist_name VARCHAR(255) NOT NULL,
    koito_artist_id INTEGER REFERENCES artists(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(live_show_id, setlistfm_artist_name)
);

-- Create live_show_songs table if not exists
CREATE TABLE IF NOT EXISTS live_show_songs (
    id SERIAL PRIMARY KEY,
    live_show_id INTEGER NOT NULL REFERENCES live_shows(id) ON DELETE CASCADE,
    setlistfm_song_name VARCHAR(255) NOT NULL,
    koito_song_id INTEGER REFERENCES tracks(id) ON DELETE SET NULL,
    song_order INTEGER,
    is_cover BOOLEAN DEFAULT FALSE,
    cover_artist_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(live_show_id, setlistfm_song_name, song_order)
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_live_shows_event_date ON live_shows(event_date);
CREATE INDEX IF NOT EXISTS idx_live_shows_artist_name ON live_shows(artist_name);
CREATE INDEX IF NOT EXISTS idx_live_show_artists_live_show_id ON live_show_artists(live_show_id);
CREATE INDEX IF NOT EXISTS idx_live_show_songs_live_show_id ON live_show_songs(live_show_id);

-- +goose Down
DROP TABLE IF EXISTS live_show_songs;
DROP TABLE IF EXISTS live_show_artists;
DROP TABLE IF EXISTS live_shows;
