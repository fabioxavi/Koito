import type { Route } from "./+types/Home";
import TopTracks from "~/components/TopTracks";
import LastPlays from "~/components/LastPlays";
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
  const [period, setPeriod] = useState("all_time");

  const { homeItems } = useAppContext();

  return (
    <main className="flex flex-grow justify-center pb-4 w-full bg-linear-to-b to-(--color-bg) from-(--color-bg-secondary) to-60%">
      <div className="flex-1 flex flex-col items-center gap-16 min-h-0 sm:mt-20 mt-10">
        <PeriodSelector setter={setPeriod} current={period} />
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-10 mx-5 w-full max-w-7xl">
          {/* Left side: Top 3 sections (Artists, Albums, Tracks) */}
          <div className="flex-1 flex flex-col gap-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TopArtists period={period} limit={homeItems} />
              <TopAlbums period={period} limit={homeItems} />
              <TopTracks period={period} limit={homeItems} />
            </div>
          </div>
          {/* Right side: AllTimeStats on top, LastPlays below */}
          <div className="flex flex-col gap-6 lg:w-80">
            <AllTimeStats />
            <LastPlays
              showNowPlaying={true}
              limit={Math.floor(homeItems * 2.7)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
