import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import TopTracks from "~/components/TopTracks";
import { mergeArtists, type Artist } from "api/api";
import LastPlays from "~/components/LastPlays";
import PeriodSelector from "~/components/PeriodSelector";
import MediaLayout from "./MediaLayout";
import ArtistAlbums from "~/components/ArtistAlbums";
import ActivityGrid from "~/components/ActivityGrid";
import { timeListenedString } from "~/utils/utils";
import InterestGraph from "~/components/InterestGraph";

// Definimos a nova interface para bater com o que fizemos no Go
interface ArtistResponse {
  artist: Artist;
  liveCount: number;
}

export async function clientLoader({ params }: LoaderFunctionArgs) {
  const res = await fetch(`/apis/web/v1/artist?id=${params.id}`);
  if (!res.ok) {
    throw new Response("Failed to load artist", { status: 500 });
  }
  // Agora recebemos o objeto mapeado do Go
  const data: ArtistResponse = await res.json();
  return data;
}

export default function Artist() {
  const data = useLoaderData() as ArtistResponse;
  const artist = data.artist;
  const liveCount = data.liveCount;
  
  const [period, setPeriod] = useState("all_time");

  // remove canonical name from alias list
  if (artist.aliases) {
    let index = artist.aliases.indexOf(artist.name);
    if (index !== -1) {
      artist.aliases.splice(index, 1);
    }
  }

  return (
    <MediaLayout
      type="Artist"
      title={artist.name}
      searchQuery={artist.name}
      img={artist.image}
      id={artist.id}
      rank={artist.all_time_rank}
      musicbrainzId={artist.musicbrainz_id}
      imgItemId={artist.id}
      mergeFunc={mergeArtists}
      mergeCleanerFunc={(r, id) => { /* ... */ return r; }}
      /* --- ESTA É A PARTE QUE ADICIONA A BOLINHA SOBRE A IMAGEM --- */
      imageChildren={
        liveCount > 0 && (
          <div 
            title={`Visto ao vivo ${liveCount} vezes`}
            className="absolute bottom-2 right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold shadow-lg border-2 border-white text-sm z-10"
          >
            {liveCount}
          </div>
        )
      }
      subContent={
        <div className="flex flex-col gap-2 items-start">
          {artist.listen_count && (
            <p>
              {artist.listen_count} play{artist.listen_count > 1 ? "s" : ""}
            </p>
          )}
          {artist.time_listened !== 0 && (
            <p title={Math.floor(artist.time_listened / 60 / 60) + " hours"}>
              {timeListenedString(artist.time_listened)}
            </p>
          )}
          
          {/* --- NOVA LINHA: CONTADOR DE CONCERTOS --- */}
          {liveCount > 0 && (
            <p>
              Seen live: {liveCount} {liveCount === 1 ? "time" : "times"}
            </p>
          )}
          {/* ---------------------------------------- */}

          {artist.first_listen > 0 && (
            <p title={new Date(artist.first_listen * 1000).toLocaleString()}>
              Listening since{" "}
              {new Date(artist.first_listen * 1000).toLocaleDateString()}
            </p>
          )}
        </div>
      }
    >
      <div className="mt-10">
        <PeriodSelector setter={setPeriod} current={period} />
      </div>
      <div className="flex flex-col gap-20">
        <div className="flex gap-15 mt-10 flex-wrap">
          <LastPlays limit={20} artistId={artist.id} />
          <TopTracks limit={8} period={period} artistId={artist.id} />
          <div className="flex flex-col items-start gap-4">
            <ActivityGrid configurable artistId={artist.id} />
            <InterestGraph artistId={artist.id} />
          </div>
        </div>
        <ArtistAlbums period={period} artistId={artist.id} name={artist.name} />
      </div>
    </MediaLayout>
  );
}