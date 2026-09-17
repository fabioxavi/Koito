package handlers

import (
	"net/http"

	"github.com/gabehf/koito/internal/db"
	"github.com/gabehf/koito/internal/logger"
	"github.com/gabehf/koito/internal/utils"
)

func GetCleanModeCandidatesHandler(store db.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		l := logger.FromContext(ctx)

		candidates, err := store.GetCleanModeCandidates(ctx)
		if err != nil {
			l.Err(err).Msg("GetCleanModeCandidatesHandler: Failed to retrieve candidates")
			utils.WriteError(w, "failed to get clean mode candidates: "+err.Error(), http.StatusBadRequest)
			return
		}

		utils.WriteJSON(w, http.StatusOK, candidates)
	}
}
