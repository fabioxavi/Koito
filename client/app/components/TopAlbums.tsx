import { useQuery } from "@tanstack/react-query";
import ArtistLinks from "./ArtistLinks";
import {
  getTopAlbums,
  getTopTracks,
  imageUrl,
  type getItemsArgs,
} from "api/api";
import { Link } from "react-router";
import TopListSkeleton from "./skeletons/TopListSkeleton";
import TopItemList from "./TopItemList";
import { Disc } from "lucide-react";

interface Props {
  limit: number;
  period: string;
  artistId?: Number;
  hideHeader?: boolean;
}

export default function TopAlbums(props: Props) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: [
      "top-albums",
      {
        limit: props.limit,
        period: props.period,
        artistId: props.artistId,
        page: 0,
      },
    ],
    queryFn: ({ queryKey }) => getTopAlbums(queryKey[1] as getItemsArgs),
  });

  if (isPending) {
    return (
      <div>
        {!props.hideHeader && (
          <Link to={`/chart/top-albums?period=${props.period}`} className="group">
            <div className="flex items-center gap-2 mb-4">
              <Disc size={18} className="text-(--color-primary)" />
              <h3 className="text-lg font-semibold group-hover:underline">Top Albums</h3>
            </div>
          </Link>
        )}
        <p className="text-(--color-fg-secondary)">Loading...</p>
      </div>
    );
  } else if (isError) {
    return (
      <div>
        {!props.hideHeader && (
          <Link to={`/chart/top-albums?period=${props.period}`} className="group">
            <div className="flex items-center gap-2 mb-4">
              <Disc size={18} className="text-(--color-primary)" />
              <h3 className="text-lg font-semibold group-hover:underline">Top Albums</h3>
            </div>
          </Link>
        )}
        <p className="error">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      {!props.hideHeader && (
        <Link
          to={`/chart/top-albums?period=${props.period}${
            props.artistId ? `&artist_id=${props.artistId}` : ""
          }`}
          className="group"
        >
          <div className="flex items-center gap-2 mb-4">
            <Disc size={18} className="text-(--color-primary)" />
            <h3 className="text-lg font-semibold group-hover:underline">Top Albums</h3>
          </div>
        </Link>
      )}
      <div>
        <TopItemList type="album" data={data} />
        {data.items.length < 1 && (
          <p className="text-(--color-fg-secondary)">Nothing to show</p>
        )}
      </div>
    </div>
  );
}
