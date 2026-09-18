import { Link } from "react-router";
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

function getName(item: Item): string {
  return "title" in item ? item.title : item.name;
}

function getHref(item: Item, type: "album" | "track" | "artist"): string {
  return type === "album" ? `/album/${item.id}` : type === "track" ? `/track/${item.id}` : `/artist/${item.id}`;
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
  const featured = ranked && rank === 1;
  const href = getHref(item, type);
  const liveCount = type === "artist" ? (item as any).liveCount : 0;

  const subtitle =
    type === "artist" ? null : "is_various_artists" in item && item.is_various_artists ? (
      <span>Various Artists</span>
    ) : (
      <ArtistLinks
        artists={
          (item as Album | Track).artists?.slice(0, 1) || [{ id: 0, name: "Unknown Artist" }]
        }
      />
    );

  if (featured) {
    return (
      <Link
        to={href}
        className="flex items-center gap-4 rounded-xl p-3 -mx-1 mb-2 bg-(--color-bg-tertiary)/40 hover:bg-(--color-bg-tertiary)/60 transition-colors"
      >
        <div className="relative shrink-0">
          <img
            loading="lazy"
            src={imageUrl(item.image, "medium")}
            alt={getName(item)}
            className="w-24 h-24 rounded-lg object-cover shadow-md"
          />
          {liveCount > 0 && (
            <div
              title={`Visto ao vivo ${liveCount} vezes`}
              className="absolute -bottom-1.5 -right-1.5 bg-green-500 text-white rounded-full w-7 h-7 flex items-center justify-center font-bold border-2 border-(--color-bg) text-xs z-10"
            >
              {liveCount}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 flex flex-col gap-0.5">
          <span className="text-xs font-bold text-(--color-accent) uppercase tracking-wide">
            #1
          </span>
          <span className="text-lg font-bold truncate leading-tight">{getName(item)}</span>
          {subtitle && <div className="text-sm text-(--color-fg-secondary) truncate">{subtitle}</div>}
          <span className="text-sm text-(--color-fg-secondary)">{item.listen_count} plays</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={href}
      className="flex items-center gap-3 rounded-lg p-1.5 -mx-1.5 hover:bg-(--color-bg-tertiary)/60 transition-colors"
    >
      {ranked && (
        <div className="w-5 text-end text-sm text-(--color-fg-tertiary) shrink-0">{rank}</div>
      )}
      <div className="relative shrink-0">
        <img
          loading="lazy"
          src={imageUrl(item.image, "medium")}
          alt={getName(item)}
          className="w-12 h-12 rounded-lg object-cover"
        />
        {liveCount > 0 && (
          <div
            title={`Visto ao vivo ${liveCount} vezes`}
            className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-4 h-4 flex items-center justify-center font-bold border border-(--color-bg) text-[9px] z-10"
          >
            {liveCount}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium block truncate">{getName(item)}</span>
        {subtitle && <div className="text-xs truncate">{subtitle}</div>}
      </div>
      <div className="text-xs text-(--color-fg-secondary) whitespace-nowrap shrink-0">
        {item.listen_count} plays
      </div>
    </Link>
  );
}
