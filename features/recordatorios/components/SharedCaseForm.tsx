"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type { CreditCard, NewCaseInput } from "@/features/recordatorios/types";
import { localDateValue, nextPayOpportunities } from "@/features/recordatorios/utils";

type Props = {
  cards: CreditCard[];
  saving: boolean;
  onSave: (input: NewCaseInput) => Promise<boolean>;
  onCancel: () => void;
};

const fieldClass = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-emerald-400 sm:text-sm";

export function SharedCaseForm({ cards, saving, onSave, onCancel }: Props) {
  const today = localDateValue();
  const initialDates = nextPayOpportunities(today);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [names, setNames] = useState("Yo\nHermano 1\nHermano 2\nHermano 3\nHermano 4\nHermano 5\nHermano 6");
  const [purchase, setPurchase] = useState({
    description: "", purchaseDate: today, amount: "", cardId: "",
    firstOpportunity: initialDates[0], secondOpportunity: initialDates[1],
  });

  function changePurchaseDate(value: string) {
    const [firstOpportunity, secondOpportunity] = nextPayOpportunities(value);
    setPurchase((current) => ({ ...current, purchaseDate: value, firstOpportunity, secondOpportunity }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const participantNames = names.split("\n").map((name) => name.trim()).filter(Boolean);
    if (participantNames.length < 2) return;
    if (new Set(participantNames.map((name) => name.toLowerCase())).size !== participantNames.length) {
      alert("Los participantes deben tener nombres distintos.");
      return;
    }
    const success = await onSave({
      title, notes, participantNames,
      purchase: {
        description: purchase.description,
        purchaseDate: purchase.purchaseDate,
        amount: Number(purchase.amount),
        cardId: purchase.cardId || null,
        firstOpportunity: purchase.firstOpportunity,
        secondOpportunity: purchase.secondOpportunity,
      },
    });
    if (success) onCancel();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-emerald-500/40 bg-slate-900/95 p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="text-sm font-semibold text-emerald-300">Nuevo caso compartido</p><h2 className="mt-1 text-xl font-semibold text-slate-100">Causa, personas y primera compra</h2></div>
        <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <label className="block"><span className="text-sm text-slate-400">Nombre de la causa</span><input className={fieldClass} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Medicinas de mamá" required /></label>
          <label className="block"><span className="text-sm text-slate-400">Participantes, uno por línea</span><textarea className={fieldClass} rows={8} value={names} onChange={(e) => setNames(e.target.value)} required /><span className="mt-2 block text-xs text-slate-500">La primera línea eres tú. Tu parte se calcula, pero no se cobra.</span></label>
          <label className="block"><span className="text-sm text-slate-400">Notas privadas del caso</span><textarea className={fieldClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        </div>
        <div className="space-y-4 rounded-2xl bg-slate-950/50 p-4">
          <h3 className="font-semibold text-slate-100">Primera compra</h3>
          <label className="block"><span className="text-sm text-slate-400">Descripción</span><input className={fieldClass} value={purchase.description} onChange={(e) => setPurchase({ ...purchase, description: e.target.value })} placeholder="Compra en farmacia" required /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="text-sm text-slate-400">Monto total</span><input className={fieldClass} type="number" min="0.01" step="0.01" value={purchase.amount} onChange={(e) => setPurchase({ ...purchase, amount: e.target.value })} required /></label>
            <label><span className="text-sm text-slate-400">Fecha de compra</span><input className={fieldClass} type="date" value={purchase.purchaseDate} onChange={(e) => changePurchaseDate(e.target.value)} required /></label>
          </div>
          <label className="block"><span className="text-sm text-slate-400">Tarjeta</span><select className={fieldClass} value={purchase.cardId} onChange={(e) => setPurchase({ ...purchase, cardId: e.target.value })}><option value="">Sin asignar</option>{cards.filter((card) => card.active).map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label><span className="text-sm text-slate-400">Primera oportunidad</span><input className={fieldClass} type="date" value={purchase.firstOpportunity} onChange={(e) => setPurchase({ ...purchase, firstOpportunity: e.target.value })} required /></label>
            <label><span className="text-sm text-slate-400">Segunda oportunidad</span><input className={fieldClass} type="date" min={purchase.firstOpportunity} value={purchase.secondOpportunity} onChange={(e) => setPurchase({ ...purchase, secondOpportunity: e.target.value })} required /></label>
          </div>
          <p className="text-xs leading-5 text-slate-500">Ambas fechas son oportunidades para transferir el aporte completo. El monto no se divide entre ellas.</p>
        </div>
      </div>
      <Button type="submit" disabled={saving} className="mt-5 w-full">{saving ? "Guardando..." : "Crear caso compartido"}</Button>
    </form>
  );
}
