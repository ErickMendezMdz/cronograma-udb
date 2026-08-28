"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { CreditCard, SavingsAccount } from "@/features/recordatorios/types";

type Props = {
  cards: CreditCard[];
  accounts: SavingsAccount[];
  saving: boolean;
  onCreateCard: (input: Omit<CreditCard, "id" | "active">) => Promise<boolean>;
  onCreateAccount: (name: string) => Promise<boolean>;
};

const inputClass = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-emerald-400 sm:text-sm";

export function ReminderSetup({ cards, accounts, saving, onCreateCard, onCreateAccount }: Props) {
  const [open, setOpen] = useState(false);
  const [card, setCard] = useState({ name: "", bank: "", cutDay: 1, dueDay: 1 });
  const [accountName, setAccountName] = useState("");

  async function saveCard(event: FormEvent) {
    event.preventDefault();
    if (!card.name.trim()) return;
    if (await onCreateCard(card)) setCard({ name: "", bank: "", cutDay: 1, dueDay: 1 });
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    if (!accountName.trim()) return;
    if (await onCreateAccount(accountName)) setAccountName("");
  }

  return (
    <section className="rounded-2xl border border-slate-700 bg-slate-900/70">
      <button onClick={() => setOpen((value) => !value)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <span>
          <span className="block font-semibold text-slate-100">Tarjetas y cuentas</span>
          <span className="mt-1 block text-sm text-slate-400">{cards.length} tarjetas · {accounts.length} cuentas identificadas</span>
        </span>
        <span className="text-sm text-emerald-300">{open ? "Cerrar" : "Configurar"}</span>
      </button>
      {open ? (
        <div className="grid gap-5 border-t border-slate-700 p-4 lg:grid-cols-2">
          <form onSubmit={saveCard}>
            <h3 className="font-semibold text-slate-100">Nueva tarjeta</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label><span className="text-sm text-slate-400">Nombre para distinguirla</span><input className={inputClass} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="BAC Azul" required /></label>
              <label><span className="text-sm text-slate-400">Banco</span><input className={inputClass} value={card.bank} onChange={(e) => setCard({ ...card, bank: e.target.value })} placeholder="Opcional" /></label>
              <label><span className="text-sm text-slate-400">Día de corte</span><input className={inputClass} type="number" min="1" max="31" value={card.cutDay} onChange={(e) => setCard({ ...card, cutDay: Number(e.target.value) })} required /></label>
              <label><span className="text-sm text-slate-400">Día límite de pago</span><input className={inputClass} type="number" min="1" max="31" value={card.dueDay} onChange={(e) => setCard({ ...card, dueDay: Number(e.target.value) })} required /></label>
            </div>
            <Button type="submit" disabled={saving} className="mt-3">Guardar tarjeta</Button>
            {cards.length ? <p className="mt-3 text-xs text-slate-500">{cards.map((item) => `${item.name} (corte ${item.cutDay}, pago ${item.dueDay})`).join(" · ")}</p> : null}
          </form>
          <form onSubmit={saveAccount}>
            <h3 className="font-semibold text-slate-100">Nueva cuenta de ahorro</h3>
            <label className="mt-3 block"><span className="text-sm text-slate-400">Solo un nombre reconocible</span><input className={inputClass} value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Ahorro BAC" required /></label>
            <Button type="submit" disabled={saving} className="mt-3">Guardar cuenta</Button>
            {accounts.length ? <p className="mt-3 text-xs text-slate-500">{accounts.map((item) => item.name).join(" · ")}</p> : null}
          </form>
        </div>
      ) : null}
    </section>
  );
}
