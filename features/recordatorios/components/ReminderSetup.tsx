"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { CreditCard, SavingsAccount } from "@/features/recordatorios/types";

type Props = {
  cards: CreditCard[];
  accounts: SavingsAccount[];
  saving: boolean;
  onCreateCard: (input: Omit<CreditCard, "id" | "active">) => Promise<boolean>;
  onUpdateCard: (cardId: string, input: Omit<CreditCard, "id" | "active">) => Promise<boolean>;
  onDeleteCard: (cardId: string) => Promise<boolean>;
  onCreateAccount: (input: Omit<SavingsAccount, "id" | "active">) => Promise<boolean>;
  onUpdateAccount: (accountId: string, input: Omit<SavingsAccount, "id" | "active">) => Promise<boolean>;
  onDeleteAccount: (accountId: string) => Promise<boolean>;
};

const inputClass = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-emerald-400 sm:text-sm";

export function ReminderSetup({ cards, accounts, saving, onCreateCard, onUpdateCard, onDeleteCard, onCreateAccount, onUpdateAccount, onDeleteAccount }: Props) {
  const [open, setOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [card, setCard] = useState({ name: "", bank: "", cutDay: 1, dueDay: 1 });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [account, setAccount] = useState<Omit<SavingsAccount, "id" | "active">>({ name: "", bank: "", accountType: "savings" });

  async function saveCard(event: FormEvent) {
    event.preventDefault();
    if (!card.name.trim()) return;
    const success = editingCardId
      ? await onUpdateCard(editingCardId, card)
      : await onCreateCard(card);
    if (success) {
      setCard({ name: "", bank: "", cutDay: 1, dueDay: 1 });
      setEditingCardId(null);
    }
  }

  function editCard(item: CreditCard) {
    setEditingCardId(item.id);
    setCard({
      name: item.name,
      bank: item.bank,
      cutDay: item.cutDay,
      dueDay: item.dueDay,
    });
  }

  function cancelCardEdit() {
    setEditingCardId(null);
    setCard({ name: "", bank: "", cutDay: 1, dueDay: 1 });
  }

  async function saveAccount(event: FormEvent) {
    event.preventDefault();
    if (!account.name.trim()) return;
    const success = editingAccountId ? await onUpdateAccount(editingAccountId, account) : await onCreateAccount(account);
    if (success) { setAccount({ name: "", bank: "", accountType: "savings" }); setEditingAccountId(null); }
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
            <h3 className="font-semibold text-slate-100">{editingCardId ? "Editar tarjeta" : "Nueva tarjeta"}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label><span className="text-sm text-slate-400">Nombre para distinguirla</span><input className={inputClass} value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="BAC Azul" required /></label>
              <label><span className="text-sm text-slate-400">Banco</span><input className={inputClass} value={card.bank} onChange={(e) => setCard({ ...card, bank: e.target.value })} placeholder="Opcional" /></label>
              <label><span className="text-sm text-slate-400">Día de corte</span><input className={inputClass} type="number" min="1" max="31" value={card.cutDay} onChange={(e) => setCard({ ...card, cutDay: Number(e.target.value) })} required /></label>
              <label><span className="text-sm text-slate-400">Día límite de pago</span><input className={inputClass} type="number" min="1" max="31" value={card.dueDay} onChange={(e) => setCard({ ...card, dueDay: Number(e.target.value) })} required /></label>
            </div>
            <div className="mt-3 flex gap-2"><Button type="submit" disabled={saving}>{editingCardId ? "Guardar cambios" : "Guardar tarjeta"}</Button>{editingCardId ? <Button variant="secondary" onClick={cancelCardEdit}>Cancelar</Button> : null}</div>
            {cards.length ? <div className="mt-4 space-y-2">{cards.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 p-3"><p className="text-xs text-slate-400"><span className="font-semibold text-slate-200">{item.name}</span> · corte {item.cutDay}, pago {item.dueDay}</p><div className="flex gap-1"><Button variant="ghost" className="px-2 py-1" onClick={() => editCard(item)}>Editar</Button><Button variant="danger" className="px-2 py-1" onClick={() => window.confirm("¿Eliminar esta tarjeta? Las compras conservarán su historial, pero quedarán sin tarjeta asignada.") && onDeleteCard(item.id)}>Eliminar</Button></div></div>)}</div> : null}
          </form>
          <form onSubmit={saveAccount}>
            <h3 className="font-semibold text-slate-100">{editingAccountId ? "Editar cuenta" : "Nueva cuenta bancaria"}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2"><label><span className="text-sm text-slate-400">Nombre</span><input className={inputClass} value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} placeholder="Cuenta BAC" required /></label><label><span className="text-sm text-slate-400">Banco</span><input className={inputClass} value={account.bank} onChange={(e) => setAccount({ ...account, bank: e.target.value })} placeholder="Opcional" /></label><label><span className="text-sm text-slate-400">Tipo</span><select className={inputClass} value={account.accountType} onChange={(e) => setAccount({ ...account, accountType: e.target.value as SavingsAccount["accountType"] })}><option value="savings">Ahorro</option><option value="checking">Corriente</option><option value="wallet">Billetera</option><option value="other">Otra</option></select></label></div>
            <div className="mt-3 flex gap-2"><Button type="submit" disabled={saving}>{editingAccountId ? "Guardar cambios" : "Guardar cuenta"}</Button>{editingAccountId ? <Button variant="secondary" onClick={() => { setEditingAccountId(null); setAccount({ name: "", bank: "", accountType: "savings" }); }}>Cancelar</Button> : null}</div>
            {accounts.length ? <div className="mt-4 space-y-2">{accounts.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 p-3"><p className="text-xs text-slate-400"><span className="font-semibold text-slate-200">{item.name}</span>{item.bank ? ` · ${item.bank}` : ""}</p><div className="flex gap-1"><Button variant="ghost" className="px-2 py-1" onClick={() => { setEditingAccountId(item.id); setAccount({ name: item.name, bank: item.bank, accountType: item.accountType }); }}>Editar</Button><Button variant="danger" className="px-2 py-1" onClick={() => window.confirm("¿Eliminar esta cuenta? Los aportes anteriores conservarán su monto, pero quedarán sin cuenta identificada.") && onDeleteAccount(item.id)}>Eliminar</Button></div></div>)}</div> : null}
          </form>
        </div>
      ) : null}
    </section>
  );
}
