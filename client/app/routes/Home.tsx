import type { Route } from "./+types/Home";
import LastPlays from "~/components/LastPlays";
import ActivityGrid from "~/components/ActivityGrid";
import StatTile from "~/components/StatTile";
import TopItemList from "~/components/TopItemList";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PeriodSelector from "~/components/PeriodSelector";
import { useAppContext } from "~/providers/AppProvider";
import DashboardPanel from "~/components/home/DashboardPanel";
import { Disc, Music, Users } from "lucide-react";
import {
  getStats,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
  type getItemsArgs,
} from "api/api";

const PANEL_ITEMS = 8;

export function meta({}: Route.MetaArgs) {
  return [{ title: "Koito" }, { name: "description", content: "Koito" }];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Boa noite";
  if (hour < 12) return "Bom dia";
  if (hour < 19) return "Boa tarde";
  return "Boa noite";
}

const MILESTONES = [
  1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
];

export default function Home() {
  const [period, setPeriod] = useState("week");
  const { user } = useAppContext();

  const statsQuery = useQuery({
    queryKey: ["stats", period],
    queryFn: ({ queryKey }) => getStats(queryKey[1]),
  });
  const artistsQuery = useQuery({
    queryKey: ["top-artists", { limit: PANEL_ITEMS, period, page: 0 }],
    queryFn: ({ queryKey }) => getTopArtists(queryKey[1] as getItemsArgs),
  });
  const albumsQuery = useQuery({
    queryKey: ["top-albums", { limit: PANEL_ITEMS, period, page: 0 }],
    queryFn: ({ queryKey }) => getTopAlbums(queryKey[1] as getItemsArgs),
  });
  const tracksQuery = useQuery({
    queryKey: ["top-tracks", { limit: PANEL_ITEMS, period, page: 0 }],
    queryFn: ({ queryKey }) => getTopTracks(queryKey[1] as getItemsArgs),
  });

  const allTimeQuery = useQuery({
    queryKey: ["stats", "all_time"],
    queryFn: ({ queryKey }) => getStats(queryKey[1]),
  });

  const stats = statsQuery.data;
  const allTimeCount = allTimeQuery.data?.listen_count;
  const nextMilestone =
    allTimeCount !== undefined ? MILESTONES.find((m) => m > allTimeCount) : undefined;

  return (
    <main className="w-full flex-grow">
      <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-24 max-w-[1800px] mx-auto flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold header-font">
            {getGreeting()}
            {user?.username ? `, ${user.username}` : ""}
          </h1>
          <PeriodSelector setter={setPeriod} current={period} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
          <div
            className="lg:col-span-3 rounded-2xl p-5 flex flex-col justify-between gap-4 text-white min-h-[140px]"
            style={{
              background:
                "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
            }}
          >
            <div>
              <div className="text-4xl sm:text-5xl font-bold header-font">
                {stats ? stats.minutes_listened.toLocaleString() : "—"}
              </div>
              <div className="text-sm opacity-80">Minutes Listened</div>
            </div>
            {nextMilestone && allTimeCount !== undefined && (
              <div className="flex flex-col gap-1">
                <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-white"
                    style={{
                      width: `${Math.min(
                        100,
                        (allTimeCount / nextMilestone) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-xs opacity-80">
                  {allTimeCount.toLocaleString()} / {nextMilestone.toLocaleString()} plays all time
                </span>
              </div>
            )}
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 gap-3">
            <StatTile
              accent="primary"
              value={stats ? stats.listen_count.toLocaleString() : "—"}
              label="Plays"
            />
            <StatTile
              accent="accent"
              value={stats ? stats.artist_count.toLocaleString() : "—"}
              label="Artists"
            />
            <StatTile
              accent="success"
              value={stats ? stats.album_count.toLocaleString() : "—"}
              label="Albums"
            />
            <StatTile
              accent="warning"
              value={stats ? stats.track_count.toLocaleString() : "—"}
              label="Tracks"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <DashboardPanel title="Top Artists" icon={Users} href={`/chart/top-artists?period=${period}`}>
            {artistsQuery.isPending ? (
              <p className="text-(--color-fg-secondary) text-sm">Loading...</p>
            ) : artistsQuery.isError ? (
              <p className="error text-sm">Error loading artists</p>
            ) : (
              <TopItemList type="artist" ranked data={artistsQuery.data!} />
            )}
          </DashboardPanel>
          <DashboardPanel title="Top Albums" icon={Disc} href={`/chart/top-albums?period=${period}`}>
            {albumsQuery.isPending ? (
              <p className="text-(--color-fg-secondary) text-sm">Loading...</p>
            ) : albumsQuery.isError ? (
              <p className="error text-sm">Error loading albums</p>
            ) : (
              <TopItemList type="album" ranked data={albumsQuery.data!} />
            )}
          </DashboardPanel>
          <DashboardPanel title="Top Tracks" icon={Music} href={`/chart/top-tracks?period=${period}`}>
            {tracksQuery.isPending ? (
              <p className="text-(--color-fg-secondary) text-sm">Loading...</p>
            ) : tracksQuery.isError ? (
              <p className="error text-sm">Error loading tracks</p>
            ) : (
              <TopItemList type="track" ranked data={tracksQuery.data!} />
            )}
          </DashboardPanel>
          <DashboardPanel title="Last Played" href="/listens?period=all_time">
            <LastPlays bare showNowPlaying limit={PANEL_ITEMS} />
          </DashboardPanel>
        </div>

        <ActivityGrid range={91} />
      </div>
    </main>
  );
}
