import type { ReactNode } from "react";

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <span className="h-5 w-1 rounded-full bg-highlight" />
        {title}
      </h2>
      {action}
    </div>
  );
}

export const seeAllClass =
  "rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep hover:bg-primary hover:text-primary-foreground transition-colors";
