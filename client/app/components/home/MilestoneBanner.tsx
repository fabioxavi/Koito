import { useQuery } from "@tanstack/react-query";
import { getStats } from "api/api";

const MILESTONES = [
  1000, 2500, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
];

export default function MilestoneBanner() {
  const { data } = useQuery({
    queryKey: ["stats", "all_time"],
    queryFn: ({ queryKey }) => getStats(queryKey[1]),
  });

  if (!data) return null;

  const count = data.listen_count;
  const next = MILESTONES.find((m) => m > count);
  if (!next) return null;

  const prev = MILESTONES[MILESTONES.indexOf(next) - 1] ?? 0;
  const progress = Math.min(100, ((count - prev) / (next - prev)) * 100);
  const remaining = next - count;

  return (
    <div className="rounded-2xl border border-(--color-bg-tertiary) bg-(--color-bg-secondary)/70 px-5 py-4 flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span>
          🎉 Faltam <strong>{remaining.toLocaleString()}</strong> plays para chegares às{" "}
          <strong>{next.toLocaleString()}</strong>
        </span>
        <span className="text-(--color-fg-secondary)">
          {count.toLocaleString()} / {next.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-(--color-bg-tertiary) overflow-hidden">
        <div
          className="h-full rounded-full bg-(--color-primary) transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
