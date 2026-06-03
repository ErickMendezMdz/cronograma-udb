import { EventCard } from "@/features/cronograma/components/EventCard";
import { SubjectsColumn } from "@/features/cronograma/components/SubjectsColumn";
import type {
  CalendarBar,
  Subject,
  UniEvent,
  WeekDay,
} from "@/features/cronograma/types";

const TODAY_HEAD = "bg-blue-500/15 ring-1 ring-blue-400/40";
const TODAY_CELL = "bg-blue-500/10 ring-1 ring-inset ring-blue-400/35";

type WeeklyCalendarGridProps = {
  gridHeight: number;
  loadingData: boolean;
  subjects: Subject[];
  weekDays: WeekDay[];
  todayISO: string;
  barsBySubject: Map<string, CalendarBar[]>;
  openAddModal: (subjectId: string, iso: string) => void;
  openEditModal: (event: UniEvent) => void;
};

export function WeeklyCalendarGrid({
  gridHeight,
  loadingData,
  subjects,
  weekDays,
  todayISO,
  barsBySubject,
  openAddModal,
  openEditModal,
}: WeeklyCalendarGridProps) {
  const subjectColWidth = 50;
  const dayMinWidth = 130;
  const laneHeight = 30;
  const baseRowHeight = 200;

  return (
    <div
      className="mt-3 overflow-hidden rounded-2xl border border-slate-700/70 bg-slate-900/85 shadow-2xl shadow-black/20"
      style={{ height: gridHeight }}
    >
      <div
        className="overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]"
        style={{ height: "100%" }}
      >
        <div style={{ minWidth: subjectColWidth + 7 * dayMinWidth }}>
          <div
            className="grid border-b border-slate-700 bg-slate-800"
            style={{
              gridTemplateColumns: `${subjectColWidth}px repeat(7, minmax(${dayMinWidth}px, 1fr))`,
            }}
          >
            <div className="sticky left-0 z-20 border-r border-slate-700 bg-slate-800 px-3 py-4 font-semibold">
              Mat
            </div>

            {weekDays.map((day) => (
              <div
                key={day.iso}
                className={[
                  "border-l border-slate-700 px-2 py-3 text-center",
                  day.iso === todayISO ? TODAY_HEAD : "",
                ].join(" ")}
              >
                <div className="text-xs font-semibold sm:text-sm">
                  {day.dowLabel}
                </div>
                <div className="text-[10px] capitalize text-slate-400">
                  {day.monthLabel}
                </div>
                <div className="text-xs sm:text-sm">{day.dayNum}</div>
                {day.iso === todayISO && (
                  <div className="mt-1 text-[10px] font-semibold text-blue-300">
                    HOY
                  </div>
                )}
              </div>
            ))}
          </div>

          {loadingData ? (
            <div className="p-6 text-center text-slate-400">Cargando...</div>
          ) : subjects.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              No hay materias. Dale a <b>“Cargar materias”</b>.
            </div>
          ) : (
            subjects.map((subject) => {
              const bars = barsBySubject.get(subject.id) ?? [];
              const maxLane = bars.reduce(
                (acc, bar) => Math.max(acc, bar.lane),
                -1
              );
              const headerRowH = 92;
              const legendH = 90;
              const availableForRows = gridHeight - headerRowH - legendH;
              const fitRow = Math.floor(availableForRows / subjects.length);
              const naturalRow = Math.max(
                baseRowHeight,
                (maxLane + 1) * laneHeight + 28
              );
              const rowHeight = Math.max(70, Math.min(naturalRow, fitRow));

              return (
                <div
                  key={subject.id}
                  className="relative border-b border-slate-700"
                  style={{ height: rowHeight }}
                >
                  <div
                    className="grid"
                    style={{
                      height: rowHeight,
                      gridTemplateColumns: `${subjectColWidth}px repeat(7, minmax(${dayMinWidth}px, 1fr))`,
                    }}
                  >
                    <SubjectsColumn code={subject.code} />

                    {weekDays.map((day) => (
                      <div
                        key={day.iso}
                        className={[
                          "cursor-pointer border-l border-slate-800 hover:bg-slate-800/60",
                          day.iso === todayISO ? TODAY_CELL : "",
                        ].join(" ")}
                        onClick={() => openAddModal(subject.id, day.iso)}
                        title="Agregar actividad"
                      />
                    ))}
                  </div>

                  <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                      left: subjectColWidth,
                      right: 0,
                    }}
                  >
                    {bars.map((bar) => (
                      <EventCard
                        key={bar.id}
                        event={bar}
                        dayMinWidth={dayMinWidth}
                        openEditModal={openEditModal}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div className="flex flex-wrap gap-3 border-t border-slate-700 bg-slate-900 p-3 text-xs text-slate-400">
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-rose-700" />
              Evaluado/Entrega
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-amber-400" />
              Reunión
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-emerald-700" />
              Teórica
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded bg-blue-400/60" />
              Hoy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
