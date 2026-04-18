import { useQuery } from "@tanstack/react-query";
import ArtistLinks from "./ArtistLinks";
import { getTopArtists, imageUrl, type getItemsArgs } from "api/api";
import { Link } from "react-router";
import TopListSkeleton from "./skeletons/TopListSkeleton";
import TopItemList from "./TopItemList";
import { Users } from "lucide-react";

interface Props {
  limit: number;
  period: string;
  artistId?: Number;
  albumId?: Number;
}

export default function TopArtists(props: Props) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: [
      "top-artists",
      { limit: props.limit, period: props.period, page: 0 },
    ],
    queryFn: ({ queryKey }) => getTopArtists(queryKey[1] as getItemsArgs),
  });

  if (isPending) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-(--color-primary)" />
          <h3 className="text-lg font-semibold">Top Artists</h3>
        </div>
        <p className="text-(--color-fg-secondary)">Loading...</p>
      </div>
    );
  } else if (isError) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-(--color-primary)" />
          <h3 className="text-lg font-semibold">Top Artists</h3>
        </div>
        <p className="error">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <Link to={`/chart/top-artists?period=${props.period}`} className="group">
        <div className="flex items-center gap-2 mb-4">
          <Users size={18} className="text-(--color-primary)" />
          <h3 className="text-lg font-semibold group-hover:underline">Top Artists</h3>
        </div>
      </Link>
      <div>
        <TopItemList type="artist" data={data} />
        {data.items.length < 1 && (
          <p className="text-(--color-fg-secondary)">Nothing to show</p>
        )}
      </div>
    </div>
  );
}
