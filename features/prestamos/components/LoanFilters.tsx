import { loanCategories, loanTabs } from "@/features/prestamos/constants";
import type { LoanCategory, LoanTab } from "@/features/prestamos/types";

type LoanFiltersProps = {
  activeTab: LoanTab;
  setActiveTab: (tab: LoanTab) => void;
  search: string;
  setSearch: (value: string) => void;
  selectedCategory: LoanCategory | "Todas";
  setSelectedCategory: (value: LoanCategory | "Todas") => void;
  activeCount: number;
  unknownCount: number;
  historyCount: number;
};

export function LoanFilters({
  activeTab,
  setActiveTab,
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  activeCount,
  unknownCount,
  historyCount,
}: LoanFiltersProps) {
  const tabCounts: Record<LoanTab, number> = {
    active: activeCount,
    unknown: unknownCount,
    history: historyCount,
  };

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4">
      <div className="flex flex-wrap gap-2">
        {loanTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={[
              "rounded-xl border px-3 py-2 text-sm font-semibold transition",
              activeTab === tab.id
                ? "border-blue-400 bg-blue-500 text-slate-950"
                : "border-slate-700 bg-slate-950/60 text-slate-300 hover:border-blue-400/70",
            ].join(" ")}
          >
            {tab.label} · {tabCounts[tab.id]}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <label className="block">
          <span className="text-sm text-slate-400">Buscar</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Artículo, persona o notas"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Categoría</span>
          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value as LoanCategory | "Todas")
            }
            disabled={activeTab !== "active"}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <option value="Todas">Todas</option>
            {loanCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
