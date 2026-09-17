import { useQuery } from "@tanstack/react-query";
import ArtistLinks from "./ArtistLinks";
import { getTopTracks, imageUrl, type getItemsArgs } from "api/api";
import { Link } from "react-router";
import TopListSkeleton from "./skeletons/TopListSkeleton";
import { useEffect } from "react";
import TopItemList from "./TopItemList";
import FeaturedTopItem from "./FeaturedTopItem";

interface Props {
  limit: number;
  period: string;
  artistId?: Number;
  albumId?: Number;
}

const TopTracks = (props: Props) => {
  const { isPending, isError, data, error } = useQuery({
    queryKey: [
      "top-tracks",
      {
        limit: props.limit,
        period: props.period,
        artist_id: props.artistId,
        album_id: props.albumId,
        page: 0,
      },
    ],
    queryFn: ({ queryKey }) => getTopTracks(queryKey[1] as getItemsArgs),
  });

  const header = "Top tracks";

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
  if (!data.items) return;

  let params = "";
  params += props.artistId ? `&artist_id=${props.artistId}` : "";
  params += props.albumId ? `&album_id=${props.albumId}` : "";

  return (
    <div>
      <h3 className="hover:underline">
        <Link to={`/chart/top-tracks?period=${props.period}${params}`}>
          {header}
        </Link>
      </h3>
      <div className="max-w-[300px]">
        {data.items.length > 0 && (
          <div className="mb-4">
            <FeaturedTopItem item={data.items[0]} type="track" />
          </div>
        )}
        {data.items.length > 1 && (
          <TopItemList type="track" data={{ ...data, items: data.items.slice(1) }} />
        )}
        {data.items.length < 1 ? "Nothing to show" : ""}
      </div>
    </div>
  );
};

export default TopTracks;
