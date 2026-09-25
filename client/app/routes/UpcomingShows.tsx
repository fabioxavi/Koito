import { useLoaderData } from "react-router";
import Card from "~/components/Card";

export async function clientLoader() {
  const res = await fetch("/apis/web/v1/upcoming-shows");
  if (!res.ok) {
    if (res.status === 401) {
      throw new Response("Unauthorized", { status: 401 });
    }
    throw new Response("Failed to load upcoming shows", { status: 500 });
  }
  const shows = await res.json();
  return { shows: shows as UpcomingShow[] };
}

interface UpcomingShow {
  artist_id: number;
  artist_name: string;
  artist_rank: number;
  event_id: string;
  event_url: string;
  datetime: string;
  venue_name: string;
  city: string;
  region?: string;
  country: string;
}

export default function UpcomingShows() {
  const { shows } = useLoaderData<{ shows: UpcomingShow[] }>();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-PT", {
      weekday: "short",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <main className="pt-8 pb-20 px-5 sm:px-8 sm:pt-12 w-full max-w-[1400px] mx-auto flex flex-col gap-6">
      <h1 className="text-2xl sm:text-3xl font-semibold">Upcoming Shows</h1>
      <p className="text-(--color-fg-secondary)">
        Upcoming concerts for the artists you listen to most, via Bandsintown.
      </p>

      <Card>
        <h2 className="text-lg font-semibold mb-3">Upcoming Shows ({shows.length})</h2>
        {shows.length === 0 ? (
          <div className="text-center py-8 text-(--color-fg-secondary)">
            No upcoming shows found for your top artists.
          </div>
        ) : (
          <div className="grid gap-3">
            {shows.map((show) => (
              <a
                key={`${show.artist_id}_${show.event_id}`}
                href={show.event_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg p-4 hover:bg-(--color-bg-tertiary)/60 transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="font-bold text-lg">{show.artist_name}</div>
                    <div className="text-sm text-(--color-fg-secondary)">
                      {show.venue_name}, {show.city}
                      {show.region ? `, ${show.region}` : ""}, {show.country}
                    </div>
                  </div>
                  <div className="text-sm text-(--color-primary) whitespace-nowrap">
                    {formatDate(show.datetime)}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}
