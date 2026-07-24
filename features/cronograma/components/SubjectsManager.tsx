"use client";

import { useMemo, useState } from "react";
import type {
  Subject,
  SubjectDraft,
} from "@/features/cronograma/types";

type SubjectRowProps = {
  subject: Subject;
  working: boolean;
  onUpdate: (subjectId: string, draft: SubjectDraft) => Promise<void>;
  onDelete: (subject: Subject) => Promise<void>;
};

function SubjectRow({
  subject,
  working,
  onUpdate,
  onDelete,
}: SubjectRowProps) {
  const [draft, setDraft] = useState<SubjectDraft>({
    code: subject.code,
    name: subject.name ?? "",
    orderIndex: subject.order_index,
  });

  return (
    <form
      className="grid gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3 sm:grid-cols-[110px_minmax(0,1fr)_84px_auto]"
      onSubmit={(event) => {
        event.preventDefault();
        void onUpdate(subject.id, draft);
      }}
    >
      <label className="text-xs font-medium text-slate-400">
        Código
        <input
          required
          value={draft.code}
          onChange={(event) =>
            setDraft((current) => ({ ...current, code: event.target.value }))
          }
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm uppercase text-slate-100 outline-none focus:border-blue-400"
        />
      </label>

      <label className="text-xs font-medium text-slate-400">
        Nombre opcional
        <input
          value={draft.name}
          onChange={(event) =>
            setDraft((current) => ({ ...current, name: event.target.value }))
          }
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 outline-none focus:border-blue-400"
        />
      </label>

      <label className="text-xs font-medium text-slate-400">
        Orden
        <input
          required
          min={1}
          type="number"
          value={draft.orderIndex}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              orderIndex: Number(event.target.value),
            }))
          }
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 outline-none focus:border-blue-400"
        />
      </label>

      <div className="flex items-end gap-2">
        <button
          type="submit"
          disabled={working}
          className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-60"
        >
          Guardar
        </button>
        <button
          type="button"
          disabled={working}
          onClick={() => void onDelete(subject)}
          className="rounded-lg border border-red-900 bg-red-950/50 px-3 py-2 text-xs font-semibold text-red-100 disabled:opacity-60"
        >
          Eliminar
        </button>
      </div>
    </form>
  );
}

type SubjectsManagerProps = {
  subjects: Subject[];
  workingId: string | null;
  onClose: () => void;
  onCreate: (draft: SubjectDraft) => Promise<boolean>;
  onUpdate: (subjectId: string, draft: SubjectDraft) => Promise<void>;
  onDelete: (subject: Subject) => Promise<void>;
  onClear: () => Promise<void>;
};

export function SubjectsManager({
  subjects,
  workingId,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onClear,
}: SubjectsManagerProps) {
  const nextOrder = useMemo(
    () =>
      subjects.reduce(
        (highest, subject) => Math.max(highest, subject.order_index),
        0
      ) + 1,
    [subjects]
  );
  const [newDraft, setNewDraft] = useState<SubjectDraft>({
    code: "",
    name: "",
    orderIndex: nextOrder,
  });

  async function createSubject() {
    const created = await onCreate(newDraft);
    if (!created) return;

    setNewDraft({
      code: "",
      name: "",
      orderIndex: nextOrder + 1,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-3 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 text-slate-100 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Gestionar materias</h2>
            <p className="mt-1 text-sm text-slate-400">
              Agrega, edita o elimina las materias que aparecen en el
              calendario.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-slate-300 hover:bg-slate-800"
            aria-label="Cerrar"
          >
            x
          </button>
        </div>

        <form
          className="mt-5 grid gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 sm:grid-cols-[110px_minmax(0,1fr)_84px_auto]"
          onSubmit={(event) => {
            event.preventDefault();
            void createSubject();
          }}
        >
          <label className="text-xs font-medium text-slate-300">
            Código
            <input
              required
              autoFocus
              value={newDraft.code}
              onChange={(event) =>
                setNewDraft((current) => ({
                  ...current,
                  code: event.target.value,
                }))
              }
              placeholder="Ej: MAT"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm uppercase text-slate-100 outline-none focus:border-blue-400"
            />
          </label>

          <label className="text-xs font-medium text-slate-300">
            Nombre opcional
            <input
              value={newDraft.name}
              onChange={(event) =>
                setNewDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Ej: Matemática"
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 outline-none focus:border-blue-400"
            />
          </label>

          <label className="text-xs font-medium text-slate-300">
            Orden
            <input
              required
              min={1}
              type="number"
              value={newDraft.orderIndex}
              onChange={(event) =>
                setNewDraft((current) => ({
                  ...current,
                  orderIndex: Number(event.target.value),
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-slate-100 outline-none focus:border-blue-400"
            />
          </label>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={workingId !== null}
              className="w-full rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-60"
            >
              {workingId === "new" ? "Agregando..." : "Agregar"}
            </button>
          </div>
        </form>

        <div className="mt-5 space-y-3">
          {subjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center text-sm text-slate-400">
              No hay materias. Agrega la primera con el formulario anterior.
            </div>
          ) : (
            subjects.map((subject) => (
              <SubjectRow
                key={[
                  subject.id,
                  subject.code,
                  subject.name,
                  subject.order_index,
                ].join(":")}
                subject={subject}
                working={workingId !== null}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-700 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-400">
            Eliminar una materia también elimina todas sus actividades.
          </p>
          <button
            type="button"
            disabled={workingId !== null}
            onClick={() => void onClear()}
            className="rounded-lg border border-red-900 bg-red-950/50 px-4 py-2 text-sm font-semibold text-red-100 disabled:opacity-60"
          >
            {workingId === "clear"
              ? "Limpiando..."
              : "Limpiar todo el cronograma"}
          </button>
        </div>
      </div>
    </div>
  );
}
