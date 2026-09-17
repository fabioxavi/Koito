package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"

	"github.com/gabehf/koito/internal/cfg"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/utils"
)

type SpotifyTokenResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	ExpiresIn   int    `json:"expires_in"`
}

type SpotifySearchResponse struct {
	Artists *SpotifyArtists `json:"artists,omitempty"`
	Albums  *SpotifyAlbums  `json:"albums,omitempty"`
}

type SpotifyArtists struct {
	Items []SpotifyArtist `json:"items"`
}

type SpotifyArtist struct {
	Images []SpotifyImage `json:"images"`
	Name   string         `json:"name"`
}

type SpotifyAlbums struct {
	Items []SpotifyAlbum `json:"items"`
}

type SpotifyAlbum struct {
	Images []SpotifyImage `json:"images"`
	Name   string         `json:"name"`
}

type SpotifyImage struct {
	URL    string `json:"url"`
	Height int    `json:"height"`
	Width  int    `json:"width"`
}

type SearchImagesResponse struct {
	Images []ImageResult `json:"images"`
}

type ImageResult struct {
	URL    string `json:"url"`
	Source string `json:"source"`
	Width  int    `json:"width,omitempty"`
	Height int    `json:"height,omitempty"`
}

func SearchImagesHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		query := r.URL.Query().Get("q")
		searchType := r.URL.Query().Get("type") // "artist" or "album"

		if query == "" {
			utils.WriteError(w, "query parameter is required", http.StatusBadRequest)
			return
		}

		if searchType != "artist" && searchType != "album" {
			searchType = "artist"
		}

		results := []ImageResult{}

		// Search Spotify if enabled
		l.Debug().Msgf("SearchImages: Spotify enabled=%t, client_id set=%t", cfg.SpotifyEnabled(), cfg.SpotifyClientId() != "")
		if cfg.SpotifyEnabled() {
			l.Debug().Msg("SearchImages: Searching Spotify")
			spotifyImages, err := searchSpotify(query, searchType)
			if err != nil {
				l.Err(err).Msg("SearchImages: Spotify search failed")
			} else {
				l.Debug().Msgf("SearchImages: Spotify returned %d images", len(spotifyImages))
				results = append(results, spotifyImages...)
			}
		} else {
			l.Debug().Msg("SearchImages: Spotify not enabled - check KOITO_SPOTIFY_CLIENT_ID and KOITO_SPOTIFY_CLIENT_SECRET env vars")
		}

		// Remove duplicates
		seen := make(map[string]bool)
		uniqueResults := []ImageResult{}
		for _, img := range results {
			if !seen[img.URL] {
				seen[img.URL] = true
				uniqueResults = append(uniqueResults, img)
			}
		}

		utils.WriteJSON(w, http.StatusOK, SearchImagesResponse{
			Images: uniqueResults,
		})
	}
}

func searchSpotify(query, searchType string) ([]ImageResult, error) {
	// Get access token
	token, err := getSpotifyAccessToken()
	if err != nil {
		return nil, fmt.Errorf("failed to get Spotify token: %w", err)
	}

	// Search with increased limit and market parameter for better results
	searchURL := fmt.Sprintf("https://api.spotify.com/v1/search?q=%s&type=%s&limit=20&market=US",
		url.QueryEscape(query), searchType)

	req, err := http.NewRequest("GET", searchURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Spotify search returned status %d: %s", resp.StatusCode, string(body))
	}

	var searchResp SpotifySearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}

	results := []ImageResult{}

	if searchType == "artist" && searchResp.Artists != nil {
		fmt.Printf("Spotify: Found %d artists\n", len(searchResp.Artists.Items))
		for i, artist := range searchResp.Artists.Items {
			fmt.Printf("Spotify Artist %d: %s has %d images\n", i, artist.Name, len(artist.Images))
			for _, img := range artist.Images {
				if img.URL != "" {
					results = append(results, ImageResult{
						URL:    img.URL,
						Source: "Spotify",
						Width:  img.Width,
						Height: img.Height,
					})
				}
			}
		}
	} else if searchType == "album" && searchResp.Albums != nil {
		fmt.Printf("Spotify: Found %d albums\n", len(searchResp.Albums.Items))
		for i, album := range searchResp.Albums.Items {
			fmt.Printf("Spotify Album %d: %s has %d images\n", i, album.Name, len(album.Images))
			for _, img := range album.Images {
				if img.URL != "" {
					results = append(results, ImageResult{
						URL:    img.URL,
						Source: "Spotify",
						Width:  img.Width,
						Height: img.Height,
					})
				}
			}
		}
	}

	fmt.Printf("Spotify: Total images found: %d\n", len(results))
	return results, nil
}

func getSpotifyAccessToken() (string, error) {
	clientId := cfg.SpotifyClientId()
	clientSecret := cfg.SpotifyClientSecret()

	fmt.Printf("Spotify Token: clientId length=%d, clientSecret length=%d\n", len(clientId), len(clientSecret))
	// Debug: show first/last chars to detect whitespace issues
	if len(clientId) > 4 {
		fmt.Printf("Spotify Token: clientId starts with '%s' ends with '%s'\n", clientId[:4], clientId[len(clientId)-4:])
	}
	if len(clientSecret) > 4 {
		fmt.Printf("Spotify Token: clientSecret starts with '%s' ends with '%s'\n", clientSecret[:4], clientSecret[len(clientSecret)-4:])
	}

	// Trim whitespace
	clientId = strings.TrimSpace(clientId)
	clientSecret = strings.TrimSpace(clientSecret)

	if clientId == "" || clientSecret == "" {
		return "", fmt.Errorf("Spotify credentials not configured")
	}

	credentials := base64.StdEncoding.EncodeToString([]byte(clientId + ":" + clientSecret))

	data := url.Values{}
	data.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Basic "+credentials)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Spotify token endpoint returned status %d: %s", resp.StatusCode, string(body))
	}

	var tokenResp SpotifyTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}

	fmt.Printf("Spotify Token: obtained token (length=%d)\n", len(tokenResp.AccessToken))
	return tokenResp.AccessToken, nil
}
