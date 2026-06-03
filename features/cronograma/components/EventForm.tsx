import type { Dispatch, SetStateAction } from "react";
import type { EventDraft, UniEventType } from "@/features/cronograma/types";

type EventFormProps = {
  draft: EventDraft;
  setDraft: Dispatch<SetStateAction<EventDraft>>;
  onCancel: () => void;
  onSubmit: () => Promise<void>;
  submitLabel: string;
  secondaryAction?: {
    label: string;
    onClick: () => Promise<void>;
  };
};

export function EventForm({
  draft,
  setDraft,
  onCancel,
  onSubmit,
  submitLabel,
  secondaryAction,
}: EventFormProps) {
  return (
    <div className="mt-4 space-y-3">
      <div>
        <label className="text-sm font-medium text-slate-200">Título</label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={draft.title}
          onChange={(e) =>
            setDraft((current) => ({ ...current, title: e.target.value }))
          }
          placeholder="Ej: Parcial 1"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-slate-200">Desde</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            value={draft.startDate}
            onChange={(e) => {
              const value = e.target.value;
              setDraft((current) => ({
                ...current,
                startDate: value,
                endDate: current.endDate < value ? value : current.endDate,
              }));
            }}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-200">Hasta</label>
          <input
            type="date"
            className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
            value={draft.endDate}
            onChange={(e) =>
              setDraft((current) => ({ ...current, endDate: e.target.value }))
            }
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-200">Tipo</label>
        <select
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={draft.type}
          onChange={(e) =>
            setDraft((current) => ({
              ...current,
              type: e.target.value as UniEventType,
            }))
          }
        >
          <option value="evaluado_entrega">Evaluado / Entrega (Rojo)</option>
          <option value="reunion">Reunión (Amarillo)</option>
          <option value="teorica">Teórica (Verde)</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium text-slate-200">
          % (opcional)
        </label>
        <input
          className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
          value={draft.weight}
          onChange={(e) =>
            setDraft((current) => ({ ...current, weight: e.target.value }))
          }
          placeholder="Ej: 20"
          inputMode="numeric"
        />
      </div>

      <div className="flex gap-2 pt-2">
        {secondaryAction ? (
          <button
            onClick={secondaryAction.onClick}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 py-3 font-medium text-slate-200 hover:bg-slate-800"
          >
            {secondaryAction.label}
          </button>
        ) : (
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950/70 py-3 font-medium text-slate-200 hover:bg-slate-800"
          >
            Cancelar
          </button>
        )}
        <button
          onClick={onSubmit}
          className="flex-1 rounded-xl bg-blue-500 py-3 font-semibold text-slate-950"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}
