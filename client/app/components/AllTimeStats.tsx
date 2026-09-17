import { useQuery } from "@tanstack/react-query";
import { getStats, type Stats, type ApiError } from "api/api";
import StatTile from "./StatTile";

export default function AllTimeStats() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["stats", "all_time"],
    queryFn: ({ queryKey }) => getStats(queryKey[1]),
  });

  const header = "All time stats";

  if (isPending) {
    return (
      <div>
        <h3>{header}</h3>
        <p>Loading...</p>
      </div>
    );
  } else if (isError) {
    return (
      <>
        <div>
          <h3>{header}</h3>
          <p className="error">Error: {error.message}</p>
        </div>
      </>
    );
  }

  return (
    <div>
      <h3>{header}</h3>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <StatTile
          value={data.minutes_listened}
          label="Minutes Listened"
          title={Math.floor(data.minutes_listened / 60) + " hours"}
        />
        <StatTile value={data.listen_count} label="Plays" />
        <StatTile value={data.track_count} label="Tracks" />
        <StatTile value={data.album_count} label="Albums" />
        <StatTile value={data.artist_count} label="Artists" />
      </div>
    </div>
  );
}
