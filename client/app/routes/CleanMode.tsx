import type { Route } from "./+types/CleanMode";
import { Link, useLoaderData } from "react-router";
import ArtistLinks from "~/components/ArtistLinks";
import { useAppContext } from "~/providers/AppProvider";
import { useState } from "react";
import { timeSince } from "~/utils/utils";
import Card from "~/components/Card";

type DuplicateListen = {
  track_id: number;
  track_title: string;
  artists: { id: number; name: string }[];
  previous_listen: string;
  duplicate_listen: string;
  duration_seconds: number;
  diff_seconds: number;
};

type ItemWithoutListens = {
  id: number;
  name: string;
};

type CleanModeCandidates = {
  artists: ItemWithoutListens[];
  albums: ItemWithoutListens[];
  tracks: ItemWithoutListens[];
};

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const url = new URL(request.url);
  if (!url.searchParams.get("period")) {
    url.searchParams.set("period", "all_time");
  }
  if (!url.searchParams.get("limit")) {
    url.searchParams.set("limit", "200");
  }

  const r = await fetch(`/apis/web/v1/listens/duplicates?${url.searchParams.toString()}`);
  const c = await fetch("/apis/web/v1/clean-mode/candidates");
  if (!r.ok) {
    throw new Response("Failed to load duplicate listens", { status: 500 });
  }
  if (!c.ok) {
    throw new Response("Failed to load clean mode candidates", { status: 500 });
  }
  const duplicates: DuplicateListen[] = await r.json();
  const candidates: CleanModeCandidates = await c.json();
  return { duplicates, candidates };
}

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Clean Mode - Koito" },
    { name: "description", content: "A distraction-free view for focused listening." },
  ];
}

export default function CleanMode() {
  const { duplicates, candidates } = useLoaderData<typeof clientLoader>();
  const { user } = useAppContext();
  const [items, setItems] = useState<DuplicateListen[]>(duplicates);
  const [artistsWithoutListens, setArtistsWithoutListens] = useState<ItemWithoutListens[]>(candidates.artists);
  const [albumsWithoutListens, setAlbumsWithoutListens] = useState<ItemWithoutListens[]>(candidates.albums);
  const [tracksWithoutListens, setTracksWithoutListens] = useState<ItemWithoutListens[]>(candidates.tracks);
  const [isDeletingAll, setIsDeletingAll] = useState<"" | "duplicates" | "artists" | "albums" | "tracks">("");

  const deleteDuplicate = async (item: DuplicateListen) => {
    const unix = Math.floor(new Date(item.duplicate_listen).getTime() / 1000);
    const res = await fetch(`/apis/web/v1/listen?track_id=${item.track_id}&unix=${unix}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => !(i.track_id === item.track_id && i.duplicate_listen === item.duplicate_listen)));
    }
  };

  const deleteItem = async (type: "artist" | "album" | "track", id: number) => {
    const res = await fetch(`/apis/web/v1/${type}?id=${id}`, { method: "DELETE" });
    if (!res.ok) return;

    if (type === "artist") {
      setArtistsWithoutListens((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    if (type === "album") {
      setAlbumsWithoutListens((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setTracksWithoutListens((prev) => prev.filter((item) => item.id !== id));
  };

  const deleteAllDuplicates = async () => {
    const confirmed = window.confirm("Are you sure you want to delete all duplicate listens shown here?");
    if (!confirmed) return;

    setIsDeletingAll("duplicates");
    const current = [...items];
    await Promise.all(
      current.map(async (item) => {
        const unix = Math.floor(new Date(item.duplicate_listen).getTime() / 1000);
        const res = await fetch(`/apis/web/v1/listen?track_id=${item.track_id}&unix=${unix}`, {
          method: "DELETE",
        });
        return { ok: res.ok, item };
      })
    );
    setItems([]);
    setIsDeletingAll("");
  };

  const deleteAllItems = async (type: "artist" | "album" | "track", ids: number[]) => {
    const label = type === "artist" ? "artists" : type === "album" ? "albums" : "tracks";
    const confirmed = window.confirm(`Are you sure you want to delete all ${label} without listens shown here?`);
    if (!confirmed) return;

    setIsDeletingAll(type === "artist" ? "artists" : type === "album" ? "albums" : "tracks");
    await Promise.all(
      ids.map(async (id) => {
        await fetch(`/apis/web/v1/${type}?id=${id}`, { method: "DELETE" });
      })
    );
    if (type === "artist") {
      setArtistsWithoutListens([]);
      setIsDeletingAll("");
      return;
    }
    if (type === "album") {
      setAlbumsWithoutListens([]);
      setIsDeletingAll("");
      return;
    }
    setTracksWithoutListens([]);
    setIsDeletingAll("");
  };

  return (
    <main className="pt-8 pb-20 px-5 sm:px-8 sm:pt-12 w-full max-w-[1400px] mx-auto">
      <Card className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-3">Clean Mode</h1>
        <p className="text-(--color-fg-secondary)">Cleanup tools for duplicate listens and items without listens.</p>
      </Card>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Duplicate listens ({items.length})</h2>
              <button
                hidden={user === null || user === undefined}
                disabled={items.length === 0 || isDeletingAll !== ""}
                onClick={() => void deleteAllDuplicates()}
                className="default"
              >
                {isDeletingAll === "duplicates" ? "Deleting..." : "Delete all"}
              </button>
            </div>
            <div className="overflow-x-auto max-h-[420px]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-(--color-bg-tertiary)">
                    <th className="py-2 pr-2"></th>
                    <th className="py-2 pr-3">Track</th>
                    <th className="py-2 pr-3">Previous</th>
                    <th className="py-2 pr-3">Duplicate</th>
                    <th className="py-2 pr-3">Diff</th>
                    <th className="py-2">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={`${item.track_id}_${item.previous_listen}_${item.duplicate_listen}`} className="hover:bg-(--color-bg-tertiary)/60 rounded-lg">
                      <td className="py-2 pr-2 align-top">
                        <button
                          hidden={user === null || user === undefined}
                          onClick={() => void deleteDuplicate(item)}
                          className="text-(--color-fg-tertiary) hover:text-(--color-error)"
                          aria-label="Delete duplicate listen"
                        >
                          ×
                        </button>
                      </td>
                      <td className="py-2 pr-3">
                        <ArtistLinks artists={item.artists} /> -{" "}
                        <Link to={`/track/${item.track_id}`} className="hover:text-(--color-fg-secondary)">
                          {item.track_title}
                        </Link>
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap" title={new Date(item.previous_listen).toString()}>
                        {timeSince(new Date(item.previous_listen))}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap" title={new Date(item.duplicate_listen).toString()}>
                        {timeSince(new Date(item.duplicate_listen))}
                      </td>
                      <td className="py-2 pr-3 whitespace-nowrap">{item.diff_seconds}s</td>
                      <td className="py-2 whitespace-nowrap">{item.duration_seconds}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Artists without listens ({artistsWithoutListens.length})</h2>
              <button
                hidden={user === null || user === undefined}
                disabled={artistsWithoutListens.length === 0 || isDeletingAll !== ""}
                onClick={() => void deleteAllItems("artist", artistsWithoutListens.map((v) => v.id))}
                className="default"
              >
                {isDeletingAll === "artists" ? "Deleting..." : "Delete all"}
              </button>
            </div>
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {artistsWithoutListens.map((artist) => (
                <li key={`orphan_artist_${artist.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-(--color-bg-tertiary)/60 transition-colors">
                  <Link to={`/artist/${artist.id}`} className="hover:text-(--color-fg-secondary)">
                    {artist.name}
                  </Link>
                  <button hidden={user === null || user === undefined} onClick={() => void deleteItem("artist", artist.id)} className="text-(--color-error) hover:opacity-80">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Albums without listens ({albumsWithoutListens.length})</h2>
              <button
                hidden={user === null || user === undefined}
                disabled={albumsWithoutListens.length === 0 || isDeletingAll !== ""}
                onClick={() => void deleteAllItems("album", albumsWithoutListens.map((v) => v.id))}
                className="default"
              >
                {isDeletingAll === "albums" ? "Deleting..." : "Delete all"}
              </button>
            </div>
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {albumsWithoutListens.map((album) => (
                <li key={`orphan_album_${album.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-(--color-bg-tertiary)/60 transition-colors">
                  <Link to={`/album/${album.id}`} className="hover:text-(--color-fg-secondary)">
                    {album.name}
                  </Link>
                  <button hidden={user === null || user === undefined} onClick={() => void deleteItem("album", album.id)} className="text-(--color-error) hover:opacity-80">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-semibold">Tracks without listens ({tracksWithoutListens.length})</h2>
              <button
                hidden={user === null || user === undefined}
                disabled={tracksWithoutListens.length === 0 || isDeletingAll !== ""}
                onClick={() => void deleteAllItems("track", tracksWithoutListens.map((v) => v.id))}
                className="default"
              >
                {isDeletingAll === "tracks" ? "Deleting..." : "Delete all"}
              </button>
            </div>
            <ul className="space-y-2 max-h-[420px] overflow-y-auto">
              {tracksWithoutListens.map((track) => (
                <li key={`orphan_track_${track.id}`} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-(--color-bg-tertiary)/60 transition-colors">
                  <Link to={`/track/${track.id}`} className="hover:text-(--color-fg-secondary)">
                    {track.name}
                  </Link>
                  <button hidden={user === null || user === undefined} onClick={() => void deleteItem("track", track.id)} className="text-(--color-error) hover:opacity-80">
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </Card>
      </div>
    </main>
  );
}
