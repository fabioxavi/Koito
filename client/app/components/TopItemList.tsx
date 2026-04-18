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
    <div className={`flex flex-col gap-2 ${className}`}>
      {data.items.map((item, index) => {
        const key = `${type}-${item.item.id}`;
        return (
          <div
            key={key}
            className={`text-sm ${
              separators && index !== data.items.length - 1
                ? "border-b border-(--color-bg-tertiary) pb-2"
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
  const itemClasses = `flex items-center gap-3`;

  switch (type) {
    case "album": {
      const album = item as Album;

      return (
        <div className={itemClasses}>
          {ranked && <div className="w-6 text-(--color-fg-secondary) text-right">{rank}</div>}
          <Link to={`/album/${album.id}`}>
            <img
              loading="lazy"
              src={imageUrl(album.image, "small")}
              alt={album.title}
              className="w-12 h-12 rounded object-cover"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`/album/${album.id}`}
              className="hover:text-(--color-fg-secondary) block truncate"
            >
              {album.title}
            </Link>
            {album.is_various_artists ? (
              <span className="text-(--color-fg-secondary) text-xs">Various Artists</span>
            ) : (
              <div className="text-xs">
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
          <div className="text-(--color-fg-secondary) text-xs">{album.listen_count} plays</div>
        </div>
      );
    }
    case "track": {
      const track = item as Track;

      return (
        <div className={itemClasses}>
          {ranked && <div className="w-6 text-(--color-fg-secondary) text-right">{rank}</div>}
          <Link to={`/track/${track.id}`}>
            <img
              loading="lazy"
              src={imageUrl(track.image, "small")}
              alt={track.title}
              className="w-12 h-12 rounded object-cover"
            />
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              to={`/track/${track.id}`}
              className="hover:text-(--color-fg-secondary) block truncate"
            >
              {track.title}
            </Link>
            <div className="text-xs">
              <ArtistLinks
                artists={track.artists || [{ id: 0, Name: "Unknown Artist" }]}
              />
            </div>
          </div>
          <div className="text-(--color-fg-secondary) text-xs">{track.listen_count} plays</div>
        </div>
      );
    }
    case "artist": {
      const artist = item as Artist;
      return (
        <Link
          className={`${itemClasses} hover:bg-(--color-bg-tertiary) rounded-md p-1 -m-1 transition-colors`}
          to={`/artist/${artist.id}`}
        >
          {ranked && <div className="w-6 text-(--color-fg-secondary) text-right">{rank}</div>}
          <img
            loading="lazy"
            src={imageUrl(artist.image, "small")}
            alt={artist.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1 min-w-0">
            <span className="block truncate">{artist.name}</span>
            <div className="text-(--color-fg-secondary) text-xs">
              {artist.listen_count} plays
            </div>
          </div>
        </Link>
      );
    }
  }
}
