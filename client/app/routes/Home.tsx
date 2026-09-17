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
import Card from "~/components/Card";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Koito" }, { name: "description", content: "Koito" }];
}

export default function Home() {
  const [period, setPeriod] = useState("week");

  const { homeItems } = useAppContext();

  return (
    <main className="flex flex-grow justify-center pb-4 w-full bg-linear-to-b to-(--color-bg) from-(--color-bg-secondary) to-60%">
      <div className="flex-1 flex flex-col items-center gap-8 min-h-0 sm:mt-20 mt-10 px-4 sm:px-8 max-w-[1400px] w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-1">
            <Card className="h-full">
              <AllTimeStats />
            </Card>
          </div>
          <div className="lg:col-span-2">
            <ActivityGrid configurable />
          </div>
        </div>
        <div className="w-full">
          <PeriodSelector setter={setPeriod} current={period} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          <TopArtists period={period} limit={homeItems} />
          <TopAlbums period={period} limit={homeItems} />
          <TopTracks period={period} limit={homeItems} />
          <div className="sm:col-span-2">
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
