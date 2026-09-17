package handlers

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/utils"
)

func SplitArtistsHandler(store db.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		l.Debug().Msg("SplitArtistsHandler: Received request to split artists")

		// Get the artist ID to split from
		fromStr := r.FormValue("from_id")
		fromID, err := strconv.ParseInt(fromStr, 10, 32)
		if err != nil {
			l.Err(err).Msg("SplitArtistsHandler: Invalid from_id parameter")
			utils.WriteError(w, "invalid from_id parameter", http.StatusBadRequest)
			return
		}

		// Get the target artist IDs
		toStr := r.FormValue("to_ids")
		toIDs := []int32{}
		if toStr != "" {
			toStrSlice := strings.Split(toStr, ",")
			for _, idStr := range toStrSlice {
				id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 32)
				if err != nil {
					l.Err(err).Msg("SplitArtistsHandler: Invalid to_ids parameter")
					utils.WriteError(w, "invalid to_ids parameter", http.StatusBadRequest)
					return
				}
				toIDs = append(toIDs, int32(id))
			}
		}

		// Get the create_missing flag
		createMissingStr := r.FormValue("create_missing")
		createMissing := createMissingStr == "true"

		// Get the new artist names to create
		newArtistNamesStr := r.FormValue("new_artist_names")
		newArtistNames := []string{}
		if newArtistNamesStr != "" {
			newArtistNames = strings.Split(newArtistNamesStr, "|")
		}

		l.Debug().Msgf("SplitArtistsHandler: Splitting artist %d into artists %v, create_missing=%t, new_artists=%v", fromID, toIDs, createMissing, newArtistNames)

		// Perform the split operation
		err = store.SplitArtists(ctx, int32(fromID), toIDs, createMissing, newArtistNames)
		if err != nil {
			l.Err(err).Msg("SplitArtistsHandler: Failed to split artists")
			utils.WriteError(w, "failed to split artists", http.StatusInternalServerError)
			return
		}

		l.Debug().Msg("SplitArtistsHandler: Successfully split artists")
		utils.WriteJSON(w, http.StatusOK, map[string]string{"message": "artists split successfully"})
	}
}