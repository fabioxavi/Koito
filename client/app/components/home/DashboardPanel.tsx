import { Link } from "react-router";
import type { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  icon?: LucideIcon;
  href?: string;
  children: React.ReactNode;
}

export default function DashboardPanel({ title, icon: Icon, href, children }: Props) {
  return (
    <div className="rounded-2xl border border-(--color-bg-tertiary) bg-(--color-bg-secondary) p-4 flex flex-col min-h-0 h-[420px]">
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-2 font-semibold">
          {Icon && <Icon size={16} className="text-(--color-fg-secondary)" />}
          {title}
        </div>
        {href && (
          <Link
            to={href}
            className="text-xs text-(--color-fg-secondary) hover:text-(--color-fg)"
          >
            See all
          </Link>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">{children}</div>
    </div>
  );
}
