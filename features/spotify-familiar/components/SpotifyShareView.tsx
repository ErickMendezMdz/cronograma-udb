"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  currentMonthISO,
  findFirstPaymentMonth,
  formatDate,
  formatMonth,
  getMemberDebt,
  money,
  todayISO,
} from "@/features/spotify-familiar/hooks/useSpotifyFamily";
import type {
  SpotifyMember,
  SpotifyPayment,
} from "@/features/spotify-familiar/types";

type SpotifyShareViewProps = {
  members: SpotifyMember[];
  paymentsByMonth: Map<string, SpotifyPayment>;
  onBack: () => void;
};

type ShareMode = "all" | "person";

const selectClass =
  "mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-green-400";

export function SpotifyShareView({
  members,
  paymentsByMonth,
  onBack,
}: SpotifyShareViewProps) {
  const activeMembers = useMemo(
    () => members.filter((member) => member.active),
    [members]
  );
  const [mode, setMode] = useState<ShareMode>("all");
  const [highlightedId, setHighlightedId] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(
    activeMembers[0]?.id ?? ""
  );

  const rows = useMemo(
    () =>
      activeMembers.map((member) => ({
        member,
        debt: getMemberDebt(member, paymentsByMonth),
        nextMonth: findFirstPaymentMonth(member, paymentsByMonth),
      })),
    [activeMembers, paymentsByMonth]
  );
  const selectedRow =
    rows.find((row) => row.member.id === selectedMemberId) ?? rows[0];
  const totalDebt = rows.reduce((sum, row) => sum + row.debt.total, 0);
  const currentMonth = formatMonth(currentMonthISO());

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 space-y-3 print:hidden">
        <Button variant="secondary" onClick={onBack}>
          Volver a Spotify Familiar
        </Button>

        <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/80 p-3 sm:grid-cols-2">
          <label className="text-sm text-slate-400">
            Qué quieres mostrar
            <select
              className={selectClass}
              value={mode}
              onChange={(event) => setMode(event.target.value as ShareMode)}
            >
              <option value="all">Mostrar a todos</option>
              <option value="person">Solo una persona</option>
            </select>
          </label>

          {mode === "all" ? (
            <label className="text-sm text-slate-400">
              Destacar a alguien
              <select
                className={selectClass}
                value={highlightedId}
                onChange={(event) => setHighlightedId(event.target.value)}
              >
                <option value="">Todos por igual</option>
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-sm text-slate-400">
              Persona
              <select
                className={selectClass}
                value={selectedRow?.member.id ?? ""}
                onChange={(event) => setSelectedMemberId(event.target.value)}
              >
                {activeMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-green-400/40 bg-[#08131f] shadow-xl shadow-black/40">
        <header className="bg-gradient-to-r from-green-500/25 to-emerald-400/10 px-4 py-3">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-green-200">
                Estado de cuenta
              </p>
              <h1 className="mt-1 text-xl font-semibold text-white">
                Spotify Familiar
              </h1>
            </div>
            <p className="shrink-0 text-[10px] text-slate-300">
              {formatDate(todayISO())}
            </p>
          </div>
        </header>

        {activeMembers.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-400">
            No hay personas activas para mostrar.
          </p>
        ) : mode === "all" ? (
          <>
            <div className="grid grid-cols-2 border-y border-slate-700 bg-slate-950/60 text-center">
              <div className="px-2 py-2">
                <p className="text-[10px] text-slate-400">Personas</p>
                <p className="text-sm font-semibold text-white">
                  {activeMembers.length}
                </p>
              </div>
              <div className="border-l border-slate-700 px-2 py-2">
                <p className="text-[10px] text-slate-400">Pendiente total</p>
                <p className="text-sm font-semibold text-amber-200">
                  {money.format(totalDebt)}
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-700 px-3">
              {rows.map(({ member, debt, nextMonth }) => {
                const isUpToDate = debt.total <= 0;
                const highlighted = highlightedId === member.id;

                return (
                  <article
                    key={member.id}
                    className={`-mx-3 px-3 py-2 ${
                      highlighted
                        ? "bg-amber-400/15 ring-1 ring-inset ring-amber-300/50"
                        : ""
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold text-white">
                            {member.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                              isUpToDate
                                ? "bg-emerald-500/20 text-emerald-200"
                                : "bg-amber-400/20 text-amber-100"
                            }`}
                          >
                            {isUpToDate ? "Al día" : "Pendiente"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-[9px] text-slate-400">
                          Cuota {money.format(member.monthlyAmount)} mensual
                        </p>
                      </div>
                      <p
                        className={`shrink-0 text-sm font-semibold ${
                          isUpToDate ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {isUpToDate ? "$0.00" : money.format(debt.total)}
                      </p>
                    </div>
                    <p className="mt-1 text-[9px] text-slate-300">
                      {isUpToDate
                        ? `Al día · Siguiente pago: ${formatMonth(nextMonth)}`
                        : `Debe: ${debt.pendingMonths.map(formatMonth).join(", ")}`}
                    </p>
                  </article>
                );
              })}
            </div>
          </>
        ) : selectedRow ? (
          <div className="px-4 py-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400">Cuenta de</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  {selectedRow.member.name}
                </h2>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  selectedRow.debt.total <= 0
                    ? "bg-emerald-500/20 text-emerald-200"
                    : "bg-amber-400/20 text-amber-100"
                }`}
              >
                {selectedRow.debt.total <= 0 ? "Al día" : "Pendiente"}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-950/60 text-center">
              <div className="px-3 py-3">
                <p className="text-[10px] text-slate-400">Cuota mensual</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {money.format(selectedRow.member.monthlyAmount)}
                </p>
              </div>
              <div className="border-l border-slate-700 px-3 py-3">
                <p className="text-[10px] text-slate-400">Total pendiente</p>
                <p className="mt-1 text-lg font-semibold text-amber-200">
                  {money.format(selectedRow.debt.total)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-3">
              {selectedRow.debt.total <= 0 ? (
                <>
                  <p className="font-semibold text-emerald-200">
                    No tiene pagos pendientes
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Siguiente pago: {formatMonth(selectedRow.nextMonth)}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-slate-400">Meses pendientes</p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {selectedRow.debt.pendingMonths.map(formatMonth).join(", ")}
                  </p>
                </>
              )}
            </div>
          </div>
        ) : null}

        <footer className="border-t border-slate-700 px-4 py-2 text-center text-[9px] text-slate-500">
          Estado calculado hasta {currentMonth}
        </footer>
      </section>

      <p className="mt-3 text-center text-xs text-slate-500 print:hidden">
        Toma la captura desde esta tarjeta.
      </p>
    </div>
  );
}
