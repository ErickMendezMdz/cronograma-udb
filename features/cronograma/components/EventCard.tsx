import { chipClass } from "@/features/cronograma/hooks/useCronograma";
import type { CalendarBar } from "@/features/cronograma/types";

type EventCardProps = {
  event: CalendarBar;
  dayMinWidth: number;
  openEditModal: (event: CalendarBar) => void;
};

export function EventCard({
  event,
  dayMinWidth,
  openEditModal,
}: EventCardProps) {
  const startCol = event.startIdx + 1;
  const endCol = event.endIdx + 2;
  const top = 12 + event.lane * 30;

  return (
    <div
      className="absolute left-0 right-0"
      style={{
        top,
        display: "grid",
        gridTemplateColumns: `repeat(7, minmax(${dayMinWidth}px, 1fr))`,
      }}
    >
      <button
        type="button"
        onClick={(evt) => {
          evt.stopPropagation();
          openEditModal(event);
        }}
        className={[
          "pointer-events-auto",
          "mx-1",
          "rounded-lg px-3 py-2 text-left font-semibold",
          "text-[12px] leading-tight",
          "whitespace-normal break-words",
          "shadow-lg shadow-black/20",
          chipClass(event.type),
        ].join(" ")}
        style={{ gridColumn: `${startCol} / ${endCol}` }}
        title="Editar / borrar"
      >
        {event.title}
        {event.weight_percent != null ? ` (${event.weight_percent}%)` : ""}
      </button>
    </div>
  );
}
