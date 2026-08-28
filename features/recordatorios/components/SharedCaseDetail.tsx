"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import type {
  CreditCard,
  NewAllocationInput,
  NewPaymentInput,
  NewPurchaseInput,
  SavingsAccount,
  SharedCase,
} from "@/features/recordatorios/types";
import {
  caseTotals,
  formatDate,
  formatMoney,
  getParticipantBalances,
  estimatedCardDates,
  localDateValue,
  nextPayOpportunities,
} from "@/features/recordatorios/utils";

type Props = {
  sharedCase: SharedCase;
  cards: CreditCard[];
  accounts: SavingsAccount[];
  saving: boolean;
  onAddPurchase: (sharedCase: SharedCase, input: NewPurchaseInput) => Promise<boolean>;
  onPayment: (input: NewPaymentInput) => Promise<boolean>;
  onAllocation: (input: NewAllocationInput) => Promise<boolean>;
  onDeletePayment: (paymentId: string) => Promise<boolean>;
  onDeleteAllocation: (allocationId: string) => Promise<boolean>;
  onDeletePurchase: (purchaseId: string) => Promise<boolean>;
  onUpdatePurchaseDescription: (purchaseId: string, description: string) => Promise<boolean>;
  onToggleClosed: (sharedCase: SharedCase) => Promise<boolean>;
  onBack: () => void;
};

const inputClass = "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-base text-slate-100 outline-none focus:border-emerald-400 sm:text-sm";
const statusLabel = { own: "Parte propia", pending: "Pendiente", partial: "Parcial", paid: "Pagado", overdue: "Vencido" };
const statusClass = { own: "bg-blue-500/15 text-blue-200", pending: "bg-slate-700 text-slate-200", partial: "bg-amber-500/15 text-amber-200", paid: "bg-emerald-500/15 text-emerald-200", overdue: "bg-red-500/15 text-red-200" };

function formatCompactDate(value: string | null) {
  if (!value) return "—";
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-SV", {
    day: "numeric",
    month: "short",
  });
}

export function SharedCaseDetail(props: Props) {
  const { sharedCase, cards, accounts, saving } = props;
  const balances = useMemo(() => getParticipantBalances(sharedCase), [sharedCase]);
  const totals = useMemo(() => caseTotals(sharedCase), [sharedCase]);
  const [panel, setPanel] = useState<"none" | "purchase" | "payment" | "allocation">("none");
  const [shareMode, setShareMode] = useState(false);
  const [highlighted, setHighlighted] = useState("");
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [purchaseDescription, setPurchaseDescription] = useState("");
  const today = localDateValue();
  const dates = nextPayOpportunities(today);
  const [purchase, setPurchase] = useState({ description: "", amount: "", purchaseDate: today, cardId: "", firstOpportunity: dates[0], secondOpportunity: dates[1] });
  const [payment, setPayment] = useState({ participantId: "", amount: "", paidAt: today, method: "Transferencia", notes: "" });
  const [allocation, setAllocation] = useState({ paymentId: "", amount: "", allocatedAt: today, destinationType: "card" as NewAllocationInput["destinationType"], cardId: "", accountId: "", notes: "" });

  function changePurchaseDate(value: string) {
    const [firstOpportunity, secondOpportunity] = nextPayOpportunities(value);
    setPurchase({ ...purchase, purchaseDate: value, firstOpportunity, secondOpportunity });
  }

  async function submitPurchase(event: FormEvent) {
    event.preventDefault();
    const success = await props.onAddPurchase(sharedCase, { ...purchase, amount: Number(purchase.amount), cardId: purchase.cardId || null });
    if (success) {
      const nextDates = nextPayOpportunities(today);
      setPurchase({ description: "", amount: "", purchaseDate: today, cardId: "", firstOpportunity: nextDates[0], secondOpportunity: nextDates[1] });
      setPanel("none");
    }
  }

  async function submitPayment(event: FormEvent) {
    event.preventDefault();
    const pending = balances.find((item) => item.id === payment.participantId)?.pending ?? 0;
    if (Number(payment.amount) > pending + 0.005 && !window.confirm("El pago supera el saldo pendiente de esta persona. ¿Registrarlo de todas formas?")) return;
    const success = await props.onPayment({ caseId: sharedCase.id, participantId: payment.participantId, amount: Number(payment.amount), paidAt: payment.paidAt, method: payment.method, notes: payment.notes });
    if (success) {
      setPayment({ participantId: "", amount: "", paidAt: today, method: "Transferencia", notes: "" });
      setPanel("none");
    }
  }

  async function submitAllocation(event: FormEvent) {
    event.preventDefault();
    const sourcePayment = sharedCase.payments.find((item) => item.id === allocation.paymentId);
    const alreadyAllocated = sharedCase.allocations.filter((item) => item.paymentId === allocation.paymentId).reduce((sum, item) => sum + item.amount, 0);
    const sourceAvailable = Math.max(0, (sourcePayment?.amount ?? 0) - alreadyAllocated);
    if (Number(allocation.amount) > sourceAvailable + 0.005) {
      alert("No puedes destinar más de lo que queda disponible en ese abono.");
      return;
    }
    if (allocation.destinationType === "card" && !allocation.cardId) return alert("Selecciona una tarjeta.");
    if (allocation.destinationType === "savings" && !allocation.accountId) return alert("Selecciona una cuenta.");
    const success = await props.onAllocation({ caseId: sharedCase.id, paymentId: allocation.paymentId, amount: Number(allocation.amount), allocatedAt: allocation.allocatedAt, destinationType: allocation.destinationType, cardId: allocation.cardId || null, accountId: allocation.accountId || null, notes: allocation.notes });
    if (success) {
      setAllocation({ paymentId: "", amount: "", allocatedAt: today, destinationType: "card", cardId: "", accountId: "", notes: "" });
      setPanel("none");
    }
  }

  async function deletePayment(paymentId: string) {
    const linkedDestinations = sharedCase.allocations.filter(
      (item) => item.paymentId === paymentId
    ).length;
    const detail = linkedDestinations
      ? ` También se eliminarán ${linkedDestinations} ${linkedDestinations === 1 ? "destino vinculado" : "destinos vinculados"}.`
      : "";
    if (!window.confirm(`¿Eliminar esta transferencia? El saldo de la persona se recalculará.${detail}`)) return;
    await props.onDeletePayment(paymentId);
  }

  async function deleteAllocation(allocationId: string) {
    if (!window.confirm("¿Eliminar este destino? El dinero volverá a aparecer como recibido sin destinar.")) return;
    await props.onDeleteAllocation(allocationId);
  }

  async function deletePurchase(purchaseId: string) {
    if (!window.confirm("¿Eliminar esta compra? Se recalculará lo asignado y lo pendiente de todas las personas.")) return;
    await props.onDeletePurchase(purchaseId);
  }

  async function savePurchaseDescription(purchaseId: string) {
    if (!purchaseDescription.trim()) return;
    if (await props.onUpdatePurchaseDescription(purchaseId, purchaseDescription)) {
      setEditingPurchaseId(null);
      setPurchaseDescription("");
    }
  }

  if (shareMode) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="mb-3 flex flex-wrap items-center gap-2 print:hidden">
          <Button variant="secondary" onClick={() => setShareMode(false)}>Volver al caso</Button>
          <label className="flex-1 text-sm text-slate-400">Destacar a alguien<select className={inputClass} value={highlighted} onChange={(e) => setHighlighted(e.target.value)}><option value="">Todos por igual</option>{balances.filter((item) => !item.isOwner).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        </div>
        <section className="overflow-hidden rounded-2xl border border-emerald-300/40 bg-[#08131f] shadow-xl shadow-black/40">
          <div className="bg-gradient-to-r from-emerald-500/25 to-blue-500/20 px-4 py-3">
            <div className="flex items-end justify-between gap-3">
              <h1 className="text-xl font-semibold text-white">{sharedCase.title}</h1>
              <p className="shrink-0 text-[10px] text-slate-300">{formatDate(today)} · {sharedCase.purchases.length} {sharedCase.purchases.length === 1 ? "compra" : "compras"}</p>
            </div>
          </div>
          <div className="border-t border-emerald-300/20 bg-emerald-400/10 px-3 py-2">
            <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-200">Detalle de la deuda</p>
            <div className="space-y-1">
              {sharedCase.purchases.map((item) => {
                const card = cards.find((entry) => entry.id === item.cardId);
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0"><p className="truncate text-xs font-semibold text-white">{card?.name ?? "Tarjeta sin asignar"}</p><p className="truncate text-[9px] text-slate-300">{item.description} · {formatDate(item.purchaseDate)}</p></div>
                    <p className="shrink-0 text-sm font-semibold text-white">{formatMoney(item.amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 border-y border-slate-700 bg-slate-950/60 text-center">
            <div className="px-2 py-2"><p className="text-[10px] text-slate-400">Monto deuda</p><p className="text-sm font-semibold text-white">{formatMoney(totals.purchaseTotal)}</p></div>
            <div className="border-x border-slate-700 px-2 py-2"><p className="text-[10px] text-slate-400">Recibido</p><p className="text-sm font-semibold text-emerald-300">{formatMoney(totals.received)}</p></div>
            <div className="px-2 py-2"><p className="text-[10px] text-slate-400">Pendiente</p><p className="text-sm font-semibold text-amber-200">{formatMoney(totals.pending)}</p></div>
          </div>
          <div className="divide-y divide-slate-700 px-3">
            {balances.map((balance) => (
              <article key={balance.id} className={`-mx-3 px-3 py-1.5 transition ${highlighted === balance.id ? "bg-amber-400/15 ring-1 ring-inset ring-amber-300/50" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-semibold text-white">{balance.name}</p><span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${statusClass[balance.status]}`}>{statusLabel[balance.status]}</span></div></div>
                  <p className="shrink-0 text-right text-xs font-semibold text-white">{formatMoney(balance.assigned)}</p>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-[9px]"><p className="text-slate-400">Pagó {formatMoney(balance.paid)} · Debe {formatMoney(balance.pending)}</p>{!balance.isOwner && balance.pending > 0 ? <p className="shrink-0 text-slate-300">{balance.status === "overdue" ? `Venció ${formatCompactDate(balance.firstOpportunity)}` : `Puede pagar ${formatCompactDate(balance.firstOpportunity)}${balance.secondOpportunity ? ` o ${formatCompactDate(balance.secondOpportunity)}` : ""}`}</p> : null}</div>
              </article>
            ))}
          </div>
        </section>
        <p className="mt-3 text-center text-xs text-slate-500 print:hidden">Esta vista oculta tarjetas, cuentas y el destino privado del dinero. Toma la captura desde aquí.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><button onClick={props.onBack} className="text-sm font-semibold text-blue-300 hover:text-blue-200">← Todos los casos</button><h1 className="mt-2 text-3xl font-semibold text-slate-100">{sharedCase.title}</h1><p className="mt-1 text-sm text-slate-400">{sharedCase.purchases.length} compras · {sharedCase.participants.length} participantes · {sharedCase.status === "closed" ? "Cerrado" : "Activo"}</p></div>
        <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setShareMode(true)}>Vista para captura</Button><Button variant="ghost" onClick={() => props.onToggleClosed(sharedCase)} disabled={saving}>{sharedCase.status === "active" ? "Cerrar caso" : "Reabrir caso"}</Button></div>
      </div>

      <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[['Compras', totals.purchaseTotal], ['Por cobrar', totals.collectable], ['Recibido', totals.received], ['Me deben', totals.pending], ['Sin destinar', totals.unallocated]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-100">{formatMoney(Number(value))}</p></article>)}
      </section>

      <div className="mt-5 flex flex-wrap gap-2">
        <Button onClick={() => setPanel(panel === "purchase" ? "none" : "purchase")}>+ Agregar compra</Button>
        <Button variant="secondary" onClick={() => setPanel(panel === "payment" ? "none" : "payment")}>Registrar transferencia</Button>
        <Button variant="secondary" onClick={() => setPanel(panel === "allocation" ? "none" : "allocation")}>Destinar dinero</Button>
      </div>

      {panel === "purchase" ? <form onSubmit={submitPurchase} className="mt-4 rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-4"><h2 className="font-semibold text-slate-100">Agregar compra al mismo caso</h2><p className="mt-1 text-xs text-slate-500">Se dividirá entre los mismos participantes y actualizará sus saldos.</p><div className="mt-4 grid gap-3 md:grid-cols-3"><label><span className="text-sm text-slate-400">Descripción</span><input className={inputClass} value={purchase.description} onChange={(e) => setPurchase({ ...purchase, description: e.target.value })} required /></label><label><span className="text-sm text-slate-400">Monto</span><input className={inputClass} type="number" min="0.01" step="0.01" value={purchase.amount} onChange={(e) => setPurchase({ ...purchase, amount: e.target.value })} required /></label><label><span className="text-sm text-slate-400">Fecha</span><input className={inputClass} type="date" value={purchase.purchaseDate} onChange={(e) => changePurchaseDate(e.target.value)} required /></label><label><span className="text-sm text-slate-400">Tarjeta</span><select className={inputClass} value={purchase.cardId} onChange={(e) => setPurchase({ ...purchase, cardId: e.target.value })}><option value="">Sin asignar</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label><label><span className="text-sm text-slate-400">Primera oportunidad</span><input className={inputClass} type="date" value={purchase.firstOpportunity} onChange={(e) => setPurchase({ ...purchase, firstOpportunity: e.target.value })} required /></label><label><span className="text-sm text-slate-400">Segunda oportunidad</span><input className={inputClass} type="date" min={purchase.firstOpportunity} value={purchase.secondOpportunity} onChange={(e) => setPurchase({ ...purchase, secondOpportunity: e.target.value })} required /></label></div><Button type="submit" disabled={saving} className="mt-4">Guardar compra</Button></form> : null}

      {panel === "payment" ? <form onSubmit={submitPayment} className="mt-4 rounded-2xl border border-blue-500/30 bg-slate-900/80 p-4"><h2 className="font-semibold text-slate-100">Registrar transferencia recibida</h2><div className="mt-4 grid gap-3 md:grid-cols-3"><label><span className="text-sm text-slate-400">Persona</span><select className={inputClass} value={payment.participantId} onChange={(e) => { const balance = balances.find((item) => item.id === e.target.value); setPayment({ ...payment, participantId: e.target.value, amount: balance?.pending ? String(balance.pending.toFixed(2)) : "" }); }} required><option value="">Seleccionar</option>{balances.filter((item) => !item.isOwner).map((item) => <option key={item.id} value={item.id}>{item.name} · debe {formatMoney(item.pending)}</option>)}</select></label><label><span className="text-sm text-slate-400">Monto recibido</span><input className={inputClass} type="number" min="0.01" step="0.01" value={payment.amount} onChange={(e) => setPayment({ ...payment, amount: e.target.value })} required /></label><label><span className="text-sm text-slate-400">Fecha</span><input className={inputClass} type="date" value={payment.paidAt} onChange={(e) => setPayment({ ...payment, paidAt: e.target.value })} required /></label><label><span className="text-sm text-slate-400">Medio</span><input className={inputClass} value={payment.method} onChange={(e) => setPayment({ ...payment, method: e.target.value })} /></label><label className="md:col-span-2"><span className="text-sm text-slate-400">Nota o referencia</span><input className={inputClass} value={payment.notes} onChange={(e) => setPayment({ ...payment, notes: e.target.value })} /></label></div><Button type="submit" disabled={saving} className="mt-4">Registrar pago</Button></form> : null}

      {panel === "allocation" ? <form onSubmit={submitAllocation} className="mt-4 rounded-2xl border border-amber-500/30 bg-slate-900/80 p-4"><h2 className="font-semibold text-slate-100">¿Qué hiciste con el dinero?</h2><p className="mt-1 text-xs text-slate-500">Disponible sin destinar: {formatMoney(totals.unallocated)}</p><div className="mt-4 grid gap-3 md:grid-cols-3"><label><span className="text-sm text-slate-400">Abono recibido</span><select className={inputClass} value={allocation.paymentId} onChange={(e) => { const source = sharedCase.payments.find((item) => item.id === e.target.value); const used = sharedCase.allocations.filter((item) => item.paymentId === e.target.value).reduce((sum, item) => sum + item.amount, 0); setAllocation({ ...allocation, paymentId: e.target.value, amount: source ? String(Math.max(0, source.amount - used).toFixed(2)) : "" }); }} required><option value="">Seleccionar</option>{sharedCase.payments.map((item) => { const person = balances.find((balance) => balance.id === item.participantId); const used = sharedCase.allocations.filter((entry) => entry.paymentId === item.id).reduce((sum, entry) => sum + entry.amount, 0); const available = Math.max(0, item.amount - used); return <option key={item.id} value={item.id} disabled={available <= 0}>{person?.name} · {formatDate(item.paidAt)} · disponible {formatMoney(available)}</option>; })}</select></label><label><span className="text-sm text-slate-400">Monto</span><input className={inputClass} type="number" min="0.01" step="0.01" value={allocation.amount} onChange={(e) => setAllocation({ ...allocation, amount: e.target.value })} required /></label><label><span className="text-sm text-slate-400">Destino</span><select className={inputClass} value={allocation.destinationType} onChange={(e) => setAllocation({ ...allocation, destinationType: e.target.value as NewAllocationInput["destinationType"] })}><option value="card">Abono a tarjeta</option><option value="savings">Guardado en cuenta</option><option value="other">Otro</option></select></label><label><span className="text-sm text-slate-400">Fecha</span><input className={inputClass} type="date" value={allocation.allocatedAt} onChange={(e) => setAllocation({ ...allocation, allocatedAt: e.target.value })} required /></label>{allocation.destinationType === "card" ? <label><span className="text-sm text-slate-400">Tarjeta</span><select className={inputClass} value={allocation.cardId} onChange={(e) => setAllocation({ ...allocation, cardId: e.target.value })} required><option value="">Seleccionar</option>{cards.map((card) => <option key={card.id} value={card.id}>{card.name}</option>)}</select></label> : null}{allocation.destinationType === "savings" ? <label><span className="text-sm text-slate-400">Cuenta</span><select className={inputClass} value={allocation.accountId} onChange={(e) => setAllocation({ ...allocation, accountId: e.target.value })} required><option value="">Seleccionar</option>{accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label> : null}<label className="md:col-span-2"><span className="text-sm text-slate-400">Nota</span><input className={inputClass} value={allocation.notes} onChange={(e) => setAllocation({ ...allocation, notes: e.target.value })} /></label></div><Button type="submit" disabled={saving || totals.unallocated <= 0} className="mt-4">Guardar destino</Button></form> : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/70"><div className="border-b border-slate-700 p-4"><h2 className="font-semibold text-slate-100">Quién debe y quién pagó</h2><p className="mt-1 text-sm text-slate-400">El aporte se paga completo en cualquiera de las dos oportunidades.</p></div><div className="divide-y divide-slate-700">{balances.map((balance) => <article key={balance.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(90px,0.7fr))_minmax(180px,1fr)] md:items-center"><div><p className="font-semibold text-slate-100">{balance.name}</p><span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusClass[balance.status]}`}>{statusLabel[balance.status]}</span></div><div><p className="text-xs text-slate-500">Asignado</p><p className="text-sm text-slate-200">{formatMoney(balance.assigned)}</p></div><div><p className="text-xs text-slate-500">Pagado</p><p className="text-sm text-emerald-300">{formatMoney(balance.paid)}</p></div><div><p className="text-xs text-slate-500">Debe</p><p className="text-sm font-semibold text-amber-200">{formatMoney(balance.pending)}</p></div><div><p className="text-xs text-slate-500">Oportunidades</p><p className="text-sm text-slate-300">{balance.isOwner || balance.pending <= 0 ? "—" : balance.status === "overdue" ? `Venció ${formatDate(balance.firstOpportunity)}` : `${formatDate(balance.firstOpportunity)}${balance.secondOpportunity ? ` o ${formatDate(balance.secondOpportunity)}` : ""}`}</p></div></article>)}</div></section>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <h2 className="font-semibold text-slate-100">Compras del caso</h2>
          <div className="mt-3 space-y-3">
            {sharedCase.purchases.length ? sharedCase.purchases.map((item) => {
              const card = cards.find((entry) => entry.id === item.cardId);
              const cardDates = estimatedCardDates(item.purchaseDate, card);
              return (
                <article key={item.id} className="rounded-xl bg-slate-950/60 p-3">
                  <div className="flex justify-between gap-3"><div><p className="font-medium text-slate-100">{item.description}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.purchaseDate)} · {card?.name ?? "Sin tarjeta"}</p></div><p className="font-semibold text-slate-100">{formatMoney(item.amount)}</p></div>
                  {editingPurchaseId === item.id ? <div className="mt-3"><label><span className="text-xs text-slate-400">Descripción de la deuda</span><input className={inputClass} value={purchaseDescription} onChange={(event) => setPurchaseDescription(event.target.value)} /></label><div className="mt-2 flex gap-2"><Button disabled={saving || !purchaseDescription.trim()} onClick={() => savePurchaseDescription(item.id)}>Guardar</Button><Button variant="secondary" onClick={() => setEditingPurchaseId(null)}>Cancelar</Button></div></div> : null}
                  <p className="mt-2 text-xs text-slate-400">Oportunidades: {formatDate(item.firstOpportunity)} o {formatDate(item.secondOpportunity)}</p>
                  {cardDates ? <p className="mt-1 text-xs text-blue-300">Corte estimado: {formatDate(cardDates.cutDate)} · Pago de tarjeta: {formatDate(cardDates.dueDate)}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-2"><Button variant="secondary" className="px-3 py-1.5" disabled={saving} onClick={() => { setEditingPurchaseId(item.id); setPurchaseDescription(item.description); }}>Editar descripción</Button><Button variant="danger" className="px-3 py-1.5" disabled={saving} onClick={() => deletePurchase(item.id)}>Eliminar compra</Button></div>
                </article>
              );
            }) : <p className="text-sm text-slate-500">Este caso ya no tiene compras.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <h2 className="font-semibold text-slate-100">Transferencias recibidas</h2>
          <div className="mt-3 space-y-3">
            {sharedCase.payments.length ? sharedCase.payments.map((item) => {
              const person = balances.find((balance) => balance.id === item.participantId);
              const linkedCount = sharedCase.allocations.filter((allocationItem) => allocationItem.paymentId === item.id).length;
              return (
                <article key={item.id} className="rounded-xl bg-slate-950/60 p-3">
                  <div className="flex justify-between gap-3"><div><p className="text-sm font-medium text-slate-100">{person?.name ?? "Persona eliminada"}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.paidAt)} · {item.method}</p></div><p className="font-semibold text-emerald-300">{formatMoney(item.amount)}</p></div>
                  {item.notes ? <p className="mt-2 text-xs text-slate-400">{item.notes}</p> : null}
                  {linkedCount ? <p className="mt-2 text-xs text-amber-200">{linkedCount} {linkedCount === 1 ? "destino vinculado" : "destinos vinculados"}</p> : null}
                  <Button variant="danger" className="mt-3 px-3 py-1.5" disabled={saving} onClick={() => deletePayment(item.id)}>Eliminar transferencia</Button>
                </article>
              );
            }) : <p className="text-sm text-slate-500">Todavía no hay transferencias registradas.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
          <h2 className="font-semibold text-slate-100">Destino del dinero recibido</h2>
          <div className="mt-3 space-y-3">
            {sharedCase.allocations.length ? sharedCase.allocations.map((item) => {
              const destination = item.destinationType === "card" ? cards.find((card) => card.id === item.cardId)?.name : item.destinationType === "savings" ? accounts.find((account) => account.id === item.accountId)?.name : "Otro";
              const sourcePayment = sharedCase.payments.find((paymentItem) => paymentItem.id === item.paymentId);
              const sourcePerson = balances.find((balance) => balance.id === sourcePayment?.participantId);
              return (
                <article key={item.id} className="rounded-xl bg-slate-950/60 p-3">
                  <div className="flex justify-between gap-3"><div><p className="text-sm text-slate-200">{destination ?? "Destino eliminado"}</p><p className="mt-1 text-xs text-slate-500">{formatDate(item.allocatedAt)} · abono de {sourcePerson?.name ?? "persona eliminada"}{item.notes ? ` · ${item.notes}` : ""}</p></div><p className="font-semibold text-slate-100">{formatMoney(item.amount)}</p></div>
                  <Button variant="danger" className="mt-3 px-3 py-1.5" disabled={saving} onClick={() => deleteAllocation(item.id)}>Eliminar destino</Button>
                </article>
              );
            }) : <p className="text-sm text-slate-500">Todavía no has destinado dinero recibido.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
