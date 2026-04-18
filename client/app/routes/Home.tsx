import type { Route } from "./+types/Home";
import TopTracks from "~/components/TopTracks";
import LastPlays from "~/components/LastPlays";
import ActivityGrid from "~/components/ActivityGrid";
import TopAlbums from "~/components/TopAlbums";
import TopArtists from "~/components/TopArtists";
import AllTimeStats from "~/components/AllTimeStats";
import { useState } from "react";
import PeriodSelector from "~/components/PeriodSelector";
import { useAppContext } from "~/providers/AppProvider";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Koito" }, { name: "description", content: "Koito" }];
}

export default function Home() {
  const [period, setPeriod] = useState("week");

  const { homeItems } = useAppContext();

  return (
    <main className="flex flex-grow justify-center pb-8 w-full bg-(--color-bg)">
      <div className="flex-1 flex flex-col gap-8 min-h-0 sm:pt-10 pt-6 px-4 md:px-8 max-w-7xl">
        {/* Period Selector and Year/Month Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <PeriodSelector setter={setPeriod} current={period} />
          
          {/* Year/Month Selectors */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-(--color-fg-secondary) uppercase tracking-wide">Year</label>
              <select className="bg-(--color-bg-secondary) border border-(--color-bg-tertiary) text-(--color-fg) rounded-md px-4 py-2 text-sm min-w-[100px]">
                <option>All</option>
                <option>2026</option>
                <option>2025</option>
                <option>2024</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-(--color-fg-secondary) uppercase tracking-wide">Month</label>
              <select className="bg-(--color-bg-secondary) border border-(--color-bg-tertiary) text-(--color-fg) rounded-md px-4 py-2 text-sm min-w-[100px]">
                <option>All</option>
                <option>January</option>
                <option>February</option>
                <option>March</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <AllTimeStats />

        {/* Top Album Section */}
        <div className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary)">
          <TopAlbums period={period} limit={3} />
        </div>

        {/* Top Artists and Top Songs Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Artists Card */}
          <div className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary)">
            <TopArtists period={period} limit={homeItems} />
          </div>

          {/* Top Songs Card */}
          <div className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary)">
            <TopTracks period={period} limit={homeItems} />
          </div>
        </div>

        {/* Activity Grid / Plays per Day */}
        <div className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary)">
          <div className="flex items-center gap-2 mb-4">
            <ActivityGrid configurable />
          </div>
        </div>

        {/* Recent Plays */}
        <div className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary)">
          <LastPlays
            showNowPlaying={true}
            limit={Math.floor(homeItems * 2.7)}
          />
        </div>
      </div>
    </main>
  );
}
