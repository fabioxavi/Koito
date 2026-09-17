import { useQuery } from "@tanstack/react-query";
import ArtistLinks from "./ArtistLinks";
import { getTopArtists, imageUrl, type getItemsArgs } from "api/api";
import { Link } from "react-router";
import TopListSkeleton from "./skeletons/TopListSkeleton";
import TopItemList from "./TopItemList";
import FeaturedTopItem from "./FeaturedTopItem";

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

  const header = "Top artists";

  if (isPending) {
    return (
      <div className="w-[300px]">
        <h3>{header}</h3>
        <p>Loading...</p>
      </div>
    );
  } else if (isError) {
    return (
      <div className="w-[300px]">
        <h3>{header}</h3>
        <p className="error">Error: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="hover:underline">
        <Link to={`/chart/top-artists?period=${props.period}`}>{header}</Link>
      </h3>
      <div className="max-w-[300px]">
        {data.items.length > 0 && (
          <div className="mb-4">
            <FeaturedTopItem item={data.items[0]} type="artist" />
          </div>
        )}
        {data.items.length > 1 && (
          <TopItemList type="artist" data={{ ...data, items: data.items.slice(1) }} />
        )}
        {data.items.length < 1 ? "Nothing to show" : ""}
      </div>
    </div>
  );
}
