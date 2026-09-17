import { Link, useNavigate } from "react-router";
import ArtistLinks from "./ArtistLinks";
import {
  imageUrl,
  type Album,
  type Artist,
  type Track,
  type PaginatedResponse,
  type Ranked,
} from "api/api";

type Item = Album | Track | Artist;

interface Props<T extends Ranked<Item>> {
  data: PaginatedResponse<T>;
  separators?: ConstrainBoolean;
  ranked?: boolean;
  type: "album" | "track" | "artist";
  className?: string;
}

export default function TopItemList<T extends Ranked<Item>>({
  data,
  separators,
  type,
  className,
  ranked,
}: Props<T>) {
  return (
    <div className={`flex flex-col gap-1 ${className} min-w-[200px]`}>
      {data.items.map((item, index) => {
        const key = `${type}-${item.item.id}`;
        return (
          <div
            key={key}
            className={`${
              separators && index !== data.items.length - 1
                ? "border-b border-(--color-bg-tertiary) mb-1 pb-2"
                : ""
            }`}
          >
            <ItemCard
              ranked={ranked}
              rank={item.rank}
              item={item.item}
              type={type}
              key={type + item.item.id}
            />
          </div>
        );
      })}
    </div>
  );
}

function ItemCard({
  item,
  type,
  rank,
  ranked,
}: {
  item: Item;
  type: "album" | "track" | "artist";
  rank: number;
  ranked?: boolean;
}) {
  const rowClasses =
    "flex items-center gap-3 rounded-lg p-1.5 -mx-1.5 hover:bg-(--color-bg-tertiary)/60 transition-colors";

  switch (type) {
    case "album": {
      const album = item as Album;

      return (
        <div className={rowClasses}>
          {ranked && (
            <div className="w-5 text-end text-sm text-(--color-fg-tertiary)">
              {rank}
            </div>
          )}
          <Link to={`/album/${album.id}`} className="shrink-0">
            <img
              loading="lazy"
              src={imageUrl(album.image, "medium")}
              alt={album.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/album/${album.id}`}
              className="hover:text-(--color-fg-secondary)"
            >
              <span className="text-sm font-medium block truncate">
                {album.title}
              </span>
            </Link>
            {album.is_various_artists ? (
              <span className="text-xs text-(--color-fg-secondary)">
                Various Artists
              </span>
            ) : (
              <div className="text-xs truncate">
                <ArtistLinks
                  artists={
                    album.artists
                      ? [album.artists[0]]
                      : [{ id: 0, name: "Unknown Artist" }]
                  }
                />
              </div>
            )}
          </div>
          <div className="text-xs text-(--color-fg-secondary) whitespace-nowrap shrink-0">
            {album.listen_count} plays
          </div>
        </div>
      );
    }
    case "track": {
      const track = item as Track;

      return (
        <div className={rowClasses}>
          {ranked && (
            <div className="w-5 text-end text-sm text-(--color-fg-tertiary)">
              {rank}
            </div>
          )}
          <Link to={`/track/${track.id}`} className="shrink-0">
            <img
              loading="lazy"
              src={imageUrl(track.image, "medium")}
              alt={track.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to={`/track/${track.id}`}
              className="hover:text-(--color-fg-secondary)"
            >
              <span className="text-sm font-medium block truncate">
                {track.title}
              </span>
            </Link>
            <div className="text-xs truncate">
              <ArtistLinks
                artists={track.artists || [{ id: 0, Name: "Unknown Artist" }]}
              />
            </div>
          </div>
          <div className="text-xs text-(--color-fg-secondary) whitespace-nowrap shrink-0">
            {track.listen_count} plays
          </div>
        </div>
      );
    }
    case "artist": {
      const artist = item as Artist;
      const liveCount = (artist as any).liveCount;
      return (
        <Link
          className={rowClasses + " hover:text-(--color-fg-secondary)"}
          to={`/artist/${artist.id}`}
        >
          {ranked && (
            <div className="w-5 text-end text-sm text-(--color-fg-tertiary)">
              {rank}
            </div>
          )}
          <div className="relative shrink-0">
            <img
              loading="lazy"
              src={imageUrl(artist.image, "small")}
              alt={artist.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            {liveCount > 0 && (
              <div
                title={`Visto ao vivo ${liveCount} vezes`}
                className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold border border-white text-[9px] z-10"
              >
                {liveCount}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium block truncate">
              {artist.name}
            </span>
          </div>
          <div className="text-xs text-(--color-fg-secondary) whitespace-nowrap shrink-0">
            {artist.listen_count} plays
          </div>
        </Link>
      );
    }
  }
}
