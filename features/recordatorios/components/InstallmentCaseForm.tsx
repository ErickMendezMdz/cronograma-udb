"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { CreditCard, NewCaseInput } from "@/features/recordatorios/types";
import { formatMoney, localDateValue, nextPayOpportunities } from "@/features/recordatorios/utils";

type Props = { cards: CreditCard[]; saving: boolean; onSave: (input: NewCaseInput) => Promise<boolean>; onCancel: () => void };
const fieldClass = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-emerald-400 sm:text-sm";

export function InstallmentCaseForm({ cards, saving, onSave, onCancel }: Props) {
  const today = localDateValue();
  const [firstDefault] = nextPayOpportunities(today);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [namesText, setNamesText] = useState("Esposa\nCuñada");
  const [amounts, setAmounts] = useState<Record<number, string>>({});
  const [purchase, setPurchase] = useState({ description: "", purchaseDate: today, amount: "", cardId: "", installmentCount: 12, firstInstallmentDate: firstDefault });
  const names = useMemo(() => namesText.split("\n").map((name) => name.trim()).filter(Boolean), [namesText]);
  const total = Number(purchase.amount) || 0;
  const suggested = names.length ? total / names.length : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!names.length || new Set(names.map((name) => name.toLocaleLowerCase("es"))).size !== names.length) return alert("Agrega participantes con nombres distintos.");
    const participantAmounts = names.map((_, index) => Number(amounts[index] ?? suggested.toFixed(2)));
    if (Math.abs(participantAmounts.reduce((sum, value) => sum + value, 0) - total) > 0.005) return alert("La suma asignada a las personas debe coincidir exactamente con el monto de la compra.");
    const secondDate = nextPayOpportunities(purchase.firstInstallmentDate)[0];
    const success = await onSave({ caseType: "installment", title, notes, participantNames: names, participantAmounts, purchase: { description: purchase.description, purchaseDate: purchase.purchaseDate, amount: total, cardId: purchase.cardId || null, firstOpportunity: purchase.firstInstallmentDate, secondOpportunity: secondDate, installmentCount: purchase.installmentCount, firstInstallmentDate: purchase.firstInstallmentDate } });
    if (success) onCancel();
  }

  return <form onSubmit={submit} className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-emerald-300">Nueva compra financiada</p><h2 className="mt-1 text-xl font-semibold text-slate-100">Compra, cuotas y responsables</h2></div><Button variant="secondary" onClick={onCancel}>Cancelar</Button></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block"><span className="text-sm text-slate-400">Nombre del caso</span><input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Electrodomésticos" required /></label>
        <label className="block"><span className="text-sm text-slate-400">Responsables, uno por línea</span><textarea className={fieldClass} rows={4} value={namesText} onChange={(e) => { setNamesText(e.target.value); setAmounts({}); }} required /><span className="mt-2 block text-xs text-slate-500">Incluye “Yo” solamente si una parte de la compra te corresponde.</span></label>
        <label className="block"><span className="text-sm text-slate-400">Notas privadas</span><textarea className={fieldClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
      </div>
      <div className="space-y-4 rounded-2xl bg-slate-950/50 p-4">
        <label className="block"><span className="text-sm text-slate-400">Descripción</span><input className={fieldClass} value={purchase.description} onChange={(e) => setPurchase({ ...purchase, description: e.target.value })} required /></label>
        <div className="grid gap-3 sm:grid-cols-2"><label><span className="text-sm text-slate-400">Monto total</span><input className={fieldClass} type="number" min="0.01" step="0.01" value={purchase.amount} onChange={(e) => { setPurchase({ ...purchase, amount: e.target.value }); setAmounts({}); }} required /></label><label><span className="text-sm text-slate-400">Fecha de compra</span><input className={fieldClass} type="date" value={purchase.purchaseDate} onChange={(e) => setPurchase({ ...purchase, purchaseDate: e.target.value })} required /></label></div>
        <label className="block"><span className="text-sm text-slate-400">Tarjeta</span><select className={fieldClass} value={purchase.cardId} onChange={(e) => setPurchase({ ...purchase, cardId: e.target.value })} required><option value="">Seleccionar</option>{cards.filter((card) => card.active).map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
        <div className="grid gap-3 sm:grid-cols-2"><label><span className="text-sm text-slate-400">Cantidad de cuotas</span><input className={fieldClass} type="number" min="1" max="120" value={purchase.installmentCount} onChange={(e) => setPurchase({ ...purchase, installmentCount: Number(e.target.value) })} required /></label><label><span className="text-sm text-slate-400">Primera cuota</span><input className={fieldClass} type="date" value={purchase.firstInstallmentDate} onChange={(e) => setPurchase({ ...purchase, firstInstallmentDate: e.target.value })} required /></label></div>
        <div><p className="text-sm text-slate-400">Distribución total</p><div className="mt-2 space-y-2">{names.map((name, index) => <label key={`${name}-${index}`} className="grid grid-cols-[1fr_130px] items-center gap-3 text-sm text-slate-300"><span>{name}</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100" type="number" min="0" step="0.01" value={amounts[index] ?? (suggested ? suggested.toFixed(2) : "")} onChange={(e) => setAmounts({ ...amounts, [index]: e.target.value })} /></label>)}</div><p className="mt-2 text-xs text-slate-500">Cuota total aproximada: {formatMoney(purchase.installmentCount ? total / purchase.installmentCount : 0)}</p></div>
      </div>
    </div>
    <Button type="submit" disabled={saving || !cards.length} className="mt-5 w-full">{saving ? "Guardando..." : "Crear compra a tasa cero"}</Button>
  </form>;
}
