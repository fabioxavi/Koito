package handlers

import (
	"encoding/json"
	"io"
	"fmt"
	"net/http"
	"net/url"
	"time"

	"github.com/gabehf/koito/internal/cfg"
	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/db/psql"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/utils"
	"github.com/jackc/pgx/v5"
)

// Setlist.fm API response structures
type SetlistFmResponse struct {
	Setlist []SetlistFmSetlist `json:"setlist"`
	Total   int                `json:"total"`
	Page    int                `json:"page"`
}

type SetlistFmSetlist struct {
	ID       string              `json:"id"`
	EventDate string             `json:"eventDate"`
	Artist   SetlistFmArtist     `json:"artist"`
	Venue    SetlistFmVenue      `json:"venue"`
	Tour     SetlistFmTour       `json:"tour,omitempty"`
	Sets     SetlistFmSets       `json:"sets"`
	URL      string              `json:"url"`
}

type SetlistFmArtist struct {
	Name string `json:"name"`
	MBID string `json:"mbid,omitempty"`
}

type SetlistFmVenue struct {
	Name    string           `json:"name"`
	City    SetlistFmCity    `json:"city"`
}

type SetlistFmCity struct {
	Name    string           `json:"name"`
	Country SetlistFmCountry `json:"country"`
}

type SetlistFmCountry struct {
	Name string `json:"name"`
	Code string `json:"code"`
}

type SetlistFmTour struct {
	Name string `json:"name"`
}

type SetlistFmSets struct {
	Set []SetlistFmSet `json:"set"`
}

type SetlistFmSet struct {
	Song []SetlistFmSong `json:"song"`
}

type SetlistFmSong struct {
	Name   string           `json:"name"`
	Cover  *SetlistFmCover  `json:"cover,omitempty"`
	Info   string           `json:"info,omitempty"`
}

type SetlistFmCover struct {
	Name string `json:"name"`
}

// Request/Response types
type SearchSetlistRequest struct {
	ArtistName string `json:"artist_name"`
}

type ImportSetlistRequest struct {
	SetlistFmID string `json:"setlistfm_id"`
}

type LiveShowResponse struct {
	ID             int       `json:"id"`
	SetlistFmID    string    `json:"setlistfm_id"`
	ArtistName     string    `json:"artist_name"`
	VenueName      string    `json:"venue_name"`
	City           string    `json:"city"`
	Country        string    `json:"country"`
	EventDate      time.Time `json:"event_date"`
	KoitoArtistID  *int      `json:"koito_artist_id"`
	TourName       string    `json:"tour_name"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type LiveShowSongResponse struct {
	ID               int    `json:"id"`
	SetlistFmSongName string `json:"setlistfm_song_name"`
	KoitoSongID      *int   `json:"koito_song_id,omitempty"`
	KoitoSongTitle   string `json:"koito_song_title,omitempty"`
	SongOrder        int    `json:"song_order"`
	IsCover          bool   `json:"is_cover"`
	CoverArtistName  string `json:"cover_artist_name,omitempty"`
}

type LinkArtistRequest struct {
	LiveShowID         int `json:"live_show_id"`
	SetlistFmArtistName string `json:"setlistfm_artist_name"`
	KoitoArtistID      int `json:"koito_artist_id"`
}

type LinkSongRequest struct {
	LiveShowID        int `json:"live_show_id"`
	SetlistFmSongName string `json:"setlistfm_song_name"`
	KoitoSongID       int `json:"koito_song_id"`
}

// SearchSetlistFm searches for setlists on Setlist.fm by artist name
func SearchSetlistFm() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		var req SearchSetlistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteError(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.ArtistName == "" {
			utils.WriteError(w, "artist_name is required", http.StatusBadRequest)
			return
		}

		apiKey := cfg.SetlistFmApiKey()
		if apiKey == "" {
			utils.WriteError(w, "Setlist.fm API key not configured", http.StatusServiceUnavailable)
			return
		}

		// Search on Setlist.fm API
		searchURL := fmt.Sprintf("https://api.setlist.fm/rest/1.0/search/setlists?artistName=%s&p=1",
			url.QueryEscape(req.ArtistName))

		setlistReq, err := http.NewRequest("GET", searchURL, nil)
		if err != nil {
			l.Err(err).Msg("Failed to create Setlist.fm request")
			utils.WriteError(w, "failed to create request", http.StatusInternalServerError)
			return
		}

		setlistReq.Header.Set("Accept", "application/json")
		setlistReq.Header.Set("x-api-key", apiKey)

		resp, err := http.DefaultClient.Do(setlistReq)
		if err != nil {
			l.Err(err).Msg("Failed to fetch from Setlist.fm")
			utils.WriteError(w, "failed to fetch from Setlist.fm", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			body, _ := io.ReadAll(resp.Body)
			l.Error().Int("status", resp.StatusCode).Str("response", string(body)).Msg("Setlist.fm API error")
			utils.WriteError(w, "Setlist.fm API error", resp.StatusCode)
			return
		}

		var setlistResp SetlistFmResponse
		if err := json.NewDecoder(resp.Body).Decode(&setlistResp); err != nil {
			l.Err(err).Msg("Failed to decode Setlist.fm response")
			utils.WriteError(w, "failed to decode response", http.StatusInternalServerError)
			return
		}

		utils.WriteJSON(w, http.StatusOK, setlistResp)
	}
}

// GetUserAttendedSetlists fetches all concerts attended by a Setlist.fm user (with pagination)
func GetUserAttendedSetlists() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		userID := r.URL.Query().Get("userId")
		if userID == "" {
			utils.WriteError(w, "userId query parameter is required", http.StatusBadRequest)
			return
		}

		apiKey := cfg.SetlistFmApiKey()
		if apiKey == "" {
			utils.WriteError(w, "Setlist.fm API key not configured", http.StatusServiceUnavailable)
			return
		}

		// Fetch all pages of attended concerts
		allSetlists := []SetlistFmSetlist{}
		page := 1
		maxPages := 50 // Safety limit

		for page <= maxPages {
			attendedURL := fmt.Sprintf("https://api.setlist.fm/rest/1.0/user/%s/attended?p=%d", url.QueryEscape(userID), page)

			setlistReq, err := http.NewRequest("GET", attendedURL, nil)
			if err != nil {
				l.Err(err).Msg("Failed to create Setlist.fm request")
				utils.WriteError(w, "failed to create request", http.StatusInternalServerError)
				return
			}

			setlistReq.Header.Set("Accept", "application/json")
			setlistReq.Header.Set("x-api-key", apiKey)

			resp, err := http.DefaultClient.Do(setlistReq)
			if err != nil {
				l.Err(err).Msg("Failed to fetch from Setlist.fm")
				utils.WriteError(w, "failed to fetch from Setlist.fm", http.StatusInternalServerError)
				return
			}

			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()

			if resp.StatusCode != http.StatusOK {
				l.Error().Int("status", resp.StatusCode).Str("response", string(body)).Msg("Setlist.fm API error")
				utils.WriteError(w, "Setlist.fm API error", resp.StatusCode)
				return
			}

			var setlistResp SetlistFmResponse
			if err := json.Unmarshal(body, &setlistResp); err != nil {
				l.Err(err).Msg("Failed to decode Setlist.fm response")
				utils.WriteError(w, "failed to decode response", http.StatusInternalServerError)
				return
			}

			if len(setlistResp.Setlist) == 0 {
				break // No more results
			}

			allSetlists = append(allSetlists, setlistResp.Setlist...)

			// Check if we've got all results
			if setlistResp.Total == 0 || len(allSetlists) >= setlistResp.Total {
				break
			}

			page++
		}

		// Return combined response
		response := SetlistFmResponse{
			Setlist: allSetlists,
			Total:   len(allSetlists),
		}

		utils.WriteJSON(w, http.StatusOK, response)
	}
}

// ImportSetlist imports a setlist from Setlist.fm into the database
func ImportSetlist(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		var req ImportSetlistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteError(w, "invalid request body", http.StatusBadRequest)
			return
		}

		if req.SetlistFmID == "" {
			utils.WriteError(w, "setlistfm_id is required", http.StatusBadRequest)
			return
		}

		apiKey := cfg.SetlistFmApiKey()
		if apiKey == "" {
			utils.WriteError(w, "Setlist.fm API key not configured", http.StatusServiceUnavailable)
			return
		}

		// Fetch setlist details
		setlistURL := fmt.Sprintf("https://api.setlist.fm/rest/1.0/setlist/%s", req.SetlistFmID)

		setlistReq, err := http.NewRequest("GET", setlistURL, nil)
		if err != nil {
			l.Err(err).Msg("Failed to create Setlist.fm request")
			utils.WriteError(w, "failed to create request", http.StatusInternalServerError)
			return
		}

		setlistReq.Header.Set("Accept", "application/json")
		setlistReq.Header.Set("x-api-key", apiKey)

		resp, err := http.DefaultClient.Do(setlistReq)
		if err != nil {
			l.Err(err).Msg("Failed to fetch setlist from Setlist.fm")
			utils.WriteError(w, "failed to fetch setlist", http.StatusInternalServerError)
			return
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			l.Error().Int("status", resp.StatusCode).Msg("Setlist.fm API error")
			utils.WriteError(w, "Setlist.fm API error", resp.StatusCode)
			return
		}

		var setlist SetlistFmSetlist
		if err := json.NewDecoder(resp.Body).Decode(&setlist); err != nil {
			l.Err(err).Msg("Failed to decode setlist")
			utils.WriteError(w, "failed to decode setlist", http.StatusInternalServerError)
			return
		}

		// Parse date (format: dd-MM-yyyy)
		eventDate, err := time.Parse("02-01-2006", setlist.EventDate)
		if err != nil {
			l.Err(err).Str("date", setlist.EventDate).Msg("Failed to parse event date")
			eventDate = time.Now()
		}

		// Insert live show
		var liveShowID int
		err = psqlDB.QueryRow(ctx, `
			INSERT INTO live_shows (setlistfm_id, artist_name, venue_name, city, country, event_date, tour_name)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (setlistfm_id) DO UPDATE SET
				artist_name = EXCLUDED.artist_name,
				venue_name = EXCLUDED.venue_name,
				city = EXCLUDED.city,
				country = EXCLUDED.country,
				event_date = EXCLUDED.event_date,
				tour_name = EXCLUDED.tour_name,
				updated_at = CURRENT_TIMESTAMP
			RETURNING id
		`, setlist.ID, setlist.Artist.Name, setlist.Venue.Name, 
			setlist.Venue.City.Name, setlist.Venue.City.Country.Name,
			eventDate, setlist.Tour.Name).Scan(&liveShowID)

		if err != nil {
			l.Err(err).Msg("Failed to insert live show")
			utils.WriteError(w, "failed to save live show", http.StatusInternalServerError)
			return
		}

		// Insert artist link (try to match automatically by name)
		var koitoArtistID *int
		err = psqlDB.QueryRow(ctx, `
			SELECT id FROM artists WHERE LOWER(name) = LOWER($1) LIMIT 1
		`, setlist.Artist.Name).Scan(&koitoArtistID)
		if err != nil {
			l.Debug().Err(err).Str("artist", setlist.Artist.Name).Msg("No matching artist found")
		}

		err = psqlDB.Exec(ctx, `
			INSERT INTO live_show_artists (live_show_id, setlistfm_artist_name, koito_artist_id)
			VALUES ($1, $2, $3)
			ON CONFLICT (live_show_id, setlistfm_artist_name) DO UPDATE SET
				koito_artist_id = EXCLUDED.koito_artist_id
		`, liveShowID, setlist.Artist.Name, koitoArtistID)

		if err != nil {
			l.Err(err).Msg("Failed to insert live show artist")
		}

		// Insert songs
		songOrder := 0
		for _, set := range setlist.Sets.Set {
			for _, song := range set.Song {
				songOrder++

				// Try to match song automatically
				var koitoSongID *int
				if koitoArtistID != nil {
					err = psqlDB.QueryRow(ctx, `
						SELECT s.id FROM songs s
						JOIN song_artists sa ON s.id = sa.song_id
						WHERE LOWER(s.title) = LOWER($1) AND sa.artist_id = $2
						LIMIT 1
					`, song.Name, *koitoArtistID).Scan(&koitoSongID)
					if err != nil {
						l.Debug().Err(err).Str("song", song.Name).Msg("No matching song found")
					}
				}

				coverArtistName := ""
				if song.Cover != nil {
					coverArtistName = song.Cover.Name
				}

				err = psqlDB.Exec(ctx, `
					INSERT INTO live_show_songs (live_show_id, setlistfm_song_name, koito_song_id, song_order, is_cover, cover_artist_name)
					VALUES ($1, $2, $3, $4, $5, $6)
					ON CONFLICT (live_show_id, setlistfm_song_name, song_order) DO UPDATE SET
						koito_song_id = EXCLUDED.koito_song_id,
						is_cover = EXCLUDED.is_cover,
						cover_artist_name = EXCLUDED.cover_artist_name
				`, liveShowID, song.Name, koitoSongID, songOrder, song.Cover != nil, coverArtistName)

				if err != nil {
					l.Err(err).Str("song", song.Name).Msg("Failed to insert live show song")
				}
			}
		}

		utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"id": liveShowID,
			"message": "Setlist imported successfully",
		})
	}
}

// GetLiveShows returns all imported live shows
func GetLiveShows(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		rows, err := psqlDB.Query(ctx, `
			SELECT ls.id, ls.setlistfm_id, ls.artist_name, ls.venue_name, ls.city, ls.country, 
			       ls.event_date, ls.tour_name, ls.created_at, ls.updated_at,
			       lsa.koito_artist_id
			FROM live_shows ls
			LEFT JOIN live_show_artists lsa ON ls.id = lsa.live_show_id
			ORDER BY ls.event_date DESC
		`)
		if err != nil {
			l.Err(err).Msg("Failed to query live shows")
			utils.WriteError(w, "failed to query live shows", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var shows []LiveShowResponse
		for rows.Next() {
			var show LiveShowResponse
			if err := rows.Scan(&show.ID, &show.SetlistFmID, &show.ArtistName, &show.VenueName,
				&show.City, &show.Country, &show.EventDate, &show.TourName, &show.CreatedAt, &show.UpdatedAt,
				&show.KoitoArtistID); err != nil {
				l.Err(err).Msg("Failed to scan live show row")
				continue
			}
			shows = append(shows, show)
		}

		utils.WriteJSON(w, http.StatusOK, shows)
	}
}

// GetLiveShowDetails returns details of a specific live show including songs
func GetLiveShowDetails(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		showID := r.PathValue("id")
		if showID == "" {
			utils.WriteError(w, "show id is required", http.StatusBadRequest)
			return
		}

		// Get show info
		var show LiveShowResponse
		err := psqlDB.QueryRow(ctx, `
			SELECT ls.id, ls.setlistfm_id, ls.artist_name, ls.venue_name, ls.city, ls.country, 
			       ls.event_date, ls.tour_name, ls.created_at, ls.updated_at,
			       lsa.koito_artist_id
			FROM live_shows ls
			LEFT JOIN live_show_artists lsa ON ls.id = lsa.live_show_id
			WHERE ls.id = $1
		`, showID).Scan(&show.ID, &show.SetlistFmID, &show.ArtistName, &show.VenueName,
			&show.City, &show.Country, &show.EventDate, &show.TourName, &show.CreatedAt, &show.UpdatedAt,
			&show.KoitoArtistID)

		if err != nil {
			l.Err(err).Msg("Failed to get live show")
			utils.WriteError(w, "live show not found", http.StatusNotFound)
			return
		}

		// Get songs
		rows, err := psqlDB.Query(ctx, `
			SELECT id, setlistfm_song_name, koito_song_id, song_order, is_cover, cover_artist_name
			FROM live_show_songs
			WHERE live_show_id = $1
			ORDER BY song_order
		`, showID)
		if err != nil {
			l.Err(err).Msg("Failed to query live show songs")
			utils.WriteError(w, "failed to query songs", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		songs := []LiveShowSongResponse{}
		for rows.Next() {
			var song LiveShowSongResponse
			if err := rows.Scan(&song.ID, &song.SetlistFmSongName, &song.KoitoSongID,
				&song.SongOrder, &song.IsCover, &song.CoverArtistName); err != nil {
				l.Err(err).Msg("Failed to scan song row")
				continue
			}
			songs = append(songs, song)
		}

		utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
			"show":  show,
			"songs": songs,
		})
	}
}

// DeleteLiveShow deletes a live show and its related data
func DeleteLiveShow(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		showID := r.PathValue("id")
		if showID == "" {
			utils.WriteError(w, "show id is required", http.StatusBadRequest)
			return
		}

		err := psqlDB.Exec(ctx, `DELETE FROM live_shows WHERE id = $1`, showID)
		if err != nil {
			l.Err(err).Msg("Failed to delete live show")
			utils.WriteError(w, "failed to delete live show", http.StatusInternalServerError)
			return
		}

		utils.WriteJSON(w, http.StatusOK, map[string]string{
			"message": "Live show deleted successfully",
		})
	}
}

// LinkSong manually links a setlist song to a Koito song
func LinkSong(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		var req LinkSongRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteError(w, "invalid request body", http.StatusBadRequest)
			return
		}

		rowsAffected, err := psqlDB.ExecRowsAffected(ctx, `
			UPDATE live_show_songs
			SET koito_song_id = $1
			WHERE live_show_id = $2 AND setlistfm_song_name = $3
		`, req.KoitoSongID, req.LiveShowID, req.SetlistFmSongName)

		if err != nil {
			l.Err(err).Msg("Failed to link song")
			utils.WriteError(w, "failed to link song", http.StatusInternalServerError)
			return
		}

		if rowsAffected == 0 {
			l.Warn().Int("live_show_id", req.LiveShowID).Str("song", req.SetlistFmSongName).
				Msg("Link song matched no rows; setlist entry is missing, try re-importing the show")
			utils.WriteError(w, "no matching setlist song entry found for this show; try re-importing it", http.StatusNotFound)
			return
		}

		utils.WriteJSON(w, http.StatusOK, map[string]string{
			"message": "Song linked successfully",
		})
	}
}

// LinkArtist manually links a setlist artist to a Koito artist
func LinkArtist(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		var req LinkArtistRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			utils.WriteError(w, "invalid request body", http.StatusBadRequest)
			return
		}

		err := psqlDB.Exec(ctx, `
			INSERT INTO live_show_artists (live_show_id, setlistfm_artist_name, koito_artist_id)
			VALUES ($1, $2, $3)
			ON CONFLICT (live_show_id, setlistfm_artist_name) DO UPDATE SET
				koito_artist_id = EXCLUDED.koito_artist_id
		`, req.LiveShowID, req.SetlistFmArtistName, req.KoitoArtistID)

		if err != nil {
			l.Err(err).Msg("Failed to link artist")
			utils.WriteError(w, "failed to link artist", http.StatusInternalServerError)
			return
		}

		utils.WriteJSON(w, http.StatusOK, map[string]string{
			"message": "Artist linked successfully",
		})
	}
}

// SearchKoitoArtistsForMatching searches Koito artists for manual matching
func SearchKoitoArtistsForMatching(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		query := r.URL.Query().Get("q")
		if query == "" {
			utils.WriteJSON(w, http.StatusOK, []interface{}{})
			return
		}

		rows, err := psqlDB.Query(ctx, `
			SELECT id, name FROM artists_with_name
    WHERE name ILIKE $1
    ORDER BY name
    LIMIT 20
`, "%"+query+"%")
		if err != nil {
			l.Err(err).Msg("Failed to search artists")
			utils.WriteError(w, "failed to search artists", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		artists := []map[string]interface{}{}
		for rows.Next() {
			var id int
			var name string
			if err := rows.Scan(&id, &name); err != nil {
				continue
			}
			artists = append(artists, map[string]interface{}{
				"id":   id,
				"name": name,
			})
		}

		utils.WriteJSON(w, http.StatusOK, artists)
	}
}

// SearchKoitoSongsForMatching searches Koito songs for manual matching
func SearchKoitoSongsForMatching(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)
		psqlDB := store.(*psql.Psql)

		query := r.URL.Query().Get("q")
		artistID := r.URL.Query().Get("artist_id")

		if query == "" {
			utils.WriteJSON(w, http.StatusOK, []interface{}{})
			return
		}

		var rows pgx.Rows
		var err error

		if artistID != "" {
			rows, err = psqlDB.Query(ctx, `
				SELECT s.id, s.title, a.name as artist_name
				FROM songs s
				JOIN song_artists sa ON s.id = sa.song_id
				JOIN artists a ON sa.artist_id = a.id
				WHERE LOWER(s.title) LIKE LOWER($1) AND sa.artist_id = $2
				ORDER BY s.title
				LIMIT 20
			`, "%"+query+"%", artistID)
		} else {
			rows, err = psqlDB.Query(ctx, `
				SELECT s.id, s.title, a.name as artist_name
				FROM songs s
				JOIN song_artists sa ON s.id = sa.song_id
				JOIN artists a ON sa.artist_id = a.id
				WHERE LOWER(s.title) LIKE LOWER($1)
				ORDER BY s.title
				LIMIT 20
			`, "%"+query+"%")
		}

		if err != nil {
			l.Err(err).Msg("Failed to search songs")
			utils.WriteError(w, "failed to search songs", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		var songs []map[string]interface{}
		for rows.Next() {
			var id int
			var title, artistName string
			if err := rows.Scan(&id, &title, &artistName); err != nil {
				continue
			}
			songs = append(songs, map[string]interface{}{
				"id":          id,
				"title":       title,
				"artist_name": artistName,
			})
		}

		utils.WriteJSON(w, http.StatusOK, songs)
	}
}
