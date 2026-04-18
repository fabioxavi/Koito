import { useQuery } from "@tanstack/react-query";
import { getStats, type Stats, type ApiError } from "api/api";
import { Clock, Music, Calendar } from "lucide-react";

export default function AllTimeStats() {
  const { isPending, isError, data, error } = useQuery({
    queryKey: ["stats", "all_time"],
    queryFn: ({ queryKey }) => getStats(queryKey[1]),
  });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary) animate-pulse">
            <div className="h-4 w-24 bg-(--color-bg-tertiary) rounded mb-4"></div>
            <div className="h-10 w-16 bg-(--color-bg-tertiary) rounded"></div>
          </div>
        ))}
      </div>
    );
  } else if (isError) {
    return (
      <div className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary)">
        <p className="error">Error: {error.message}</p>
      </div>
    );
  }

  const hours = Math.floor(data.minutes_listened / 60);
  const dailyAvg = Math.round(data.listen_count / 365);

  const stats = [
    {
      icon: Clock,
      label: "Minutes Listened",
      value: hours > 0 ? `${hours}h` : `${data.minutes_listened}m`,
      title: `${data.minutes_listened} minutes total`,
    },
    {
      icon: Music,
      label: "Songs Played",
      value: data.listen_count.toLocaleString(),
      title: `${data.listen_count} total plays`,
    },
    {
      icon: Calendar,
      label: "Daily Average",
      value: dailyAvg.toLocaleString(),
      title: `${dailyAvg} plays per day on average`,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-(--color-bg-secondary) rounded-lg p-6 border border-(--color-bg-tertiary) flex flex-col items-center text-center"
          title={stat.title}
        >
          <div className="flex items-center gap-2 text-(--color-fg-secondary) text-sm mb-3">
            <stat.icon size={16} className="text-(--color-primary)" />
            <span>{stat.label}</span>
          </div>
          <span className="header-font font-bold text-3xl md:text-4xl text-(--color-fg)">
            {stat.value}
          </span>
        </div>
      ))}
    </div>
  );
}
