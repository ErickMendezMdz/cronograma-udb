import type { BreakdownItem } from "@/features/pretty-salon/types";
import { money } from "@/features/pretty-salon/utils";

type PrettyCategoryBreakdownProps = {
  title?: string;
  items: BreakdownItem[];
  emptyMessage: string;
  variant?: "plain" | "card";
};

export function PrettyCategoryBreakdown({
  title,
  items,
  emptyMessage,
  variant = "plain",
}: PrettyCategoryBreakdownProps) {
  const content =
    items.length === 0 ? (
      <p className="text-sm text-[#aeb5bf]">{emptyMessage}</p>
    ) : (
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[#eef2f4]">{item.label}</span>
              <span className="font-semibold text-[#f7f9fb]">{money.format(item.value)}</span>
            </div>
            <div className="mt-2 h-2 rounded-md bg-[#2a2d33]">
              <div
                className="h-full rounded-md"
                style={{ width: `${Math.max(item.share, 4)}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    );

  if (variant === "card") {
    return (
      <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#101113] p-4">
        {title ? <h3 className="text-base font-semibold text-[#f7f9fb]">{title}</h3> : null}
        <div className="mt-4">{content}</div>
      </div>
    );
  }

  return content;
}
