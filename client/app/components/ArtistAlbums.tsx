import { useQuery } from "@tanstack/react-query";
import { getTopAlbums, imageUrl, type getItemsArgs } from "api/api";
import { Link } from "react-router";
import Card from "./Card";

interface Props {
  artistId: number;
  name: string;
  period: string;
}

export default function ArtistAlbums({ artistId, name }: Props) {
  const { isPending, isError, data, error } = useQuery({
    queryKey: [
      "top-albums",
      { limit: 99, period: "all_time", artist_id: artistId },
    ],
    queryFn: ({ queryKey }) => getTopAlbums(queryKey[1] as getItemsArgs),
  });

  if (isPending) {
    return (
      <Card className="w-full">
        <h3>Albums From This Artist</h3>
        <p>Loading...</p>
      </Card>
    );
  }
  if (isError) {
    return (
      <Card className="w-full">
        <h3>Albums From This Artist</h3>
        <p className="error">Error:{error.message}</p>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <h3>Albums featuring {name}</h3>
      <div className="flex flex-wrap gap-4">
        {data.items.map((item) => (
          <Link
            key={item.item.id}
            to={`/album/${item.item.id}`}
            className="flex flex-col gap-2 items-start w-[130px] rounded-lg p-2 -m-2 hover:bg-(--color-bg-tertiary)/60 transition-colors"
          >
            <img
              src={imageUrl(item.item.image, "medium")}
              alt={item.item.title}
              className="w-full rounded-lg object-cover aspect-square"
            />
            <div className="flex flex-col items-start gap-0.5">
              <p className="text-sm font-medium truncate w-full">
                {item.item.title}
              </p>
              <p className="text-xs text-(--color-fg-secondary)">
                {item.item.listen_count} play
                {item.item.listen_count > 1 ? "s" : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
