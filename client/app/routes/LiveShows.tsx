import { useState, useEffect } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import Card from "~/components/Card";
import { Modal } from "~/components/modals/Modal";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const res = await fetch("/apis/web/v1/live-shows");
  if (!res.ok) {
    if (res.status === 401) {
      throw new Response("Unauthorized", { status: 401 });
    }
    throw new Response("Failed to load live shows", { status: 500 });
  }
  const shows = await res.json();
  return { shows };
}

interface LiveShow {
  id: number;
  setlistfm_id: string;
  artist_name: string;
  venue_name: string;
  city: string;
  country: string;
  event_date: string;
  tour_name: string;
  koito_artist_id?: number;
}

interface LiveShowSong {
  id: number;
  setlistfm_song_name: string;
  koito_song_id?: number;
  koito_song_title?: string;
  song_order: number;
  is_cover: boolean;
  cover_artist_name?: string;
}

interface SetlistResult {
  id: string;
  eventDate: string;
  artist: { name: string; mbid?: string };
  venue: { name: string; city: { name: string; country: { name: string } } };
  tour?: { name: string };
}

interface ArtistMatch {
  id: number;
  name: string;
}

interface SongMatch {
  id: number;
  title: string;
  artist_name: string;
}

export default function LiveShows() {
  const { shows: initialShows } = useLoaderData<{ shows: LiveShow[] }>();
  const [shows, setShows] = useState<LiveShow[]>(initialShows || []);
  const [setlistFmUserId, setSetlistFmUserId] = useState("");
  const [attendedConcerts, setAttendedConcerts] = useState<SetlistResult[]>([]);
  const [fetchingAttended, setFetchingAttended] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showDetails, setShowDetails] = useState<{show: LiveShow; songs: LiveShowSong[]} | null>(null);
  const [editingArtist, setEditingArtist] = useState(false);
  const [editingSong, setEditingSong] = useState<LiveShowSong | null>(null);
  const [artistSearchQuery, setArtistSearchQuery] = useState("");
  const [songSearchQuery, setSongSearchQuery] = useState("");
  const [artistMatches, setArtistMatches] = useState<ArtistMatch[]>([]);
  const [songMatches, setSongMatches] = useState<SongMatch[]>([]);
  const [searchingArtists, setSearchingArtists] = useState(false);
  const [searchingSongs, setSearchingSongs] = useState(false);

  const fetchShows = async () => {
    try {
      const response = await fetch("/apis/web/v1/live-shows");
      if (response.ok) {
        const data = await response.json();
        setShows(data);
      }
    } catch (err) {
      console.error("Failed to fetch live shows:", err);
    }
  };

  const fetchUserAttended = async () => {
    if (!setlistFmUserId.trim()) {
      alert("Please enter your Setlist.fm User ID");
      return;
    }
    setFetchingAttended(true);
    try {
      const response = await fetch(
        `/apis/web/v1/live-shows/user-attended?userId=${encodeURIComponent(setlistFmUserId.trim())}`
      );
      if (response.ok) {
        const data = await response.json();
        setAttendedConcerts(data.setlist || []);
      } else {
        const error = await response.text();
        alert("Failed to fetch attended concerts: " + error);
      }
    } catch (err) {
      console.error("Failed to fetch attended concerts:", err);
      alert("Failed to fetch attended concerts");
    } finally {
      setFetchingAttended(false);
    }
  };

  const importConcert = async (concert: SetlistResult) => {
    setImporting(true);
    try {
      const response = await fetch("/apis/web/v1/live-shows/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ setlistfm_id: concert.id }),
      });
      if (response.ok) {
        await fetchShows();
        setAttendedConcerts(prev => prev.filter(c => c.id !== concert.id));
      } else {
        const error = await response.text();
        alert("Import failed: " + error);
      }
    } catch (err) {
      console.error("Failed to import concert:", err);
      alert("Failed to import concert");
    } finally {
      setImporting(false);
    }
  };

  const fetchShowDetails = async (showId: number) => {
    console.log("Fetching show details for:", showId);
    try {
      const response = await fetch(`/apis/web/v1/live-shows/${showId}`);
      console.log("Response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Show details data:", data);
        setShowDetails(data);
      } else {
        console.error("Failed to fetch show details:", await response.text());
      }
    } catch (err) {
      console.error("Failed to fetch show details:", err);
    }
  };

  const searchArtists = async (query: string) => {
    if (!query.trim()) return;
    setSearchingArtists(true);
    try {
      const response = await fetch(
        `/apis/web/v1/live-shows/search-artists?q=${encodeURIComponent(query)}`
      );
      if (response.ok) {
        const data = await response.json();
        setArtistMatches(data);
      }
    } catch (err) {
      console.error("Failed to search artists:", err);
    } finally {
      setSearchingArtists(false);
    }
  };

  const searchSongs = async (query: string, artistId?: number) => {
    if (!query.trim()) return;
    setSearchingSongs(true);
    try {
      let url = `/apis/web/v1/live-shows/search-songs?q=${encodeURIComponent(query)}`;
      if (artistId) url += `&artist_id=${artistId}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setSongMatches(data);
      }
    } catch (err) {
      console.error("Failed to search songs:", err);
    } finally {
      setSearchingSongs(false);
    }
  };

  const linkArtist = async (showId: number, artistName: string, koitoArtistId: number) => {
    try {
      const response = await fetch("/apis/web/v1/live-shows/link-artist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          live_show_id: showId,
          setlistfm_artist_name: artistName,
          koito_artist_id: koitoArtistId,
        }),
      });
      if (response.ok) {
        setEditingArtist(false);
        await fetchShowDetails(showId);
        await fetchShows();
      } else {
        const body = await response.json().catch(() => null);
        console.error("Failed to link artist:", body?.error || response.statusText);
        alert(body?.error || "Failed to link artist");
      }
    } catch (err) {
      console.error("Failed to link artist:", err);
    }
  };

  const linkSong = async (showId: number, songName: string, koitoSongId: number) => {
    try {
      const response = await fetch("/apis/web/v1/live-shows/link-song", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          live_show_id: showId,
          setlistfm_song_name: songName,
          koito_song_id: koitoSongId,
        }),
      });
      if (response.ok) {
        setEditingSong(null);
        await fetchShowDetails(showId);
      } else {
        const body = await response.json().catch(() => null);
        console.error("Failed to link song:", body?.error || response.statusText);
        alert(body?.error || "Failed to link song");
      }
    } catch (err) {
      console.error("Failed to link song:", err);
    }
  };

  const deleteShow = async (id: number) => {
    if (!confirm("Are you sure you want to delete this live show?")) return;
    try {
      const response = await fetch(`/apis/web/v1/live-shows/${id}`, { method: "DELETE" });
      if (response.ok) {
        await fetchShows();
        setShowDetails(null);
      }
    } catch (err) {
      console.error("Failed to delete show:", err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="pt-8 pb-20 px-5 sm:px-8 sm:pt-12 w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <h1 className="text-2xl sm:text-3xl font-semibold">Live Shows</h1>

      {/* Import from Setlist.fm User */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">Import My Concerts from Setlist.fm</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter your Setlist.fm User ID..."
            value={setlistFmUserId}
            onChange={(e) => setSetlistFmUserId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void fetchUserAttended(); }}
            className="flex-1"
          />
          <button
            onClick={fetchUserAttended}
            disabled={fetchingAttended}
            className="large-button disabled:opacity-50"
          >
            {fetchingAttended ? "Fetching..." : "Fetch My Concerts"}
          </button>
        </div>

        {attendedConcerts.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">
              Found {attendedConcerts.length} concerts you&apos;ve attended
            </h3>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {attendedConcerts.map((concert) => (
                <div key={concert.id} className="rounded-lg p-3 flex justify-between items-start hover:bg-(--color-bg-tertiary)/60 transition-colors">
                  <div>
                    <div className="font-semibold">{concert.artist.name}</div>
                    <div className="text-sm text-(--color-fg-secondary)">
                      {concert.venue.name}, {concert.venue.city.name}, {concert.venue.city.country.name}
                    </div>
                    <div className="text-sm text-(--color-fg-tertiary)">{concert.eventDate}</div>
                    {concert.tour?.name && <div className="text-sm text-(--color-primary)">Tour: {concert.tour.name}</div>}
                  </div>
                  <button
                    onClick={() => void importConcert(concert)}
                    disabled={importing}
                    className="px-3 py-1 rounded-lg bg-(--color-success)/15 text-(--color-success) hover:bg-(--color-success)/25 transition-colors text-sm disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* My Live Shows */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">My Live Shows ({shows.length})</h2>
        {shows.length === 0 ? (
          <div className="text-center py-8 text-(--color-fg-secondary)">
            No live shows imported yet. Enter your Setlist.fm User ID above to import your concerts.
          </div>
        ) : (
          <div className="grid gap-3">
            {shows.map((show) => (
              <div
                key={show.id}
                className="rounded-lg p-4 cursor-pointer hover:bg-(--color-bg-tertiary)/60 transition-colors"
                onClick={() => { void fetchShowDetails(show.id); }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      {show.artist_name}
                      {show.koito_artist_id ? (
                        <span className="text-xs bg-(--color-success)/20 text-(--color-success) px-2 py-0.5 rounded-full">Linked</span>
                      ) : (
                        <span className="text-xs bg-(--color-warning)/20 text-(--color-warning) px-2 py-0.5 rounded-full">Unlinked</span>
                      )}
                    </div>
                    <div className="text-sm text-(--color-fg-secondary)">
                      {show.venue_name}, {show.city}, {show.country}
                    </div>
                    <div className="text-sm text-(--color-fg-tertiary) mt-1">{formatDate(show.event_date)}</div>
                    {show.tour_name && <div className="text-sm text-(--color-primary) mt-1">Tour: {show.tour_name}</div>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); void deleteShow(show.id); }}
                    className="px-3 py-1 rounded-lg text-(--color-error) hover:bg-(--color-error)/10 transition-colors text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Show Details Modal */}
      <Modal isOpen={!!showDetails} onClose={() => setShowDetails(null)} maxW={640}>
        {showDetails && (
          <>
            <h2 className="text-xl font-bold mb-1">{showDetails.show.artist_name}</h2>
            <div className="text-sm text-(--color-fg-secondary) mb-4">
              {showDetails.show.venue_name}, {showDetails.show.city}, {showDetails.show.country}
              <br />
              {formatDate(showDetails.show.event_date)}
            </div>

            {/* Artist Matching */}
            <div className="mb-4 p-3 rounded-lg bg-(--color-bg-tertiary)/40">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Artist:</span>
                {showDetails.show.koito_artist_id ? (
                  <span className="text-(--color-success)">Linked to Koito</span>
                ) : (
                  <span className="text-(--color-warning)">Not linked</span>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingArtist(true);
                  setArtistSearchQuery(showDetails.show.artist_name);
                  void searchArtists(showDetails.show.artist_name);
                }}
                className="large-button mt-2 text-sm"
              >
                {showDetails.show.koito_artist_id ? "Change Link" : "Link Artist"}
              </button>
            </div>

            {/* Songs List */}
            <h3 className="font-bold mb-2">Songs ({showDetails.songs.length})</h3>
            <div className="space-y-1">
              {showDetails.songs.map((song) => (
                <div key={song.id} className="flex justify-between items-center p-2 rounded-lg hover:bg-(--color-bg-tertiary)/60 transition-colors">
                  <div>
                    <span className="font-medium">{song.song_order}. {song.setlistfm_song_name}</span>
                    {song.is_cover && <span className="text-xs text-(--color-warning) ml-2">(Cover)</span>}
                    {song.koito_song_title && (
                      <span className="text-xs text-(--color-success) ml-2">&rarr; {song.koito_song_title}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingSong(song);
                      setSongSearchQuery(song.setlistfm_song_name);
                      void searchSongs(song.setlistfm_song_name, showDetails.show.koito_artist_id);
                    }}
                    className="px-2 py-1 rounded-lg bg-(--color-bg-tertiary) hover:bg-(--color-bg-tertiary)/70 transition-colors text-xs"
                  >
                    {song.koito_song_id ? "Change" : "Link"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* Edit Artist Modal */}
      <Modal isOpen={editingArtist && !!showDetails} onClose={() => setEditingArtist(false)} maxW={500}>
        <h3 className="text-lg font-bold mb-4">Link Artist</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={artistSearchQuery}
            onChange={(e) => setArtistSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void searchArtists(artistSearchQuery); }}
            className="flex-1"
          />
          <button
            onClick={() => searchArtists(artistSearchQuery)}
            disabled={searchingArtists}
            className="large-button"
          >
            Search
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {artistMatches.map((artist) => (
            <button
              key={artist.id}
              onClick={() => showDetails && linkArtist(showDetails.show.id, showDetails.show.artist_name, artist.id)}
              className="w-full text-left p-2 rounded-lg hover:bg-(--color-bg-tertiary)/60 transition-colors"
            >
              {artist.name}
            </button>
          ))}
        </div>
        <button
          onClick={() => setEditingArtist(false)}
          className="large-button mt-4 w-full"
        >
          Cancel
        </button>
      </Modal>

      {/* Edit Song Modal */}
      <Modal isOpen={!!editingSong && !!showDetails} onClose={() => setEditingSong(null)} maxW={500}>
        {editingSong && (
          <>
            <h3 className="text-lg font-bold mb-4">Link Song: {editingSong.setlistfm_song_name}</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void searchSongs(songSearchQuery, showDetails?.show.koito_artist_id); }}
                className="flex-1"
              />
              <button
                onClick={() => searchSongs(songSearchQuery, showDetails?.show.koito_artist_id)}
                disabled={searchingSongs}
                className="large-button"
              >
                Search
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {songMatches.map((song) => (
                <button
                  key={song.id}
                  onClick={() => showDetails && linkSong(showDetails.show.id, editingSong.setlistfm_song_name, song.id)}
                  className="w-full text-left p-2 rounded-lg hover:bg-(--color-bg-tertiary)/60 transition-colors"
                >
                  {song.title} <span className="text-(--color-fg-tertiary)">by {song.artist_name}</span>
                </button>
              ))}
            </div>
          </>
        )}
        <button
          onClick={() => setEditingSong(null)}
          className="large-button mt-4 w-full"
        >
          Cancel
        </button>
      </Modal>
    </main>
  );
}
