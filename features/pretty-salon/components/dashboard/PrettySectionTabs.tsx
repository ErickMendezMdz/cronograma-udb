import type { SectionId } from "@/features/pretty-salon/types";

type PrettySectionTabsProps = {
  items: Array<{ id: SectionId; label: string; detail: string }>;
  activeSection: SectionId;
  onChange: (section: SectionId) => void;
};

export function PrettySectionTabs({
  items,
  activeSection,
  onChange,
}: PrettySectionTabsProps) {
  return (
    <nav className="mt-5 hidden gap-2 lg:grid">
      {items.map((item) => {
        const isActive = activeSection === item.id;

        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={[
              "min-w-[128px] rounded-lg border px-3 py-3 text-left transition lg:min-w-0",
              isActive
                ? "border-[#00c2a8] bg-[#0f312e] text-[#f7f9fb]"
                : "border-[#30333a] bg-[#181a1e] text-[#d8dde3] hover:border-[#70d6ff]",
            ].join(" ")}
          >
            <span className="block text-sm font-semibold">{item.label}</span>
            <span className="mt-1 block text-xs text-[#aeb5bf]">{item.detail}</span>
          </button>
        );
      })}
    </nav>
  );
}
