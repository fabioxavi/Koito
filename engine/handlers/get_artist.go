package handlers

import (
	"net/http"
	"strconv"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/db/psql" // <-- ADICIONA ESTA LINHA
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/utils"
)

func GetArtistHandler(store db.DB) func(w http.ResponseWriter, r *http.Request) {
    return func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()
        l := logger.FromContext(ctx)
        psqlDB := store.(*psql.Psql) // Precisamos disto para a query manual

        l.Debug().Msg("GetArtistHandler: Received request to retrieve artist")

        idStr := r.URL.Query().Get("id")
        if idStr == "" {
            l.Debug().Msg("GetArtistHandler: Missing artist ID in request")
            utils.WriteError(w, "id must be provided", http.StatusBadRequest)
            return
        }

        id, err := strconv.Atoi(idStr)
        if err != nil {
            l.Debug().AnErr("error", err).Msg("GetArtistHandler: Invalid artist ID")
            utils.WriteError(w, "id is invalid", http.StatusBadRequest)
            return
        }

        artist, err := store.GetArtist(ctx, db.GetArtistOpts{ID: int32(id)})
        if err != nil {
            l.Err(err).Msgf("GetArtistHandler: Failed to retrieve artist with ID %d", id)
            utils.WriteError(w, "artist with specified id could not be found", http.StatusNotFound)
            return
        }

        // --- NOVO CÓDIGO PARA O CONTADOR ---
        var liveCount int
        err = psqlDB.QueryRow(ctx, `
            SELECT COUNT(*) 
            FROM live_show_artists 
            WHERE koito_artist_id = $1
        `, id).Scan(&liveCount)
        if err != nil {
            l.Debug().Err(err).Msg("Failed to count live shows")
            liveCount = 0
        }
        // -----------------------------------

        l.Debug().Msgf("GetArtistHandler: Successfully retrieved artist with ID %d", id)

        // Enviamos um objeto que junta o artista e o contador
        utils.WriteJSON(w, http.StatusOK, map[string]interface{}{
            "artist":    artist,
            "liveCount": liveCount,
        })
    }
}
