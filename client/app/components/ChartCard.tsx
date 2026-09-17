import { Link } from "react-router";
import { imageUrl, type Album, type Artist, type Track, type Ranked } from "api/api";
import ArtistLinks from "./ArtistLinks";

type ChartItem = Album | Track | Artist;

interface ChartCardProps<T extends Ranked<ChartItem>> {
  item: T;
  index: number;
  type: "album" | "track" | "artist";
}

export default function ChartCard<T extends Ranked<ChartItem>>({
  item,
  index,
  type,
}: ChartCardProps<T>) {
  const data = item.item;
  const rank = item.rank;
  const listenCount = data.listen_count;

  switch (type) {
    case "album": {
      const album = data as Album;
      return (
        <div className="flex flex-col bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="relative">
            <Link to={`/album/${album.id}`}>
              <img
                loading="lazy"
                src={imageUrl(album.image, "medium")}
                alt={album.title}
                className="w-full max-w-[150px] aspect-square object-cover mx-auto"
              />
            </Link>
            <div className="absolute top-2 left-2 bg-black/60 text-white text-sm font-bold px-2 py-1 rounded">
              #{rank}
            </div>
          </div>
          <div className="p-3 flex flex-col gap-1">
            <Link
              to={`/album/${album.id}`}
              className="font-semibold text-base hover:text-(--color-fg-secondary) line-clamp-2"
            >
              {album.title}
            </Link>
            {album.is_various_artists ? (
              <span className="text-sm text-(--color-fg-secondary) line-clamp-1">
                Various Artists
              </span>
            ) : (
              <div className="text-sm text-(--color-fg-secondary) line-clamp-1">
                {album.artists && album.artists.length > 0 ? (
                  <ArtistLinks artists={[album.artists[0]]} />
                ) : (
                  <span>Unknown Artist</span>
                )}
              </div>
            )}
            <span className="text-xs text-(--color-fg-tertiary)">
              {listenCount} plays
            </span>
          </div>
        </div>
      );
    }
    case "track": {
      const track = data as Track;
      return (
        <div className="flex bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200 p-3 gap-3 items-start">
          <div className="relative shrink-0">
            <div className="absolute top-1 left-1 bg-black/60 text-white text-sm font-bold px-2 py-1 rounded">
              #{rank}
            </div>
            <Link to={`/track/${track.id}`}>
              <img
                loading="lazy"
                src={imageUrl(track.image, "medium")}
                alt={track.title}
                className="w-24 h-24 object-cover rounded-md"
              />
            </Link>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <Link
              to={`/track/${track.id}`}
              className="font-semibold text-base hover:text-(--color-fg-secondary) line-clamp-2"
            >
              {track.title}
            </Link>
            <div className="text-sm text-(--color-fg-secondary) line-clamp-1">
              {track.artists && track.artists.length > 0 ? (
                <ArtistLinks artists={track.artists} />
              ) : (
                <span>Unknown Artist</span>
              )}
            </div>
            <span className="text-xs text-(--color-fg-tertiary)">
              {listenCount} plays
            </span>
          </div>
        </div>
      );
    }
    case "artist": {
      const artist = data as Artist;
      return (
        <div className="flex flex-col items-center bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow duration-200">
          <div className="relative mb-3">
            <Link to={`/artist/${artist.id}`}>
              <img
                loading="lazy"
                src={imageUrl(artist.image, "medium")}
                alt={artist.name}
                className="w-32 h-32 object-cover rounded-lg"
              />
            </Link>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full">
              #{rank}
            </div>
          </div>
          <Link
            to={`/artist/${artist.id}`}
            className="font-semibold text-lg text-center hover:text-(--color-fg-secondary) line-clamp-2"
          >
            {artist.name}
          </Link>
          <span className="text-sm text-(--color-fg-secondary) mt-1">
            {listenCount} plays
          </span>
        </div>
      );
    }
    default:
      return null;
  }
}