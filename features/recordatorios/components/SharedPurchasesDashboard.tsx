"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ReminderSetup } from "@/features/recordatorios/components/ReminderSetup";
import { SharedCaseDetail } from "@/features/recordatorios/components/SharedCaseDetail";
import { SharedCaseForm } from "@/features/recordatorios/components/SharedCaseForm";
import { useSharedPurchases } from "@/features/recordatorios/hooks/useSharedPurchases";
import { caseTotals, formatDate, formatMoney, getParticipantBalances } from "@/features/recordatorios/utils";

export function SharedPurchasesDashboard() {
  const data = useSharedPurchases();
  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);
  const selected = data.cases.find((item) => item.id === selectedId) ?? null;
  const activeCases = data.cases.filter((item) => item.status === "active");
  const displayedCases = showClosed ? data.cases : activeCases;
  const global = useMemo(() => activeCases.reduce((result, item) => {
    const totals = caseTotals(item);
    const balances = getParticipantBalances(item);
    return {
      pending: result.pending + totals.pending,
      unallocated: result.unallocated + totals.unallocated,
      debtors: result.debtors + balances.filter((balance) => !balance.isOwner && balance.pending > 0).length,
      overdue: result.overdue + balances.filter((balance) => balance.status === "overdue").length,
    };
  }, { pending: 0, unallocated: 0, debtors: 0, overdue: 0 }), [activeCases]);

  if (data.checking) return <div className="flex min-h-[320px] items-center justify-center text-slate-300">Cargando compras compartidas...</div>;
  if (!data.supabase) return <div className="rounded-2xl border border-red-900 bg-red-950/30 p-5 text-red-100">{data.configError ?? "Falta configurar Supabase."}</div>;

  if (selected) {
    return <SharedCaseDetail sharedCase={selected} cards={data.cards} accounts={data.accounts} saving={data.saving} onAddPurchase={data.addPurchase} onPayment={data.createPayment} onAllocation={data.createAllocation} onDeletePayment={data.deletePayment} onDeleteAllocation={data.deleteAllocation} onDeletePurchase={data.deletePurchase} onUpdatePurchaseDescription={data.updatePurchaseDescription} onToggleClosed={data.toggleClosed} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400"><span>{data.email ? `Sesión: ${data.email}` : "Compras compartidas"}</span><Button onClick={data.logout} variant="secondary">Salir</Button></div>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-emerald-300">Control compartido</p><h1 className="mt-1 text-3xl font-semibold text-slate-100">Qué me deben y cuándo pueden pagar</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Cada causa conserva sus participantes. Puedes sumar compras al mismo caso sin perder pagos anteriores.</p></div><Button onClick={() => setCreating(true)}>+ Nuevo caso</Button></div>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[['Total que me deben', formatMoney(global.pending)], ['Personas con saldo', global.debtors], ['Saldos vencidos', global.overdue], ['Recibido sin destinar', formatMoney(global.unallocated)]].map(([label, value]) => <article key={String(label)} className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-semibold text-slate-100">{value}</p></article>)}
      </section>

      <div className="mt-5"><ReminderSetup cards={data.cards} accounts={data.accounts} saving={data.saving} onCreateCard={data.createCard} onUpdateCard={data.updateCard} onCreateAccount={data.createAccount} /></div>
      {creating ? <div className="mt-5"><SharedCaseForm cards={data.cards} saving={data.saving} onSave={data.createCase} onCancel={() => setCreating(false)} /></div> : null}
      {data.error ? <div className="mt-5 rounded-2xl border border-red-900 bg-red-950/30 p-4 text-sm text-red-100">{data.error}</div> : null}
      {data.loading ? <p className="mt-5 text-sm text-slate-400">Actualizando...</p> : null}

      <div className="mt-6 flex items-center justify-between gap-3"><h2 className="text-xl font-semibold text-slate-100">Casos compartidos</h2><button onClick={() => setShowClosed((value) => !value)} className="text-sm font-semibold text-slate-400 hover:text-slate-200">{showClosed ? "Solo activos" : "Incluir cerrados"}</button></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {displayedCases.map((sharedCase) => {
          const totals = caseTotals(sharedCase);
          const balances = getParticipantBalances(sharedCase);
          const pendingPeople = balances.filter((item) => !item.isOwner && item.pending > 0);
          const paidPeople = balances.filter((item) => !item.isOwner && item.pending <= 0);
          const opportunities = pendingPeople.flatMap((item) => [item.firstOpportunity, item.secondOpportunity]).filter((value): value is string => Boolean(value)).sort();
          return <button key={sharedCase.id} onClick={() => setSelectedId(sharedCase.id)} className="rounded-2xl border border-slate-700 bg-slate-900/75 p-5 text-left transition hover:border-emerald-400/70 hover:bg-slate-900"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">{sharedCase.purchases.length} {sharedCase.purchases.length === 1 ? "compra" : "compras"}</p><h3 className="mt-2 text-xl font-semibold text-slate-100">{sharedCase.title}</h3></div>{sharedCase.status === "closed" ? <span className="rounded-full bg-slate-700 px-2 py-1 text-xs text-slate-300">Cerrado</span> : null}</div><div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-950/60 p-3 text-center"><div><p className="text-xs text-slate-500">Acumulado</p><p className="mt-1 text-sm font-semibold text-slate-200">{formatMoney(totals.purchaseTotal)}</p></div><div><p className="text-xs text-slate-500">Recibido</p><p className="mt-1 text-sm font-semibold text-emerald-300">{formatMoney(totals.received)}</p></div><div><p className="text-xs text-slate-500">Pendiente</p><p className="mt-1 text-sm font-semibold text-amber-200">{formatMoney(totals.pending)}</p></div></div><p className="mt-4 text-sm text-slate-300"><span className="text-amber-200">Deben:</span> {pendingPeople.length ? pendingPeople.map((item) => item.name).join(", ") : "nadie"}</p><p className="mt-2 text-sm text-slate-400"><span className="text-emerald-300">Pagaron:</span> {paidPeople.length ? paidPeople.map((item) => item.name).join(", ") : "todavía nadie"}</p><p className="mt-3 text-xs text-slate-500">Próxima oportunidad: {formatDate(opportunities[0] ?? null)}</p></button>;
        })}
      </div>
      {!displayedCases.length && !data.loading ? <div className="mt-4 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">Todavía no hay casos compartidos. Configura tu tarjeta y registra la primera compra.</div> : null}
    </div>
  );
}
