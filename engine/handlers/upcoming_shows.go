package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gabehf/koito/internal/cfg"
	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/memkv"
	"github.com/gabehf/koito/internal/models"
	"github.com/gabehf/koito/internal/utils"
)

// Bandsintown API response structures
type BandsintownEvent struct {
	ID       string           `json:"id"`
	URL      string           `json:"url"`
	Datetime string           `json:"datetime"`
	Venue    BandsintownVenue `json:"venue"`
	Lineup   []string         `json:"lineup"`
}

type BandsintownVenue struct {
	Name    string `json:"name"`
	City    string `json:"city"`
	Region  string `json:"region"`
	Country string `json:"country"`
}

// UpcomingShow is a single upcoming concert for an artist the user listens to.
type UpcomingShow struct {
	ArtistID   int32   `json:"artist_id"`
	ArtistName string  `json:"artist_name"`
	ArtistRank int64   `json:"artist_rank"`
	EventID    string  `json:"event_id"`
	EventURL   string  `json:"event_url"`
	Datetime   string  `json:"datetime"`
	VenueName  string  `json:"venue_name"`
	City       string  `json:"city"`
	Region     string  `json:"region,omitempty"`
	Country    string  `json:"country"`
}

const bandsintownCacheTTL = 12 * time.Hour

// fetchBandsintownEvents fetches upcoming events for an artist from Bandsintown,
// using an in-memory cache to avoid re-fetching the same artist on every request.
func fetchBandsintownEvents(artistName string) ([]BandsintownEvent, error) {
	cacheKey := "bandsintown:events:" + strings.ToLower(artistName)
	if cached, ok := memkv.Store.Get(cacheKey); ok {
		return cached.([]BandsintownEvent), nil
	}

	reqURL := fmt.Sprintf(
		"https://rest.bandsintown.com/artists/%s/events?app_id=%s&date=upcoming",
		url.PathEscape(artistName),
		url.QueryEscape(cfg.BandsintownAppId()),
	)

	resp, err := http.Get(reqURL)
	if err != nil {
		return nil, fmt.Errorf("fetchBandsintownEvents: request failed: %w", err)
	}
	defer resp.Body.Close()

	// Bandsintown returns 404 for artists it doesn't know about; treat as "no shows".
	if resp.StatusCode == http.StatusNotFound {
		memkv.Store.Set(cacheKey, []BandsintownEvent{}, bandsintownCacheTTL)
		return nil, nil
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("fetchBandsintownEvents: unexpected status %d", resp.StatusCode)
	}

	var events []BandsintownEvent
	if err := json.NewDecoder(resp.Body).Decode(&events); err != nil {
		return nil, fmt.Errorf("fetchBandsintownEvents: decode failed: %w", err)
	}

	memkv.Store.Set(cacheKey, events, bandsintownCacheTTL)
	return events, nil
}

func countryAllowed(country string, allowed []string) bool {
	if len(allowed) == 0 {
		return true
	}
	for _, c := range allowed {
		if strings.EqualFold(strings.TrimSpace(c), strings.TrimSpace(country)) {
			return true
		}
	}
	return false
}

// GetUpcomingShowsHandler returns upcoming concerts, sourced from Bandsintown, for the
// user's top listened-to artists.
func GetUpcomingShowsHandler(store db.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		limit := 50
		if v, err := strconv.Atoi(r.URL.Query().Get("artist_limit")); err == nil && v > 0 && v <= 200 {
			limit = v
		}

		artists, err := store.GetTopArtistsPaginated(ctx, db.GetItemsOpts{
			Limit:     limit,
			Timeframe: db.Timeframe{Period: db.PeriodAllTime},
		})
		if err != nil {
			l.Err(err).Msg("GetUpcomingShowsHandler: failed to get top artists")
			utils.WriteError(w, "failed to get top artists", http.StatusInternalServerError)
			return
		}

		allowedCountries := cfg.UpcomingShowsCountries()

		const concurrency = 8
		sem := make(chan struct{}, concurrency)
		var wg sync.WaitGroup
		var mu sync.Mutex
		var shows []UpcomingShow

		for _, ranked := range artists.Items {
			artist := ranked.Item
			wg.Add(1)
			sem <- struct{}{}
			go func(artist *models.Artist, rank int64) {
				defer wg.Done()
				defer func() { <-sem }()

				events, err := fetchBandsintownEvents(artist.Name)
				if err != nil {
					l.Debug().Err(err).Str("artist", artist.Name).Msg("GetUpcomingShowsHandler: failed to fetch events")
					return
				}

				mu.Lock()
				defer mu.Unlock()
				for _, ev := range events {
					if !countryAllowed(ev.Venue.Country, allowedCountries) {
						continue
					}
					shows = append(shows, UpcomingShow{
						ArtistID:   artist.ID,
						ArtistName: artist.Name,
						ArtistRank: rank,
						EventID:    ev.ID,
						EventURL:   ev.URL,
						Datetime:   ev.Datetime,
						VenueName:  ev.Venue.Name,
						City:       ev.Venue.City,
						Region:     ev.Venue.Region,
						Country:    ev.Venue.Country,
					})
				}
			}(artist, ranked.Rank)
		}
		wg.Wait()

		sort.Slice(shows, func(i, j int) bool {
			return shows[i].Datetime < shows[j].Datetime
		})

		utils.WriteJSON(w, http.StatusOK, shows)
	}
}
