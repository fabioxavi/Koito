import type { Route } from "./+types/Home";
import LastPlays from "~/components/LastPlays";
import ActivityGrid from "~/components/ActivityGrid";
import AllTimeStats from "~/components/AllTimeStats";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { average } from "color.js";
import PeriodSelector from "~/components/PeriodSelector";
import { useAppContext } from "~/providers/AppProvider";
import Card from "~/components/Card";
import Shelf from "~/components/home/Shelf";
import NowPlayingBar from "~/components/home/NowPlayingBar";
import MilestoneBanner from "~/components/home/MilestoneBanner";
import { getTopAlbums, getTopArtists, getTopTracks, imageUrl, type getItemsArgs } from "api/api";

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

export default function Home() {
  const [period, setPeriod] = useState("week");
  const { homeItems, user } = useAppContext();
  const [heroColor, setHeroColor] = useState<string>("rgba(0,0,0,0)");

  const artistsQuery = useQuery({
    queryKey: ["top-artists", { limit: homeItems, period, page: 0 }],
    queryFn: ({ queryKey }) => getTopArtists(queryKey[1] as getItemsArgs),
  });
  const albumsQuery = useQuery({
    queryKey: ["top-albums", { limit: homeItems, period, page: 0 }],
    queryFn: ({ queryKey }) => getTopAlbums(queryKey[1] as getItemsArgs),
  });
  const tracksQuery = useQuery({
    queryKey: ["top-tracks", { limit: homeItems, period, page: 0 }],
    queryFn: ({ queryKey }) => getTopTracks(queryKey[1] as getItemsArgs),
  });

  const heroImage = artistsQuery.data?.items[0]?.item.image;

  useEffect(() => {
    if (!heroImage) {
      setHeroColor("rgba(0,0,0,0)");
      return;
    }
    average(imageUrl(heroImage, "medium"), { amount: 1 }).then((c) => {
      setHeroColor(`rgba(${c[0]},${c[1]},${c[2]},0.55)`);
    });
  }, [heroImage]);

  return (
    <main className="w-full flex-grow relative">
      <div
        className="absolute inset-x-0 top-0 h-[420px] -z-10 transition-[background] duration-700 pointer-events-none"
        style={{
          background: `linear-gradient(180deg, ${heroColor}, var(--color-bg) 85%)`,
        }}
      />
      {heroImage && (
        <img
          src={imageUrl(heroImage, "large")}
          alt=""
          aria-hidden
          className="absolute inset-x-0 top-0 h-[420px] w-full object-cover opacity-25 blur-3xl -z-20 scale-110 pointer-events-none"
        />
      )}

      <div className="px-5 sm:px-10 pt-10 sm:pt-16 pb-28 max-w-[1600px] mx-auto flex flex-col gap-10">
        <div className="flex flex-col gap-1">
          <h1 className="header-font text-4xl sm:text-6xl font-bold leading-tight">
            {getGreeting()}
            {user?.username ? `, ${user.username}` : ""}
          </h1>
          <p className="text-(--color-fg-secondary) text-lg">
            Aqui está o que tens andado a ouvir.
          </p>
        </div>

        <MilestoneBanner />

        <PeriodSelector setter={setPeriod} current={period} />

        <Shelf
          title="Top Artists"
          type="artist"
          href={`/chart/top-artists?period=${period}`}
          isPending={artistsQuery.isPending}
          isError={artistsQuery.isError}
          data={artistsQuery.data}
        />
        <Shelf
          title="Top Albums"
          type="album"
          href={`/chart/top-albums?period=${period}`}
          isPending={albumsQuery.isPending}
          isError={albumsQuery.isError}
          data={albumsQuery.data}
        />
        <Shelf
          title="Top Tracks"
          type="track"
          href={`/chart/top-tracks?period=${period}`}
          isPending={tracksQuery.isPending}
          isError={tracksQuery.isError}
          data={tracksQuery.data}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card>
            <AllTimeStats />
          </Card>
          <ActivityGrid configurable />
          <LastPlays
            showNowPlaying={true}
            limit={Math.floor(homeItems * 2.7)}
          />
        </div>
      </div>

      <NowPlayingBar />
    </main>
  );
}
