import { useState, useEffect } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";

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
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold mb-4">Live Shows</h1>

      {/* Import from Setlist.fm User */}
      <div className="fg bg p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-3">Import My Concerts from Setlist.fm</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Enter your Setlist.fm User ID..."
            value={setlistFmUserId}
            onChange={(e) => setSetlistFmUserId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void fetchUserAttended(); }}
            className="flex-1 px-3 py-2 border rounded"
          />
          <button
            onClick={fetchUserAttended}
            disabled={fetchingAttended}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
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
                <div key={concert.id} className="border p-3 rounded flex justify-between items-start hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div>
                    <div className="font-semibold">{concert.artist.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {concert.venue.name}, {concert.venue.city.name}, {concert.venue.city.country.name}
                    </div>
                    <div className="text-sm text-gray-500">{concert.eventDate}</div>
                    {concert.tour?.name && <div className="text-sm text-blue-500">Tour: {concert.tour.name}</div>}
                  </div>
                  <button
                    onClick={() => void importConcert(concert)}
                    disabled={importing}
                    className="px-3 py-1 bg-green-500 text-white text-sm rounded disabled:opacity-50"
                  >
                    Import
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* My Live Shows */}
      <div className="fg bg p-4 rounded-lg">
        <h2 className="text-lg font-bold mb-3">My Live Shows ({shows.length})</h2>
        {shows.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No live shows imported yet. Enter your Setlist.fm User ID above to import your concerts.
          </div>
        ) : (
          <div className="grid gap-3">
            {shows.map((show) => (
              <div
                key={show.id}
                className="border p-4 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => { console.log("Clicked show:", show.id); void fetchShowDetails(show.id); }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-lg flex items-center gap-2">
                      {show.artist_name}
                      {show.koito_artist_id ? (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Linked</span>
                      ) : (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Unlinked</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {show.venue_name}, {show.city}, {show.country}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{formatDate(show.event_date)}</div>
                    {show.tour_name && <div className="text-sm text-blue-500 mt-1">Tour: {show.tour_name}</div>}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); void deleteShow(show.id); }}
                    className="px-3 py-1 border border-red-500 text-red-500 rounded hover:bg-red-50 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{showDetails.show.artist_name}</h2>
              <button onClick={() => setShowDetails(null)} className="text-2xl">&times;</button>
            </div>
            <div className="text-sm text-gray-600 mb-4">
              {showDetails.show.venue_name}, {showDetails.show.city}, {showDetails.show.country}
              <br />
              {formatDate(showDetails.show.event_date)}
            </div>

            {/* Artist Matching */}
            <div className="mb-4 p-3 border rounded">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Artist:</span>
                {showDetails.show.koito_artist_id ? (
                  <span className="text-green-600">Linked to Koito</span>
                ) : (
                  <span className="text-yellow-600">Not linked</span>
                )}
              </div>
              <button
                onClick={() => {
                  setEditingArtist(true);
                  setArtistSearchQuery(showDetails.show.artist_name);
                  void searchArtists(showDetails.show.artist_name);
                }}
                className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
              >
                {showDetails.show.koito_artist_id ? "Change Link" : "Link Artist"}
              </button>
            </div>

            {/* Songs List */}
            <h3 className="font-bold mb-2">Songs ({showDetails.songs.length})</h3>
            <div className="space-y-2">
              {showDetails.songs.map((song) => (
                <div key={song.id} className="flex justify-between items-center p-2 border rounded">
                  <div>
                    <span className="font-medium">{song.song_order}. {song.setlistfm_song_name}</span>
                    {song.is_cover && <span className="text-xs text-orange-500 ml-2">(Cover)</span>}
                    {song.koito_song_title && (
                      <span className="text-xs text-green-600 ml-2">&rarr; {song.koito_song_title}</span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setEditingSong(song);
                      setSongSearchQuery(song.setlistfm_song_name);
                      void searchSongs(song.setlistfm_song_name, showDetails.show.koito_artist_id);
                    }}
                    className="px-2 py-1 bg-blue-500 text-white rounded text-xs"
                  >
                    {song.koito_song_id ? "Change" : "Link"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Artist Modal */}
      {editingArtist && showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">Link Artist</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={artistSearchQuery}
                onChange={(e) => setArtistSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void searchArtists(artistSearchQuery); }}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={() => searchArtists(artistSearchQuery)}
                disabled={searchingArtists}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Search
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {artistMatches.map((artist) => (
                <button
                  key={artist.id}
                  onClick={() => linkArtist(showDetails.show.id, showDetails.show.artist_name, artist.id)}
                  className="w-full text-left p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {artist.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditingArtist(false)}
              className="mt-4 px-4 py-2 border rounded w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Song Modal */}
      {editingSong && showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full p-6">
            <h3 className="text-lg font-bold mb-4">Link Song: {editingSong.setlistfm_song_name}</h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={songSearchQuery}
                onChange={(e) => setSongSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void searchSongs(songSearchQuery, showDetails.show.koito_artist_id); }}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={() => searchSongs(songSearchQuery, showDetails.show.koito_artist_id)}
                disabled={searchingSongs}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Search
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {songMatches.map((song) => (
                <button
                  key={song.id}
                  onClick={() => linkSong(showDetails.show.id, editingSong.setlistfm_song_name, song.id)}
                  className="w-full text-left p-2 border rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {song.title} <span className="text-gray-500">by {song.artist_name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setEditingSong(null)}
              className="mt-4 px-4 py-2 border rounded w-full"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
