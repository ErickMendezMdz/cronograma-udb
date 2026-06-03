import type { Dispatch, SetStateAction } from "react";
import { EventForm } from "@/features/cronograma/components/EventForm";
import type { EventDraft } from "@/features/cronograma/types";

type EventModalProps = {
  title: string;
  draft: EventDraft;
  setDraft: Dispatch<SetStateAction<EventDraft>>;
  close: () => void;
  submit: () => Promise<void>;
  submitLabel: string;
  secondaryAction?: {
    label: string;
    onClick: () => Promise<void>;
  };
};

export function EventModal({
  title,
  draft,
  setDraft,
  close,
  submit,
  submitLabel,
  secondaryAction,
}: EventModalProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/50 p-3 sm:items-center sm:p-4"
      onClick={close}
    >
      <div
        className="max-h-[85vh] w-[calc(100vw-24px)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl shadow-black/30 sm:w-full sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={close}
            className="rounded-lg px-3 py-1 text-slate-300 hover:bg-slate-800"
          >
            x
          </button>
        </div>

        <EventForm
          draft={draft}
          setDraft={setDraft}
          onCancel={close}
          onSubmit={submit}
          submitLabel={submitLabel}
          secondaryAction={secondaryAction}
        />
      </div>
    </div>
  );
}
