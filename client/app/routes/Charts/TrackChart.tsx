import ChartCard from "~/components/ChartCard";
import ChartLayout from "./ChartLayout";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { type Track, type PaginatedResponse, type Ranked } from "api/api";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "0";
  url.searchParams.set("page", page);

  // Default to all_time period if no period/timeframe is specified
  if (!url.searchParams.get("period") && !url.searchParams.get("year") && !url.searchParams.get("month") && !url.searchParams.get("week")) {
    url.searchParams.set("period", "all_time");
  }

  const res = await fetch(
    `/apis/web/v1/top-tracks?${url.searchParams.toString()}`
  );
  if (!res.ok) {
    throw new Response("Failed to load top tracks", { status: 500 });
  }

  const top_tracks: PaginatedResponse<Track> = await res.json();
  return { top_tracks };
}

export default function TrackChart() {
  const { top_tracks: initialData } = useLoaderData<{
    top_tracks: PaginatedResponse<Ranked<Track>>;
  }>();

  return (
    <ChartLayout
      title="Top Tracks"
      initialData={initialData}
      endpoint="chart/top-tracks"
      render={({ data, page, onNext, onPrev }) => (
        <div className="flex flex-col gap-5 w-full">
          <div className="flex gap-15 mx-auto">
            <button className="default" onClick={onPrev} disabled={page <= 1}>
              Prev
            </button>
            <button
              className="default"
              onClick={onNext}
              disabled={!data.has_next_page}
            >
              Next
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
            {data.items.map((rankedTrack, index) => (
              <ChartCard
                key={rankedTrack.item.id}
                item={rankedTrack}
                index={index}
                type="track"
              />
            ))}
          </div>
          <div className="flex gap-15 mx-auto">
            <button className="default" onClick={onPrev} disabled={page === 0}>
              Prev
            </button>
            <button
              className="default"
              onClick={onNext}
              disabled={!data.has_next_page}
            >
              Next
            </button>
          </div>
        </div>
      )}
    />
  );
}
