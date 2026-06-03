import type { Dispatch, SetStateAction } from "react";
import type {
  PaymentDraft,
  SpotifyMember,
} from "@/features/spotify-familiar/types";
import {
  money,
  paymentMethods,
} from "@/features/spotify-familiar/hooks/useSpotifyFamily";

type PaymentFormProps = {
  paymentDraft: PaymentDraft | null;
  setPaymentDraft: Dispatch<SetStateAction<PaymentDraft | null>>;
  members: SpotifyMember[];
  savingPaymentFor: string | null;
  savePayment: (draft: PaymentDraft) => Promise<void>;
};

export function PaymentForm({
  paymentDraft,
  setPaymentDraft,
  members,
  savingPaymentFor,
  savePayment,
}: PaymentFormProps) {
  if (!paymentDraft) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/70 p-4 sm:items-center sm:justify-center">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void savePayment(paymentDraft);
        }}
        className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl shadow-black/40"
      >
        <p className="text-sm font-semibold text-green-400">Registrar pago</p>
        <h2 className="mt-1 text-2xl font-semibold">
          {members.find((item) => item.id === paymentDraft.memberId)?.name ??
            "Persona"}
        </h2>
        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="text-sm text-slate-400">Cantidad de meses</span>
            <input
              type="number"
              min="1"
              step="1"
              value={paymentDraft.months}
              onChange={(event) =>
                setPaymentDraft((current) =>
                  current ? { ...current, months: event.target.value } : current
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
            />
          </label>
          <label className="block">
            <span className="text-sm text-slate-400">Monto por mes</span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={paymentDraft.amountPerMonth}
              onChange={(event) =>
                setPaymentDraft((current) =>
                  current
                    ? { ...current, amountPerMonth: event.target.value }
                    : current
                )
              }
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
            />
          </label>
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
            <p className="text-sm text-slate-400">Total a registrar</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">
              {money.format(
                (Number(paymentDraft.months) || 0) *
                  (Number(paymentDraft.amountPerMonth) || 0)
              )}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-slate-400">Metodo</span>
              <select
                value={paymentDraft.paymentMethod}
                onChange={(event) =>
                  setPaymentDraft((current) =>
                    current
                      ? { ...current, paymentMethod: event.target.value }
                      : current
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-slate-400">Fecha</span>
              <input
                type="date"
                value={paymentDraft.paymentDate}
                onChange={(event) =>
                  setPaymentDraft((current) =>
                    current
                      ? { ...current, paymentDate: event.target.value }
                      : current
                  )
                }
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm text-slate-400">Notas</span>
            <textarea
              value={paymentDraft.notes}
              onChange={(event) =>
                setPaymentDraft((current) =>
                  current ? { ...current, notes: event.target.value } : current
                )
              }
              rows={3}
              className="mt-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-slate-100 outline-none focus:border-green-400"
            />
          </label>
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="submit"
            disabled={savingPaymentFor === paymentDraft.memberId}
            className="rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-60"
          >
            {savingPaymentFor === paymentDraft.memberId
              ? "Guardando..."
              : "Confirmar pago"}
          </button>
          <button
            type="button"
            onClick={() => setPaymentDraft(null)}
            disabled={savingPaymentFor === paymentDraft.memberId}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
