import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { getNowPlaying, imageUrl } from "api/api";
import ArtistLinks from "../ArtistLinks";

export default function NowPlayingBar() {
  const { data } = useQuery({
    queryKey: ["now-playing"],
    queryFn: () => getNowPlaying(),
    refetchInterval: 15000,
  });

  if (!data || !data.currently_playing) return null;

  const track = data.track;

  return (
    <div className="fixed bottom-0 left-0 sm:left-[40px] right-0 z-40 border-t border-(--color-bg-tertiary) bg-(--color-bg-secondary)/90 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 sm:px-8 py-2.5 max-w-[1600px] mx-auto">
        <Link to={`/track/${track.id}`} className="shrink-0">
          <img
            src={imageUrl(track.image, "small")}
            alt={track.title}
            className="w-10 h-10 rounded-lg object-cover"
          />
        </Link>
        <div className="min-w-0 flex-1 flex flex-col leading-tight">
          <Link
            to={`/track/${track.id}`}
            className="text-sm font-medium truncate hover:text-(--color-fg-secondary)"
          >
            {track.title}
          </Link>
          <span className="text-xs text-(--color-fg-secondary) truncate">
            <ArtistLinks artists={track.artists} />
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 text-(--color-success) text-xs font-medium pr-1">
          <span className="w-1.5 h-1.5 rounded-full bg-(--color-success) animate-pulse" />
          A tocar agora
        </div>
      </div>
    </div>
  );
}
