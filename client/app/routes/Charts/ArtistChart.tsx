import ChartCard from "~/components/ChartCard";
import ChartLayout from "./ChartLayout";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { type Artist, type PaginatedResponse, type Ranked } from "api/api";

export async function clientLoader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const page = url.searchParams.get("page") || "0";
  url.searchParams.set("page", page);

  // Default to all_time period if no period/timeframe is specified
  if (!url.searchParams.get("period") && !url.searchParams.get("year") && !url.searchParams.get("month") && !url.searchParams.get("week")) {
    url.searchParams.set("period", "all_time");
  }

  const res = await fetch(
    `/apis/web/v1/top-artists?${url.searchParams.toString()}`
  );
  if (!res.ok) {
    throw new Response("Failed to load top artists", { status: 500 });
  }

  const top_artists: PaginatedResponse<Artist> = await res.json();
  return { top_artists };
}

export default function Artist() {
  const { top_artists: initialData } = useLoaderData<{
    top_artists: PaginatedResponse<Ranked<Artist>>;
  }>();

  return (
    <ChartLayout
      title="Top Artists"
      initialData={initialData}
      endpoint="chart/top-artists"
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 w-full">
            {data.items.map((rankedArtist, index) => (
              <ChartCard
                key={rankedArtist.item.id}
                item={rankedArtist}
                index={index}
                type="artist"
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