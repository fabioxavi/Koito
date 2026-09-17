package handlers

import (
	"net/http"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/utils"
)

func GetDuplicateListensHandler(store db.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		opts := OptsFromRequest(r)
		duplicates, err := store.GetDuplicateListens(ctx, opts)
		if err != nil {
			l.Err(err).Msg("GetDuplicateListensHandler: Failed to retrieve duplicate listens")
			utils.WriteError(w, "failed to get duplicate listens: "+err.Error(), http.StatusBadRequest)
			return
		}

		utils.WriteJSON(w, http.StatusOK, duplicates)
	}
}
