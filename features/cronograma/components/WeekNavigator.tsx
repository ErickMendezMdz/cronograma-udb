import { addDays } from "@/lib/week";

type WeekNavigatorProps = {
  weekAnchor: Date;
  setWeekAnchor: (date: Date) => void;
  openSubjectsManager: () => void;
};

export function WeekNavigator({
  weekAnchor,
  setWeekAnchor,
  openSubjectsManager,
}: WeekNavigatorProps) {
  return (
    <div className="mt flex gap-2 overflow-x-auto pb-1">
      <button
        onClick={() => setWeekAnchor(addDays(weekAnchor, -7))}
        className="shrink-0 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800"
      >
        ← Semana
      </button>
      <button
        onClick={() => setWeekAnchor(new Date())}
        className="shrink-0 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
      >
        Hoy
      </button>
      <button
        onClick={() => setWeekAnchor(addDays(weekAnchor, 7))}
        className="shrink-0 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800"
      >
        Semana →
      </button>
      <button
        onClick={openSubjectsManager}
        className="shrink-0 rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-slate-950"
      >
        Gestionar materias
      </button>
    </div>
  );
}
