interface Props {
  value: React.ReactNode;
  label: string;
  title?: string;
  accent?: "primary" | "accent" | "success" | "warning" | "error";
}

const accentVar: Record<string, string> = {
  primary: "--color-primary",
  accent: "--color-accent",
  success: "--color-success",
  warning: "--color-warning",
  error: "--color-error",
};

export default function StatTile({ value, label, title, accent }: Props) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl bg-(--color-bg-tertiary)/40 px-4 py-3"
      title={title}
    >
      <span
        className="header-font font-bold text-2xl sm:text-3xl leading-tight"
        style={accent ? { color: `var(${accentVar[accent]})` } : undefined}
      >
        {value}
      </span>
      <span className="text-sm text-(--color-fg-secondary)">{label}</span>
    </div>
  );
}
