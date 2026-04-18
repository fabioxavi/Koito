import { useQuery } from "@tanstack/react-query";
import ArtistLinks from "./ArtistLinks";
import { getTopTracks, imageUrl, type getItemsArgs } from "api/api";
import { Link } from "react-router";
import TopListSkeleton from "./skeletons/TopListSkeleton";
import { useEffect } from "react";
import TopItemList from "./TopItemList";
import { ListMusic } from "lucide-react";

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

  if (isPending) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ListMusic size={18} className="text-(--color-primary)" />
          <h3 className="text-lg font-semibold">Top Songs</h3>
        </div>
        <p className="text-(--color-fg-secondary)">Loading...</p>
      </div>
    );
  } else if (isError) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ListMusic size={18} className="text-(--color-primary)" />
          <h3 className="text-lg font-semibold">Top Songs</h3>
        </div>
        <p className="error">Error: {error.message}</p>
      </div>
    );
  }
  if (!data.items) return null;

  let params = "";
  params += props.artistId ? `&artist_id=${props.artistId}` : "";
  params += props.albumId ? `&album_id=${props.albumId}` : "";

  return (
    <div>
      <Link to={`/chart/top-tracks?period=${props.period}${params}`} className="group">
        <div className="flex items-center gap-2 mb-4">
          <ListMusic size={18} className="text-(--color-primary)" />
          <h3 className="text-lg font-semibold group-hover:underline">Top Songs</h3>
        </div>
      </Link>
      <div>
        {/* Table Header */}
        <div className="flex items-center gap-4 text-xs text-(--color-fg-secondary) uppercase tracking-wide mb-3 pb-2 border-b border-(--color-bg-tertiary)">
          <span className="w-6">#</span>
          <span className="flex-1">Song / Artist</span>
          <span className="w-16 text-right">Plays</span>
        </div>
        <TopItemList type="track" data={data} ranked />
        {data.items.length < 1 && (
          <p className="text-(--color-fg-secondary)">Nothing to show</p>
        )}
      </div>
    </div>
  );
};

export default TopTracks;
