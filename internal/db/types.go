package db

import (
	"time"

	"github.com/gabehf/koito/internal/models"
	"github.com/google/uuid"
)

type InformationSource string

const (
	InformationSourceInferred     InformationSource = "Inferred"
	InformationSourceMusicBrainz  InformationSource = "MusicBrainz"
	InformationSourceUserProvided InformationSource = "User"
)

type ListenActivityItem struct {
	Start   time.Time `json:"start_time"`
	Listens int64     `json:"listens"`
}

type PaginatedResponse[T any] struct {
	Items        []T   `json:"items"`
	TotalCount   int64 `json:"total_record_count"`
	ItemsPerPage int32 `json:"items_per_page"`
	HasNextPage  bool  `json:"has_next_page"`
	CurrentPage  int32 `json:"current_page"`
}

type RankedItem[T any] struct {
	Item T     `json:"item"`
	Rank int64 `json:"rank"`
}

type ExportItem struct {
	ListenedAt         time.Time
	UserID             int32
	Client             *string
	TrackID            int32
	TrackMbid          *uuid.UUID
	TrackDuration      int32
	TrackAliases       []models.Alias
	ReleaseID          int32
	ReleaseMbid        *uuid.UUID
	ReleaseImage       *uuid.UUID
	ReleaseImageSource string
	VariousArtists     bool
	ReleaseAliases     []models.Alias
	Artists            []models.ArtistWithFullAliases
}

type InterestBucket struct {
	BucketStart time.Time `json:"bucket_start"`
	BucketEnd   time.Time `json:"bucket_end"`
	ListenCount int64     `json:"listen_count"`
}

type DuplicateListen struct {
	TrackID         int32     `json:"track_id"`
	TrackTitle      string    `json:"track_title"`
	Artists         []models.SimpleArtist `json:"artists"`
	PreviousListen  time.Time `json:"previous_listen"`
	DuplicateListen time.Time `json:"duplicate_listen"`
	DurationSeconds int32     `json:"duration_seconds"`
	DiffSeconds     int32     `json:"diff_seconds"`
}

type ItemWithoutListens struct {
	ID   int32  `json:"id"`
	Name string `json:"name"`
}

type CleanModeCandidates struct {
	Artists []ItemWithoutListens `json:"artists"`
	Albums  []ItemWithoutListens `json:"albums"`
	Tracks  []ItemWithoutListens `json:"tracks"`
}
