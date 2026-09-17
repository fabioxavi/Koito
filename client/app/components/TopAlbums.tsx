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
import Card from "./Card";

interface Props {
  limit: number;
  period: string;
  artistId?: Number;
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

  const header = "Top albums";

  if (isPending) {
    return (
      <Card className="w-full min-w-[260px]">
        <h3>{header}</h3>
        <p>Loading...</p>
      </Card>
    );
  } else if (isError) {
    return (
      <Card className="w-full min-w-[260px]">
        <h3>{header}</h3>
        <p className="error">Error: {error.message}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full min-w-[260px]">
      <h3 className="hover:underline">
        <Link
          to={`/chart/top-albums?period=${props.period}${
            props.artistId ? `&artist_id=${props.artistId}` : ""
          }`}
        >
          {header}
        </Link>
      </h3>
      <div>
        <TopItemList type="album" data={data} />
        {data.items.length < 1 ? "Nothing to show" : ""}
      </div>
    </Card>
  );
}
