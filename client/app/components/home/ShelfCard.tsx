import { Link } from "react-router";
import { imageUrl, type Album, type Artist, type Track, type Ranked } from "api/api";
import ArtistLinks from "../ArtistLinks";

type Item = Album | Track | Artist;

interface Props<T extends Ranked<Item>> {
  item: T;
  type: "album" | "track" | "artist";
}

export default function ShelfCard<T extends Ranked<Item>>({ item, type }: Props<T>) {
  const data = item.item;
  const rank = item.rank;

  const cover = (
    <img
      loading="lazy"
      src={imageUrl(data.image, "medium")}
      alt={"title" in data ? data.title : data.name}
      className={`w-full aspect-square object-cover shadow-md transition-transform duration-200 group-hover:scale-[1.03] ${
        type === "artist" ? "rounded-full" : "rounded-xl"
      }`}
    />
  );

  const liveCount = type === "artist" ? (data as any).liveCount : 0;

  const href =
    type === "album" ? `/album/${data.id}` : type === "track" ? `/track/${data.id}` : `/artist/${data.id}`;

  return (
    <div className="group flex flex-col gap-2 w-[150px] sm:w-[170px] shrink-0 snap-start">
      <Link to={href} className="relative block">
        {cover}
        <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
          {rank}
        </div>
        {liveCount > 0 && (
          <div
            title={`Visto ao vivo ${liveCount} vezes`}
            className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center font-bold border-2 border-(--color-bg) text-xs z-10"
          >
            {liveCount}
          </div>
        )}
      </Link>
      <div className="flex flex-col min-w-0">
        <Link
          to={href}
          className="text-sm font-semibold truncate hover:text-(--color-fg-secondary)"
        >
          {"title" in data ? data.title : data.name}
        </Link>
        {type !== "artist" && (
          <span className="text-xs text-(--color-fg-tertiary) truncate">
            {"is_various_artists" in data && data.is_various_artists ? (
              "Various Artists"
            ) : (
              <ArtistLinks
                artists={
                  (data as Album | Track).artists?.slice(0, 1) || [{ id: 0, name: "Unknown Artist" }]
                }
              />
            )}
          </span>
        )}
        <span className="text-xs text-(--color-fg-tertiary)">
          {data.listen_count} plays
        </span>
      </div>
    </div>
  );
}
