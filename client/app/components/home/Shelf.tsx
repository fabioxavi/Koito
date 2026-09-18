import { Link } from "react-router";
import ShelfCard from "./ShelfCard";
import type { Album, Artist, PaginatedResponse, Ranked, Track } from "api/api";

type Item = Album | Track | Artist;

interface Props<T extends Ranked<Item>> {
  title: string;
  type: "album" | "track" | "artist";
  href: string;
  isPending: boolean;
  isError: boolean;
  data?: PaginatedResponse<T>;
}

export default function Shelf<T extends Ranked<Item>>({
  title,
  type,
  href,
  isPending,
  isError,
  data,
}: Props<T>) {
  if (isPending) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
        <p className="text-(--color-fg-secondary)">Loading...</p>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
        <p className="error">Error loading {title.toLowerCase()}</p>
      </div>
    );
  }
  if (data.items.length < 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <Link to={href} className="hover:text-(--color-fg-secondary)">
          <h2 className="text-xl sm:text-2xl font-semibold">{title}</h2>
        </Link>
        <Link
          to={href}
          className="text-sm text-(--color-fg-secondary) hover:text-(--color-fg) shrink-0"
        >
          See all
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-1 -mx-1 px-1">
        {data.items.map((item) => (
          <ShelfCard key={`${type}-${item.item.id}`} item={item} type={type} />
        ))}
      </div>
    </div>
  );
}
