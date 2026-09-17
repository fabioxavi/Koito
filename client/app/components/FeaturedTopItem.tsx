import { Link } from "react-router";
import ArtistLinks from "./ArtistLinks";
import { imageUrl, type Album, type Artist, type Track, type Ranked } from "api/api";

type FeaturedItem = Album | Track | Artist;

interface FeaturedTopItemProps<T extends Ranked<FeaturedItem>> {
  item: T;
  type: "album" | "track" | "artist";
}

export default function FeaturedTopItem<T extends Ranked<FeaturedItem>>({
  item,
  type,
}: FeaturedTopItemProps<T>) {
  const data = item.item;
  const rank = item.rank;

  switch (type) {
    case "album": {
      const album = data as Album;
      return (
        <div className="flex flex-col items-center bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-xl overflow-hidden shadow-lg p-4 gap-3 relative min-h-[290px]">
          <div className="absolute -top-2 -left-2 bg-transparent text-2xl w-10 h-10 flex items-center justify-center">
            👑
          </div>
          <div className="relative">
            <Link to={`/album/${album.id}`}>
               <img
                 src={imageUrl(album.image, "medium")}
                 alt={album.title}
                 className="w-40 h-40 object-cover rounded-lg shadow-md"
               />
            </Link>
          </div>
          <div className="text-center">
            <Link
              to={`/album/${album.id}`}
              className="font-bold text-lg hover:text-(--color-fg-secondary) line-clamp-2"
            >
              {album.title}
            </Link>
            <div className="text-sm text-(--color-fg-secondary) mt-1 line-clamp-1">
              {album.is_various_artists ? (
                <span>Various Artists</span>
              ) : (
                <ArtistLinks artists={album.artists?.slice(0, 1) || []} />
              )}
            </div>
            <div className="text-xs text-(--color-fg-tertiary) mt-1">
              {album.listen_count} plays
            </div>
          </div>
        </div>
      );
    }
    case "track": {
      const track = data as Track;
      return (
        <div className="flex flex-col items-center bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-xl overflow-hidden shadow-lg p-4 gap-3 relative min-h-[290px]">
          <div className="absolute -top-2 -left-2 bg-transparent text-2xl w-10 h-10 flex items-center justify-center">
            👑
          </div>
          <div className="relative">
            <Link to={`/track/${track.id}`}>
               <img
                 src={imageUrl(track.image, "medium")}
                 alt={track.title}
                 className="w-40 h-40 object-cover rounded-lg shadow-md"
               />
            </Link>
          </div>
          <div className="text-center">
            <Link
              to={`/track/${track.id}`}
              className="font-bold text-lg hover:text-(--color-fg-secondary) line-clamp-2"
            >
              {track.title}
            </Link>
            <div className="text-sm text-(--color-fg-secondary) mt-1 line-clamp-1">
              <ArtistLinks artists={track.artists?.slice(0, 1) || []} />
            </div>
            <div className="text-xs text-(--color-fg-tertiary) mt-1">
              {track.listen_count} plays
            </div>
          </div>
        </div>
      );
    }
    case "artist": {
      const artist = data as Artist;
      const liveCount = (artist as any).liveCount;
      return (
    <div className="flex flex-col items-center bg-(--color-bg-secondary) border border-(--color-bg-tertiary) rounded-xl overflow-hidden shadow-lg p-4 gap-3 relative min-h-[290px]">
      <div className="absolute -top-2 -left-2 bg-transparent text-2xl w-10 h-10 flex items-center justify-center">
        👑
      </div>
      <div className="relative">
        <Link to={`/artist/${artist.id}`}>
          <img
            src={imageUrl(artist.image, "medium")}
            alt={artist.name}
            className="w-40 h-40 object-cover rounded-lg shadow-md"
          />
          {/* A BOLINHA VERDE AQUI */}
          {liveCount > 0 && (
            <div 
              title={`Visto ao vivo ${liveCount} vezes`}
              className="absolute -bottom-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg border-2 border-white text-sm z-10"
            >
              {liveCount}
            </div>
          )}
        </Link>
      </div>
          <div className="text-center">
            <Link
              to={`/artist/${artist.id}`}
              className="font-bold text-lg hover:text-(--color-fg-secondary) line-clamp-2"
            >
              {artist.name}
            </Link>
            <div className="text-sm text-(--color-fg-secondary) mt-1 line-clamp-1 opacity-0 select-none">
              placeholder
            </div>
            <div className="text-xs text-(--color-fg-tertiary) mt-1">
              {artist.listen_count} plays
            </div>
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}