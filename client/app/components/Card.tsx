import React from "react";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Card({ children, className }: Props) {
  return (
    <div
      className={`rounded-2xl border border-(--color-bg-tertiary) bg-(--color-bg-secondary) p-4 sm:p-5 shadow-sm ${
        className ?? ""
      }`}
    >
      {children}
    </div>
  );
}
