import type { Dispatch, FormEvent, SetStateAction } from "react";
import type {
  MemberDraft,
  NewMemberDraft,
} from "@/features/spotify-familiar/types";

type MemberFormProps = {
  newMemberDraft: NewMemberDraft;
  setNewMemberDraft: Dispatch<SetStateAction<NewMemberDraft>>;
  memberDraft: MemberDraft | null;
  setMemberDraft: Dispatch<SetStateAction<MemberDraft | null>>;
  savingMember: boolean;
  addMember: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  updateMember: (event: FormEvent<HTMLFormElement>) => Promise<void>;
};

export function MemberForm({
  newMemberDraft,
  setNewMemberDraft,
  memberDraft,
  setMemberDraft,
  savingMember,
  addMember,
  updateMember,
}: MemberFormProps) {
  return (
    <>
      <form
        onSubmit={addMember}
        className="rounded-2xl border border-slate-800 bg-slate-950 p-4"
      >
        <h2 className="text-xl font-semibold">Agregar persona</h2>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-sm text-slate-400">Nombre</span>
            <input
              value={newMemberDraft.name}
              onChange={(event) =>
                setNewMemberDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              placeholder="Nombre"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <label className="block">
              <span className="text-sm text-slate-400">Monto mensual</span>
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={newMemberDraft.monthlyAmount}
                onChange={(event) =>
                  setNewMemberDraft((current) => ({
                    ...current,
                    monthlyAmount: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
              />
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">Empieza en</span>
              <input
                type="month"
                value={newMemberDraft.startMonth}
                onChange={(event) =>
                  setNewMemberDraft((current) => ({
                    ...current,
                    startMonth: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
              />
            </label>
          </div>
        </div>
        <button
          type="submit"
          disabled={savingMember}
          className="mt-5 w-full rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {savingMember ? "Guardando..." : "Guardar persona"}
        </button>
      </form>

      {memberDraft ? (
        <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
          <form
            onSubmit={updateMember}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/40"
          >
            <p className="text-sm font-semibold text-green-400">Persona</p>
            <h2 className="mt-1 text-2xl font-semibold">Editar datos</h2>
            <div className="mt-5 grid gap-4">
              <label className="block">
                <span className="text-sm text-slate-400">Nombre</span>
                <input
                  value={memberDraft.name}
                  onChange={(event) =>
                    setMemberDraft((current) =>
                      current ? { ...current, name: event.target.value } : current
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm text-slate-400">Monto mensual</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={memberDraft.monthlyAmount}
                    onChange={(event) =>
                      setMemberDraft((current) =>
                        current
                          ? { ...current, monthlyAmount: event.target.value }
                          : current
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-slate-400">Empieza en</span>
                  <input
                    type="month"
                    value={memberDraft.startMonth}
                    onChange={(event) =>
                      setMemberDraft((current) =>
                        current
                          ? { ...current, startMonth: event.target.value }
                          : current
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
                  />
                </label>
              </div>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900 p-3">
                <span>
                  <span className="block text-sm font-semibold text-slate-100">
                    Persona activa
                  </span>
                  <span className="mt-1 block text-xs text-slate-400">
                    Si se va, puedes desactivarla para conservar historial.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={memberDraft.active}
                  onChange={(event) =>
                    setMemberDraft((current) =>
                      current
                        ? { ...current, active: event.target.checked }
                        : current
                    )
                  }
                  className="h-5 w-5 accent-green-500"
                />
              </label>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-2">
              <button
                type="submit"
                disabled={savingMember}
                className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
              >
                {savingMember ? "Guardando..." : "Guardar cambios"}
              </button>
              <button
                type="button"
                onClick={() => setMemberDraft(null)}
                disabled={savingMember}
                className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
