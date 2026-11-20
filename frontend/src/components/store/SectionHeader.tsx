import type { ReactNode } from "react";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold">{title}</h2>
      {action}
    </div>
  );
}

export const seeAllClass =
  "py-1 text-sm font-semibold text-primary transition-colors hover:text-primary-deep";
