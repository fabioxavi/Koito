import { useEffect, useState } from "react";
import { Modal } from "./Modal";
import { replaceImage, searchImages, type ImageResult } from "api/api";
import { AsyncButton } from "../AsyncButton";

interface Props {
  type: string;
  id: number;
  musicbrainzId?: string;
  initialSearchQuery?: string;
  open: boolean;
  setOpen: Function;
}

export default function ImageReplaceModal({
  musicbrainzId,
  initialSearchQuery,
  type,
  id,
  open,
  setOpen,
}: Props) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestedImgLoading, setSuggestedImgLoading] = useState(true);
  const [webQuery, setWebQuery] = useState("");
  const [webLoading, setWebLoading] = useState(false);
  const [webResults, setWebResults] = useState<ImageResult[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>(["all"]);

  // Available providers
  const providers = type === "Artist" ? [
    { id: "all", name: "All Sources" },
    { id: "spotify", name: "Spotify" },
    { id: "lastfm", name: "Last.fm" },
    { id: "deezer", name: "Deezer" },
    { id: "itunes", name: "iTunes" },
    { id: "theaudiodb", name: "TheAudioDB" },
    { id: "discogs", name: "Discogs" },
  ] : [
    { id: "all", name: "All Sources" },
    { id: "spotify", name: "Spotify" },
    { id: "itunes", name: "iTunes" },
    { id: "musicbrainz", name: "MusicBrainz" },
    { id: "discogs", name: "Discogs" },
  ];

  useEffect(() => {
    if (!open) return;
    setWebQuery(initialSearchQuery ?? "");
    setWebResults([]);
  }, [open, initialSearchQuery]);

  const searchItunes = async (term: string): Promise<ImageResult[]> => {
    const params = new URLSearchParams({
      term,
      media: "music",
      entity: "song",
      limit: "30",
    });

    const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    return (data?.results ?? [])
      .map((result: any) => {
        const base = result?.artworkUrl100 as string | undefined;
        if (!base) return null;
        return {
          url: base
            .replace("100x100bb.jpg", "1000x1000bb.jpg")
            .replace("100x100bb.webp", "1000x1000bb.webp")
            .replace("100x100bb", "1000x1000bb"),
          source: "iTunes"
        };
      })
      .filter((item: ImageResult | null): item is ImageResult => item !== null && item.url.startsWith("http"));
  };

  const searchMusicBrainzAlbumCovers = async (term: string): Promise<ImageResult[]> => {
    if (type !== "Album") return [];
    const params = new URLSearchParams({
      query: term,
      fmt: "json",
      limit: "12",
    });

    const response = await fetch(`https://musicbrainz.org/ws/2/release/?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    const releases = data?.releases ?? [];

    return releases
      .map((release: any) => {
        const id = release?.id as string | undefined;
        if (!id) return null;
        return {
          url: `https://coverartarchive.org/release/${id}/front`,
          source: "MusicBrainz"
        };
      })
      .filter((item: ImageResult | null): item is ImageResult => item !== null);
  };

  const searchDeezerArtists = async (term: string): Promise<ImageResult[]> => {
    if (type !== "Artist") return [];
    try {
      // Try different Deezer endpoints
      const endpoints = [
        `https://api.deezer.com/search/artist?q=${encodeURIComponent(term)}`,
        `https://api.deezer.com/artist?q=${encodeURIComponent(term)}`,
      ];

      for (const endpoint of endpoints) {
        try {
          console.log("Deezer trying:", endpoint);
          const response = await fetch(endpoint, {
            headers: { "Accept": "application/json" }
          });
          if (!response.ok) {
            console.log("Deezer response not OK:", response.status);
            continue;
          }
          const data = await response.json();
          console.log("Deezer data:", data);

          // Handle different response structures
          let artists = data?.data || data || [];
          if (!Array.isArray(artists)) artists = [artists];

          const results = artists
            .filter((item: any) => item && (item.picture_xl || item.picture_big || item.picture_medium))
            .map((item: any) => {
              const url = (item?.picture_xl as string) || (item?.picture_big as string) || (item?.picture_medium as string) || "";
              if (!url.startsWith("http")) return null;
              return { url, source: "Deezer" };
            })
            .filter((item: ImageResult | null): item is ImageResult => item !== null);

          if (results.length > 0) {
            console.log("Deezer found:", results.length, "images");
            return results;
          }
        } catch (e) {
          console.error("Deezer endpoint failed:", e);
        }
      }
      return [];
    } catch (err) {
      console.error("Deezer error:", err);
      return [];
    }
  };

  // Last.fm API key: 5e8ff7223f55d25a9cea8c841ee5b854
  const LASTFM_API_KEY = "5e8ff7223f55d25a9cea8c841ee5b854";

  // Discogs API - no key needed for search
  const searchDiscogs = async (term: string): Promise<ImageResult[]> => {
    try {
      const searchType = type === "Artist" ? "artist" : "release";
      const response = await fetch(
        `https://api.discogs.com/database/search?q=${encodeURIComponent(term)}&type=${searchType}&per_page=10`,
        {
          headers: {
            "User-Agent": "KoitoMusic/1.0",
            "Accept": "application/json"
          }
        }
      );
      if (!response.ok) {
        console.log("Discogs response not OK:", response.status);
        return [];
      }
      const data = await response.json();
      console.log("Discogs results:", data?.results?.length || 0);

      const images: ImageResult[] = [];
      (data?.results || []).forEach((result: any) => {
        // Discogs has cover_image for releases and thumb for artists
        const imageUrl = result?.cover_image || result?.thumb;
        if (imageUrl && imageUrl.startsWith("http") && !imageUrl.includes("placeholder")) {
          images.push({ url: imageUrl, source: "Discogs" });
        }
      });
      return images;
    } catch (err) {
      console.error("Discogs error:", err);
      return [];
    }
  };

  const searchTheAudioDB = async (term: string): Promise<ImageResult[]> => {
    if (type !== "Artist") return [];
    try {
      const response = await fetch(`https://www.theaudiodb.com/api/v1/json/2/search.php?s=${encodeURIComponent(term)}`);
      if (!response.ok) return [];
      const data = await response.json();
      const artists = data?.artists ?? [];

      const images: ImageResult[] = [];
      artists.forEach((artist: any) => {
        if (artist?.strArtistThumb) {
          images.push({ url: artist.strArtistThumb, source: "TheAudioDB" });
        }
        if (artist?.strArtistFanart) {
          images.push({ url: artist.strArtistFanart, source: "TheAudioDB" });
        }
        if (artist?.strArtistLogo) {
          images.push({ url: artist.strArtistLogo, source: "TheAudioDB" });
        }
      });

      return images;
    } catch (err) {
      console.error("TheAudioDB error:", err);
      return [];
    }
  };

  const searchLastFmArtists = async (term: string): Promise<ImageResult[]> => {
    if (type !== "Artist") return [];
    try {
      // Last.fm API - search for artists and get their images
      const searchParams = new URLSearchParams({
        method: "artist.search",
        artist: term,
        api_key: LASTFM_API_KEY,
        format: "json",
        limit: "10",
      });

      const response = await fetch(`https://ws.audioscrobbler.com/2.0/?${searchParams.toString()}`);
      if (!response.ok) return [];
      const data = await response.json();
      const artists = data?.results?.artistmatches?.artist ?? [];

      // Get detailed info for each artist to fetch images
      const imagePromises = artists.slice(0, 5).map(async (artist: any) => {
        const infoParams = new URLSearchParams({
          method: "artist.getinfo",
          artist: artist.name,
          api_key: LASTFM_API_KEY,
          format: "json",
        });

        try {
          const infoResponse = await fetch(`https://ws.audioscrobbler.com/2.0/?${infoParams.toString()}`);
          if (!infoResponse.ok) return [];
          const infoData = await infoResponse.json();
          const artistInfo = infoData?.artist;

          if (!artistInfo?.image) return [];

          // Get the largest image available
          const images = artistInfo.image as Array<{ "#text": string; size: string }>;
          const largeImage = images.find((img) => img.size === "extralarge" || img.size === "large");
          return largeImage?.["#text"] ? [largeImage["#text"]] : [];
        } catch {
          return [];
        }
      });

      const imageArrays = await Promise.all(imagePromises);
      const results = imageArrays.flat()
        .filter((url: string) => {
          // Filter out Last.fm placeholder images and empty URLs
          if (!url.startsWith("http")) return false;
          // Last.fm placeholder/star image hash
          if (url.includes("2a96cbd8b6e4099ac")) return false;
          // Also filter the generic star/placeholder images
          if (url.includes("last.fm") && (url.includes("star") || url.includes("default"))) return false;
          return true;
        })
        .map(url => ({ url, source: "Last.fm" }));

      console.log("Last.fm results:", results.length);
      return results;
    } catch (err) {
      console.error("Last.fm error:", err);
      return [];
    }
  };

  const searchItunesArtists = async (term: string): Promise<ImageResult[]> => {
    if (type !== "Artist") return [];
    // iTunes artist search - different endpoint for artists
    const params = new URLSearchParams({
      term,
      media: "music",
      entity: "musicArtist",
      limit: "20",
    });

    const response = await fetch(`https://itunes.apple.com/search?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();

    // For artists, we need to get artist ID and then lookup their artwork
    const artists = (data?.results ?? []) as Array<{ artistId: number; artistName: string }>;
    if (artists.length === 0) return [];

    // Get the first artist's albums to find artwork
    const firstArtistId = artists[0]?.artistId;
    if (!firstArtistId) return [];

    // Lookup albums by this artist to get artwork
    const lookupParams = new URLSearchParams({
      id: firstArtistId.toString(),
      entity: "album",
      limit: "10",
    });

    try {
      const lookupResponse = await fetch(`https://itunes.apple.com/lookup?${lookupParams.toString()}`);
      if (!lookupResponse.ok) return [];
      const lookupData = await lookupResponse.json();

      return (lookupData?.results ?? [])
        .filter((result: any) => result.artworkUrl100)
        .map((result: any) => {
          const base = result.artworkUrl100 as string;
          return {
            url: base
              .replace("100x100bb.jpg", "1000x1000bb.jpg")
              .replace("100x100bb.webp", "1000x1000bb.webp")
              .replace("100x100bb", "1000x1000bb"),
            source: "iTunes"
          };
        })
        .filter((item: ImageResult): item is ImageResult => item.url.startsWith("http"));
    } catch {
      return [];
    }
  };

  const searchWebImages = async () => {
    const q = webQuery.trim();
    if (!q) {
      setWebResults([]);
      return;
    }

    setWebLoading(true);
    setError("");

    try {
      const searchType = type === "Artist" ? "artist" : "album";
      const term = `${q} ${searchType} cover`;

      // Check which providers are selected
      const useAll = selectedProviders.includes("all");
      const useSpotify = useAll || selectedProviders.includes("spotify");
      const useLastFm = useAll || selectedProviders.includes("lastfm");
      const useDeezer = useAll || selectedProviders.includes("deezer");
      const useItunes = useAll || selectedProviders.includes("itunes");
      const useMusicBrainz = useAll || selectedProviders.includes("musicbrainz");
      const useTheAudioDB = useAll || selectedProviders.includes("theaudiodb");
      const useDiscogs = useAll || selectedProviders.includes("discogs");

      // Build array of search promises based on selected providers
      const searchPromises: Promise<ImageResult[]>[] = [];

      if (useItunes) {
        searchPromises.push(searchItunes(term).catch(err => { console.error("iTunes error:", err); return []; }));
        if (type === "Artist") {
          searchPromises.push(searchItunesArtists(q).catch(err => { console.error("iTunes artist error:", err); return []; }));
        }
      }

      if (useMusicBrainz && type === "Album") {
        searchPromises.push(searchMusicBrainzAlbumCovers(term).catch(err => { console.error("MusicBrainz error:", err); return []; }));
      }

      if (useDeezer && type === "Artist") {
        searchPromises.push(searchDeezerArtists(q).catch(err => { console.error("Deezer error:", err); return []; }));
      }

      if (useLastFm && type === "Artist") {
        searchPromises.push(searchLastFmArtists(q).catch(err => { console.error("Last.fm error:", err); return []; }));
      }

      if (useTheAudioDB && type === "Artist") {
        searchPromises.push(searchTheAudioDB(q).catch(err => { console.error("TheAudioDB error:", err); return []; }));
      }

      if (useDiscogs) {
        searchPromises.push(searchDiscogs(q).catch(err => { console.error("Discogs error:", err); return []; }));
      }

      if (useSpotify) {
        searchPromises.push(
          searchImages(q, searchType)
            .then(r => {
              console.log("Spotify results:", r.images);
              return r.images?.map((img: ImageResult) => ({ url: img.url, source: img.source || "Spotify" })) || [];
            })
            .catch(err => { console.error("Spotify error:", err); return []; })
        );
      }

      // Execute all searches in parallel
      const results = await Promise.allSettled(searchPromises);

      // Combine all results with logging
      let allResults: ImageResult[] = [];
      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          console.log(`Provider ${index}:`, result.value.length, "results");
          allResults = [...allResults, ...result.value];
        } else {
          console.error(`Provider ${index} failed:`, result.reason);
        }
      });

      // Remove duplicates by URL
      const seen = new Set<string>();
      const uniqueResults = allResults.filter(img => {
        if (seen.has(img.url)) return false;
        seen.add(img.url);
        return true;
      });

      setWebResults(uniqueResults);

      if (uniqueResults.length === 0) {
        setError("No image results found for this search.");
      }
    } catch {
      setError("Unable to search web images right now.");
    } finally {
      setWebLoading(false);
    }
  };

  const toggleProvider = (providerId: string) => {
    if (providerId === "all") {
      setSelectedProviders(["all"]);
    } else {
      const newSelection = selectedProviders.filter(p => p !== "all");
      if (selectedProviders.includes(providerId)) {
        const filtered = newSelection.filter(p => p !== providerId);
        setSelectedProviders(filtered.length === 0 ? ["all"] : filtered);
      } else {
        setSelectedProviders([...newSelection, providerId]);
      }
    }
  };

  const doImageReplace = (url: string) => {
    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.set(`${type.toLowerCase()}_id`, id.toString());
    formData.set("image_url", url);
    replaceImage(formData)
      .then((r) => {
        if (r.status >= 200 && r.status < 300) {
          window.location.reload();
        } else {
          r.json().then((r) => setError(r.error));
          setLoading(false);
        }
      })
      .catch((err) => setError(err));
  };

  const closeModal = () => {
    setOpen(false);
    setQuery("");
    setError("");
  };

  return (
    <Modal isOpen={open} onClose={closeModal}>
      <h3>Replace Image</h3>
      <div className="flex flex-col items-center">
        <input
          type="text"
          autoFocus
          // i find my stupid a(n) logic to be a little silly so im leaving it in even if its not optimal
          placeholder={`Enter image URL, or drag-and-drop a local file`}
          className="w-full mx-auto fg bg rounded p-2"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query != "" ? (
          <div className="flex gap-2 mt-4">
            <AsyncButton
              loading={loading}
              onClick={() => doImageReplace(query)}
            >
              Submit
            </AsyncButton>
          </div>
        ) : (
          ""
        )}
        {type === "Album" && musicbrainzId ? (
          <>
            <h3 className="mt-5">Suggested Image (Click to Apply)</h3>
            <button
              className="mt-4"
              disabled={loading}
              onClick={() =>
                doImageReplace(
                  `https://coverartarchive.org/release/${musicbrainzId}/front`
                )
              }
            >
              <div className={`relative`}>
                {suggestedImgLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
                      style={{ width: 20, height: 20 }}
                    />
                  </div>
                )}
                <img
                  src={`https://coverartarchive.org/release/${musicbrainzId}/front`}
                  onLoad={() => setSuggestedImgLoading(false)}
                  onError={() => setSuggestedImgLoading(false)}
                  className={`block w-[130px] h-auto ${
                    suggestedImgLoading ? "opacity-0" : "opacity-100"
                  } transition-opacity duration-300`}
                />
              </div>
            </button>
          </>
        ) : (
          ""
        )}
        <h3 className="mt-6">Search Images on the Web</h3>
        <div className="w-full mt-2 flex gap-2">
          <input
            type="text"
            placeholder="Search image (album + artist, or artist name)"
            className="w-full mx-auto fg bg rounded p-2"
            value={webQuery}
            onChange={(e) => setWebQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void searchWebImages();
              }
            }}
          />
          <AsyncButton loading={webLoading} onClick={searchWebImages}>
            Search
          </AsyncButton>
        </div>
        <p className="text-xs text-(--color-fg-secondary) mt-2">
          Sources: {type === "Album" ? "Spotify + iTunes + MusicBrainz + Discogs" : "Spotify + Last.fm + Deezer + iTunes + TheAudioDB + Discogs"}
        </p>
        {/* Provider Filters */}
        <div className="w-full mt-3">
          <p className="text-xs text-(--color-fg-secondary) mb-2">
            Filter by source: {type === "Artist" ? "(Spotify, Last.fm, Deezer, iTunes, TheAudioDB, Discogs)" : "(Spotify, iTunes, MusicBrainz, Discogs)"}
          </p>
          <div className="flex flex-wrap gap-2">
            {providers.map(provider => (
              <button
                key={provider.id}
                onClick={() => toggleProvider(provider.id)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedProviders.includes(provider.id)
                    ? "bg-(--color-fg) text-(--color-bg)"
                    : "bg-(--color-bg-tertiary) text-(--color-fg-secondary) hover:bg-(--color-bg-secondary)"
                }`}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>

        {webResults.length > 0 && (
          <div className="w-full mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[500px] overflow-y-auto p-1">
            {webResults.map((img) => (
              <button
                key={img.url}
                type="button"
                className="relative border border-(--color-bg-tertiary) rounded p-1 hover:border-(--color-fg-secondary) group"
                onClick={() => doImageReplace(img.url)}
                title={`${img.source} - Click to apply`}
                disabled={loading}
              >
                <img
                  src={img.url}
                  alt={`${img.source} result`}
                  className="w-full h-32 object-cover rounded"
                />
                <span className="absolute bottom-1 right-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
                  {img.source}
                </span>
              </button>
            ))}
          </div>
        )}
        <p className="error">{error}</p>
      </div>
    </Modal>
  );
}
