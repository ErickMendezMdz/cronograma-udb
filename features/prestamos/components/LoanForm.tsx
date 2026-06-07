import { type FormEvent } from "react";
import { loanCategories } from "@/features/prestamos/constants";
import type { LoanFormState } from "@/features/prestamos/types";

type LoanFormProps = {
  form: LoanFormState;
  updateForm: <K extends keyof LoanFormState>(
    field: K,
    value: LoanFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  editing: boolean;
};

export function LoanForm({
  form,
  updateForm,
  onSubmit,
  onCancel,
  saving,
  editing,
}: LoanFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-blue-500/30 bg-slate-900/90 p-4 shadow-2xl shadow-black/20"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-blue-300">
            {editing ? "Editar registro" : "Registrar préstamo"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-100">
            {editing ? "Actualizar cosa prestada" : "¿Qué prestaste?"}
          </h2>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
        >
          Cancelar
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="text-sm text-slate-400">Artículo / cosa prestada</span>
          <input
            value={form.itemName}
            onChange={(event) => updateForm("itemName", event.target.value)}
            placeholder="Ej. Taladro, libro, DUI, chaqueta"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none transition focus:border-blue-400 sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Persona</span>
          <input
            value={form.borrowerName}
            onChange={(event) => updateForm("borrowerName", event.target.value)}
            placeholder="Quién lo tiene"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none transition focus:border-blue-400 sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Categoría</span>
          <select
            value={form.category}
            onChange={(event) =>
              updateForm("category", event.target.value as LoanFormState["category"])
            }
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none transition focus:border-blue-400 sm:text-sm"
          >
            {loanCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-slate-400">Fecha de préstamo</span>
          <input
            type="date"
            value={form.loanDate}
            onChange={(event) => updateForm("loanDate", event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none transition focus:border-blue-400 sm:text-sm"
          />
        </label>

        <label className="block md:col-span-2">
          <span className="text-sm text-slate-400">Notas</span>
          <textarea
            value={form.notes}
            onChange={(event) => updateForm("notes", event.target.value)}
            rows={3}
            placeholder="Detalle opcional"
            className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none transition focus:border-blue-400 sm:text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="mt-5 w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {saving ? "Guardando..." : editing ? "Guardar cambios" : "Guardar préstamo"}
      </button>
    </form>
  );
}
