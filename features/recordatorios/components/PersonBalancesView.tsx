"use client";

import { useMemo, useState } from "react";
import type { SharedCase } from "@/features/recordatorios/types";
import { getPersonBalances } from "@/features/recordatorios/personBalances";
import { formatMoney } from "@/features/recordatorios/utils";

type Props = {
  cases: SharedCase[];
  onOpenCase: (caseId: string) => void;
};

export function PersonBalancesView({ cases, onOpenCase }: Props) {
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const people = useMemo(() => getPersonBalances(cases), [cases]);
  const visiblePeople = people.filter((person) => person.key.includes(search.trim().toLocaleLowerCase("es")));
  const selected = people.find((person) => person.key === selectedKey) ?? visiblePeople[0] ?? null;

  return (
    <section className="mt-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-100">Saldos por persona</h2>
        <p className="mt-1 text-sm text-slate-400">Personas de casos abiertos, con saldo pendiente o ya pagado. Los nombres iguales se agrupan.</p>
      </div>
      {!people.length ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-400">No hay participantes en casos abiertos.</div>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(220px,300px)_1fr]">
          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4">
            <label className="block text-sm text-slate-300" htmlFor="person-search">Buscar persona</label>
            <input id="person-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setSelectedKey(null); }} placeholder="Nombre" className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 outline-none focus:border-emerald-400" />
            <p className="mt-3 text-xs text-slate-500">{visiblePeople.length} {visiblePeople.length === 1 ? "persona" : "personas"}</p>
            <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto">
              {visiblePeople.map((person) => (
                <button key={person.key} type="button" onClick={() => setSelectedKey(person.key)} className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-3 text-left transition ${selected?.key === person.key ? "border-emerald-500 bg-emerald-500/10" : "border-slate-700 bg-slate-950/50 hover:border-slate-500"}`}>
                  <span className="min-w-0 truncate font-medium text-slate-100">{person.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-amber-200">{formatMoney(person.pending)}</span>
                </button>
              ))}
              {!visiblePeople.length ? <p className="py-4 text-sm text-slate-400">No hay personas con ese nombre.</p> : null}
            </div>
          </div>

          {selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5">
                <h3 className="text-2xl font-semibold text-slate-100">{selected.name}</h3>
                <p className="mt-1 text-sm text-slate-400">{selected.cases.length} {selected.cases.length === 1 ? "caso abierto" : "casos abiertos"}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[["Total asignado", selected.assigned], ["Ya abonado", selected.paid], ["Saldo pendiente", selected.pending], ["Pendiente hasta hoy", selected.dueToday]].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl bg-slate-950/60 p-3"><p className="text-xs text-slate-400">{label}</p><p className="mt-1 text-lg font-semibold text-slate-100">{formatMoney(Number(value))}</p></div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">Pendiente futuro: {formatMoney(Math.max(0, selected.pending - selected.dueToday))}. En compras compartidas se considera la segunda oportunidad; en tasa cero, la fecha de cada cuota.</p>
              </div>
              <div className="space-y-3">
                {selected.cases.map((item) => (
                  <button key={item.caseId} type="button" onClick={() => onOpenCase(item.caseId)} className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 p-4 text-left transition hover:border-emerald-400/70">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{item.caseType === "shared" ? "Compra compartida" : "Tasa cero"}</p><h4 className="mt-1 font-semibold text-slate-100">{item.title}</h4></div><span className="text-sm font-semibold text-amber-200">Debe {formatMoney(item.pending)}</span></div>
                    <p className="mt-3 text-sm text-slate-400">Asignado {formatMoney(item.assigned)} · Abonado {formatMoney(item.paid)} · Hasta hoy {formatMoney(item.dueToday)}</p>
                    <p className="mt-2 text-xs font-semibold text-blue-300">Ver caso →</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
