"use client";

import { useEffect, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { usePrettySalonSettlement } from "@/features/pretty-salon/hooks/usePrettySalonSettlement";
import type { SettlementActionKind } from "@/features/pretty-salon/settlement-types";
import type { SectionId } from "@/features/pretty-salon/types";
import {
  accountingDateFor,
  clearSettlementReview,
  roundMoney,
} from "@/features/pretty-salon/settlement-utils";
import { formatDate, formatMonth, money } from "@/features/pretty-salon/utils";

type PrettySettlementSectionProps = {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  selectedMonth: string;
  paymentBreakdown: Array<{ method: string; balance: number }>;
  pendingCardTotal: number;
  loanedBalance: number;
  onReload: () => Promise<boolean>;
  onMonthChange: (month: string) => void;
  onNavigate: (section: SectionId) => void;
};

type CorrectionType = "income" | "expense" | "loan_borrow" | "loan_repay";

const inputClass =
  "mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8]";
const secondaryButton =
  "rounded-lg border border-[#454b55] px-4 py-3 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "rounded-lg bg-[#00c2a8] px-4 py-3 text-sm font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-50";
const dangerButton =
  "rounded-lg border border-[#ff5f7e] px-4 py-3 text-sm font-semibold text-[#ff8aa1] transition hover:bg-[#321820] disabled:cursor-not-allowed disabled:opacity-50";

function amount(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? roundMoney(parsed) : 0;
}

function DifferenceCard({ label, app, real }: { label: string; app: number; real: string }) {
  const hasReal = real.trim() !== "" && Number.isFinite(Number(real));
  const difference = hasReal ? roundMoney(Number(real) - app) : null;
  const balanced = difference !== null && Math.abs(difference) <= 0.01;

  return (
    <article className="rounded-lg border border-[#30333a] bg-[#101113] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-[#f7f9fb]">{label}</p>
        {difference !== null ? (
          <span className={balanced ? "text-sm font-semibold text-[#71f2d8]" : "text-sm font-semibold text-[#ffe06b]"}>
            {balanced ? "Cuadrado" : `${difference > 0 ? "+" : ""}${money.format(difference)}`}
          </span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-[#aeb5bf]">Segun la app</p>
      <p className="mt-1 text-2xl font-semibold text-[#f7f9fb]">{money.format(app)}</p>
    </article>
  );
}

function AvailableBalances({ cash, bank }: { cash: number; bank: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-[#276357] bg-[#0f312e] p-4"><p className="text-xs text-[#aeb5bf]">Efectivo disponible</p><p className="mt-1 text-xl font-semibold text-[#71f2d8]">{money.format(cash)}</p></div>
      <div className="rounded-lg border border-[#276357] bg-[#0f312e] p-4"><p className="text-xs text-[#aeb5bf]">Banco disponible</p><p className="mt-1 text-xl font-semibold text-[#71f2d8]">{money.format(bank)}</p></div>
    </div>
  );
}

export function PrettySettlementSection(props: PrettySettlementSectionProps) {
  const settlement = usePrettySalonSettlement({
    supabase: props.supabase,
    userId: props.userId,
    email: props.email,
    selectedMonth: props.selectedMonth,
    balances: props.paymentBreakdown,
    pendingCardTotal: props.pendingCardTotal,
    loanedBalance: props.loanedBalance,
    onReload: props.onReload,
  });
  const [correctionType, setCorrectionType] = useState<CorrectionType>("income");
  const [correctionAmount, setCorrectionAmount] = useState("");
  const [correctionMethod, setCorrectionMethod] = useState("Efectivo");
  const [correctionConcept, setCorrectionConcept] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingStart, setPendingStart] = useState(false);
  const [repaymentMode, setRepaymentMode] = useState<"salary" | "returned">("salary");
  const [repaymentMethod, setRepaymentMethod] = useState<"Efectivo" | "Cuenta Banco">("Efectivo");
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentBusy, setRepaymentBusy] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const previousStep = useRef<number | null | undefined>(undefined);

  const active = settlement.active;
  const draft = active?.draft;

  useEffect(() => {
    if (settlement.loading) return;
    const step = draft?.step ?? null;
    if (previousStep.current === step) return;
    previousStep.current = step;
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        (step === null ? sectionRef.current : stepRef.current)?.scrollIntoView({ block: "start" });
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [draft?.step, settlement.loading]);

  useEffect(() => {
    if (active && active.periodMonth !== props.selectedMonth) {
      props.onMonthChange(active.periodMonth);
    }
  }, [active, props]);
  useEffect(() => {
    clearSettlementReview(props.userId);
  }, [props.userId]);
  const initialCashDiff = draft?.realCashInitial === "" ? null : roundMoney(Number(draft?.realCashInitial) - settlement.cashBalance);
  const initialBankDiff = draft?.realBankInitial === "" ? null : roundMoney(Number(draft?.realBankInitial) - settlement.bankBalance);
  const initialBalanced = initialCashDiff !== null && initialBankDiff !== null && Math.abs(initialCashDiff) <= 0.01 && Math.abs(initialBankDiff) <= 0.01;
  const finalCashDiff = draft?.realCashFinal === "" ? null : roundMoney(Number(draft?.realCashFinal) - settlement.cashBalance);
  const finalBankDiff = draft?.realBankFinal === "" ? null : roundMoney(Number(draft?.realBankFinal) - settlement.bankBalance);
  const finalBalanced = finalCashDiff !== null && finalBankDiff !== null && Math.abs(finalCashDiff) <= 0.01 && Math.abs(finalBankDiff) <= 0.01;
  const transferableAmount = initialCashDiff !== null && initialBankDiff !== null && initialCashDiff * initialBankDiff < 0
    ? Math.min(Math.abs(initialCashDiff), Math.abs(initialBankDiff))
    : 0;
  const physicalTransferFrom = (initialCashDiff ?? 0) > 0 ? "Efectivo" : "Cuenta Banco";
  const physicalTransferTo = physicalTransferFrom === "Efectivo" ? "Cuenta Banco" : "Efectivo";
  const paidSalary = draft?.actions.filter((item) => item.kind === "salary_expense" || item.kind === "salary_discount_expense").reduce((total, item) => total + item.amount, 0) ?? 0;
  const salaryDiscount = draft?.actions.filter((item) => item.kind === "salary_discount_expense").reduce((total, item) => total + item.amount, 0) ?? 0;
  const salaryRemaining = Math.max(roundMoney(300 - paidSalary), 0);
  const salaryMethodBalance = draft?.salaryPaymentMethod === "Cuenta Banco" ? settlement.bankBalance : settlement.cashBalance;
  const maxSalaryPayment = Math.min(salaryRemaining, Math.max(salaryMethodBalance, 0));
  const pendingDiscount = roundMoney((draft?.actions.filter((item) => item.kind === "salary_discount_repay").reduce((total, item) => total + item.amount, 0) ?? 0) - salaryDiscount);
  const repaymentSuggested = repaymentMode === "salary" ? Math.min(Math.max(props.loanedBalance, 0), salaryRemaining) : Math.max(props.loanedBalance, 0);
  const repaymentValue = amount(repaymentAmount || repaymentSuggested.toFixed(2));
  const suggestedCorrectionAmount = Math.abs(correctionMethod === "Efectivo" ? initialCashDiff ?? 0 : initialBankDiff ?? 0).toFixed(2);

  async function runCorrection() {
    const value = amount(correctionAmount || suggestedCorrectionAmount);
    if (value <= 0) {
      setLocalError("Escribe un monto mayor que cero.");
      return;
    }
    setLocalError(null);
    let ok = false;
    if (correctionType === "loan_borrow" || correctionType === "loan_repay") {
      ok = await settlement.addLoanMovement(
        correctionType === "loan_borrow" ? "borrow" : "repay",
        value,
        correctionMethod
      );
    } else {
      const isIncome = correctionType === "income";
      const isAdjustment = !correctionConcept.trim();
      const actionKind: SettlementActionKind = isIncome
        ? isAdjustment ? "adjustment_income" : "missing_income"
        : isAdjustment ? "adjustment_expense" : "missing_expense";
      ok = await settlement.addTransaction({
        kind: isIncome ? "income" : "expense",
        actionKind,
        concept: correctionConcept.trim() || (isIncome ? "Ingreso de cuadre" : "Gasto de cuadre"),
        category: isIncome ? "Otros ingresos" : "Otros gastos",
        amount: value,
        paymentMethod: correctionMethod,
      });
    }
    if (ok) {
      setCorrectionAmount("");
      setCorrectionConcept("");
    }
  }

  async function confirmPhysicalTransfer() {
    if (!draft || transferableAmount <= 0) return;
    const cash = Number(draft.realCashInitial);
    const bank = Number(draft.realBankInitial);
    const nextCash = roundMoney(cash + (physicalTransferFrom === "Efectivo" ? -transferableAmount : transferableAmount)).toFixed(2);
    const nextBank = roundMoney(bank + (physicalTransferFrom === "Cuenta Banco" ? -transferableAmount : transferableAmount)).toFixed(2);
    await settlement.recordPhysicalTransfer(
      physicalTransferFrom,
      physicalTransferTo,
      transferableAmount,
      nextCash,
      nextBank
    );
  }

  async function confirmDeleteSettlement(item: NonNullable<typeof active>) {
    const actionCount = item.draft.actions.length;
    const detail = actionCount > 0
      ? `Tambien se revertiran los movimientos creados por el asistente o durante su revision de ingresos y gastos. El historial contiene ${actionCount} accion(es).`
      : "Este cuadre todavia no ha creado movimientos financieros.";
    const confirmed = window.confirm(
      `¿Eliminar el cuadre de ${formatMonth(item.periodMonth)}?\n\n${detail}\n\nEsta accion no se puede deshacer.`
    );
    if (!confirmed) return;
    await settlement.deleteSettlement(item);
  }

  async function saveAndExit() {
    if (!draft) return;
    const saved = await settlement.persistDraft(draft);
    if (saved) props.onNavigate("dashboard");
  }

  async function recordRepayment() {
    if (repaymentBusy) return;
    setLocalError(null);
    if (pendingDiscount <= 0.01 && (repaymentValue <= 0 || repaymentValue > props.loanedBalance + 0.001 || (repaymentMode === "salary" && repaymentValue > salaryRemaining + 0.001))) {
      setLocalError("El monto supera lo prestado o el salario pendiente.");
      return;
    }
    setRepaymentBusy(true);
    try {
      const ok = pendingDiscount > 0.01 || repaymentMode === "salary"
        ? await settlement.registerSalaryDiscount(pendingDiscount > 0.01 ? pendingDiscount : repaymentValue, repaymentMethod)
        : await settlement.addLoanMovement("repay", repaymentValue, repaymentMethod);
      if (ok) setRepaymentAmount("");
    } finally {
      setRepaymentBusy(false);
    }
  }

  if (settlement.loading) {
    return <div className="mt-6 rounded-lg border border-[#30333a] bg-[#181a1e] p-5 text-[#aeb5bf]">Cargando cuadres...</div>;
  }

  return (
    <section ref={sectionRef} className="mt-6 space-y-5 scroll-mt-4">
      <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
        <p className="text-sm font-semibold text-[#00c2a8]">Asistente movil</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">Cuadre quincenal</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">
          Cuenta el dinero, corrige diferencias, registra los pagos y confirma el resultado paso a paso.
        </p>
        {settlement.error || localError ? (
          <p className="mt-4 rounded-lg border border-[#ff5f7e] bg-[#321820] p-3 text-sm text-[#ffd4dd]">
            {localError ?? settlement.error}
          </p>
        ) : null}
      </div>

      {!active ? (
        <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
          <h3 className="text-xl font-semibold text-[#f7f9fb]">Iniciar un cuadre</h3>
          <p className="mt-2 text-sm text-[#aeb5bf]">Periodo seleccionado: {formatMonth(props.selectedMonth)}.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm text-[#c7ced6]">Quincena</span>
              <select value={settlement.periodHalf} onChange={(event) => settlement.setPeriodHalf(Number(event.target.value) as 1 | 2)} className={inputClass}>
                <option value={1}>Primera quincena</option>
                <option value={2}>Segunda quincena</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm text-[#c7ced6]">Fecha real del cuadre</span>
              <input type="date" value={settlement.performedOn} onChange={(event) => settlement.setPerformedOn(event.target.value)} className={inputClass} />
            </label>
          </div>
          <p className="mt-4 text-sm text-[#aeb5bf]">
            Fecha contable: <span className="font-semibold text-[#f7f9fb]">{formatDate(accountingDateFor(props.selectedMonth, settlement.periodHalf))}</span>
          </p>
          {pendingStart ? <div className="mt-5 rounded-lg border border-[#ffe06b] bg-[#28240f] p-4"><h4 className="font-semibold text-[#ffe06b]">Antes de contar el dinero</h4><p className="mt-2 text-sm leading-6 text-[#f7f9fb]">Verifica que ya registraste todos los ingresos y gastos de la quincena, incluidos los movimientos pendientes.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><button onClick={() => { setPendingStart(false); void settlement.startSettlement(); }} disabled={settlement.saving} className={primaryButton}>Ya lo hice</button><button onClick={() => { setPendingStart(false); props.onNavigate("dashboard"); }} className={secondaryButton}>Cancelar cuadre</button></div></div> : null}
          {!pendingStart ? <button onClick={() => setPendingStart(true)} disabled={settlement.saving} className={`${primaryButton} mt-5 w-full sm:w-auto`}>
            {settlement.saving ? "Iniciando..." : "Iniciar cuadre"}
          </button> : null}
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#aeb5bf]">{formatMonth(active.periodMonth)} · {active.periodHalf === 1 ? "Primera" : "Segunda"} quincena</p>
                <p className="mt-1 font-semibold text-[#f7f9fb]">Fecha contable {formatDate(active.accountingDate)}</p>
              </div>
              <span className="rounded-md bg-[#24352f] px-3 py-1 text-xs font-semibold text-[#71f2d8]">Paso {draft?.step ?? 1} de 6</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#101113]">
              <div className="h-full bg-[#00c2a8] transition-all" style={{ width: `${((draft?.step ?? 1) / 6) * 100}%` }} />
            </div>
            {draft ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => void saveAndExit()} disabled={settlement.saving || repaymentBusy} className={secondaryButton}>
                  {settlement.saving ? "Guardando..." : "Cancelar y guardar avance"}
                </button>
                <button onClick={() => void settlement.persistDraft(draft)} disabled={settlement.saving || repaymentBusy} className={secondaryButton}>Guardar y continuar</button>
              </div>
            ) : null}
          </div>

          {draft?.step === 1 ? (
            <div ref={stepRef} className="scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">1. Cuenta el dinero</h3>
              <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">Escribe únicamente lo que tienes realmente. En el siguiente paso te guiaremos para resolver cualquier diferencia.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div>
                  <DifferenceCard label="Efectivo" app={settlement.cashBalance} real={draft.realCashInitial} />
                  <label className="mt-3 block"><span className="text-sm text-[#c7ced6]">Efectivo contado</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.realCashInitial} onChange={(event) => settlement.updateDraft("realCashInitial", event.target.value)} className={inputClass} /></label>
                </div>
                <div>
                  <DifferenceCard label="Cuenta Banco" app={settlement.bankBalance} real={draft.realBankInitial} />
                  <label className="mt-3 block"><span className="text-sm text-[#c7ced6]">Saldo bancario real</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.realBankInitial} onChange={(event) => settlement.updateDraft("realBankInitial", event.target.value)} className={inputClass} /></label>
                </div>
              </div>

              <div className="mt-5 flex justify-end"><button onClick={() => void settlement.goToStep(2)} disabled={draft.realCashInitial === "" || draft.realBankInitial === "" || settlement.saving} className={primaryButton}>Analizar diferencias</button></div>
            </div>
          ) : null}

          {draft?.step === 2 ? (
            <div ref={stepRef} className="scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">2. Resuelve las diferencias</h3>
              <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">
                {initialBalanced
                  ? "Efectivo y banco ya coinciden con la app."
                  : `Diferencia actual: efectivo ${initialCashDiff && initialCashDiff > 0 ? "sobra" : "falta"} ${money.format(Math.abs(initialCashDiff ?? 0))} y en banco ${initialBankDiff && initialBankDiff > 0 ? "sobra" : "falta"} ${money.format(Math.abs(initialBankDiff ?? 0))}.`}
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <DifferenceCard label="Efectivo" app={settlement.cashBalance} real={draft.realCashInitial} />
                <DifferenceCard label="Cuenta Banco" app={settlement.bankBalance} real={draft.realBankInitial} />
              </div>
              {!initialBalanced ? (
                <div className="mt-5 grid gap-4">
                  {transferableAmount > 0 ? (
                    <article className="rounded-lg border border-[#276357] bg-[#0f312e] p-4">
                      <p className="font-semibold text-[#71f2d8]">A. Traslado fisico posible</p>
                      <p className="mt-2 text-sm leading-6 text-[#c7ded8]">Puedes mover {money.format(transferableAmount)} de {physicalTransferFrom} hacia {physicalTransferTo}. Este movimiento corrige el dinero real; no crea otro traslado en la app.</p>
                      <button onClick={() => void confirmPhysicalTransfer()} disabled={settlement.saving} className={`${primaryButton} mt-3 w-full`}>Ya realice el traslado</button>
                    </article>
                  ) : <p className="rounded-lg border border-[#30333a] bg-[#101113] p-4 text-sm text-[#aeb5bf]">A. Traslado fisico: no aplica a estas diferencias.</p>}
                  <article className="rounded-lg border border-[#4b4320] bg-[#28240f] p-4">
                    <p className="font-semibold text-[#ffe06b]">B. Registrar lo que se omitio</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label><span className="text-sm text-[#c7ced6]">Accion</span><select value={correctionType} onChange={(event) => { setCorrectionType(event.target.value as CorrectionType); setCorrectionAmount(String(Math.abs(correctionMethod === "Efectivo" ? initialCashDiff ?? 0 : initialBankDiff ?? 0))); }} className={inputClass}><option value="income">Ingreso omitido o de cuadre</option><option value="expense">Gasto omitido o de cuadre</option><option value="loan_borrow">Prestamo omitido</option><option value="loan_repay">Reposicion omitida</option></select></label>
                      <label><span className="text-sm text-[#c7ced6]">Monto</span><input type="number" inputMode="decimal" min="0" step="0.01" value={correctionAmount || suggestedCorrectionAmount} onChange={(event) => setCorrectionAmount(event.target.value)} className={inputClass} /></label>
                      <label><span className="text-sm text-[#c7ced6]">Medio</span><select value={correctionMethod} onChange={(event) => { setCorrectionMethod(event.target.value); setCorrectionAmount(String(Math.abs(event.target.value === "Efectivo" ? initialCashDiff ?? 0 : initialBankDiff ?? 0))); }} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
                      {(correctionType === "income" || correctionType === "expense") ? <label><span className="text-sm text-[#c7ced6]">Concepto encontrado (opcional)</span><input value={correctionConcept} onChange={(event) => setCorrectionConcept(event.target.value)} placeholder="Vacio = movimiento de cuadre" className={inputClass} /></label> : null}
                    </div>
                    <button onClick={() => void runCorrection()} disabled={settlement.saving} className={`${primaryButton} mt-4 w-full`}>Registrar y recalcular</button>
                  </article>
                </div>
              ) : <p className="mt-5 rounded-lg border border-[#276357] bg-[#0f312e] p-4 text-sm font-semibold text-[#71f2d8]">Listo para comenzar los pagos.</p>}
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(1)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.goToStep(3)} disabled={!initialBalanced || settlement.saving} className={primaryButton}>Ir a pagos fijos</button></div>
            </div>
          ) : null}

          {draft?.step === 3 ? (
            <div ref={stepRef} className="scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">3. Pagos fijos</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Los últimos montos quedan sugeridos para el siguiente cuadre. Indica cuántos meses pagarás.</p>
              <div className="mt-5"><AvailableBalances cash={settlement.cashBalance} bank={settlement.bankBalance} /></div>
              <div className="mt-5 grid gap-4">
                {draft.fixedPayments.map((item, index) => ({ item, index })).sort((a, b) => Number(a.item.registered) - Number(b.item.registered)).map(({ item, index }) => (
                  <article key={item.key} className="rounded-lg border border-[#30333a] bg-[#101113] p-4">
                    <div className="flex items-center justify-between"><p className="font-semibold text-[#f7f9fb]">{item.label}</p><p className="font-semibold text-[#ffe06b]">{money.format(amount(item.monthlyAmount) * Math.max(Number(item.months) || 0, 0))}</p></div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <label><span className="text-xs text-[#aeb5bf]">Monto mensual</span><input type="number" inputMode="decimal" min="0" step="0.01" value={item.monthlyAmount} onChange={(event) => settlement.updateDraft("fixedPayments", draft.fixedPayments.map((current, currentIndex) => currentIndex === index ? { ...current, monthlyAmount: event.target.value } : current))} className={inputClass} /></label>
                      <label><span className="text-xs text-[#aeb5bf]">Meses</span><input type="number" inputMode="numeric" min="1" step="1" value={item.months} onChange={(event) => settlement.updateDraft("fixedPayments", draft.fixedPayments.map((current, currentIndex) => currentIndex === index ? { ...current, months: event.target.value } : current))} className={inputClass} /></label>
                      <label><span className="text-xs text-[#aeb5bf]">Medio</span><select value={item.paymentMethod} onChange={(event) => settlement.updateDraft("fixedPayments", draft.fixedPayments.map((current, currentIndex) => currentIndex === index ? { ...current, paymentMethod: event.target.value } : current))} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
                    </div>
                    <button onClick={() => void settlement.registerFixedPayment(index)} disabled={settlement.saving || item.registered || amount(item.monthlyAmount) <= 0} className={`${item.registered ? secondaryButton : primaryButton} mt-4 w-full`}>{item.registered ? "Registrado" : `Registrar ${item.label}`}</button>
                  </article>
                ))}
              </div>
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(2)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.goToStep(4)} className={primaryButton}>Continuar</button></div>
            </div>
          ) : null}

          {draft?.step === 4 ? (
            <div ref={stepRef} className="scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">4. Reposición y salario</h3>
              {props.loanedBalance > 0.01 || pendingDiscount > 0.01 ? (
                <div className="mt-5 rounded-lg border border-[#4b4320] bg-[#28240f] p-4">
                  <p className="font-semibold text-[#ffe06b]">Primero: reponer {money.format(Math.max(props.loanedBalance, 0))} prestados</p>
                  <p className="mt-2 text-sm leading-6 text-[#d8dde3]">Elige cómo reponerlos. Si los descuentas del salario, el pago líquido baja. Si recibes el dinero en efectivo o por transferencia, aumenta el disponible.</p>
                  {pendingDiscount > 0.01 ? <p className="mt-3 text-sm text-[#ffe06b]">Falta completar el registro de {money.format(pendingDiscount)} descontados. Pulsa el botón para terminarlo.</p> : (
                    <>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button onClick={() => { setRepaymentMode("salary"); setRepaymentAmount(""); }} className={repaymentMode === "salary" ? primaryButton : secondaryButton}>Descontar del salario</button>
                        <button onClick={() => { setRepaymentMode("returned"); setRepaymentAmount(""); }} className={repaymentMode === "returned" ? primaryButton : secondaryButton}>Recibir reposición</button>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <label><span className="text-sm text-[#c7ced6]">Monto a reponer</span><input type="number" inputMode="decimal" min="0" max={repaymentSuggested} step="0.01" value={repaymentAmount || repaymentSuggested.toFixed(2)} onChange={(event) => setRepaymentAmount(event.target.value)} className={inputClass} /></label>
                        <label><span className="text-sm text-[#c7ced6]">{repaymentMode === "salary" ? "Medio donde se aplica" : "Recibido por"}</span><select value={repaymentMethod} onChange={(event) => setRepaymentMethod(event.target.value as "Efectivo" | "Cuenta Banco")} className={inputClass}><option value="Efectivo">Efectivo</option><option value="Cuenta Banco">Transferencia a cuenta</option></select></label>
                      </div>
                      {repaymentMode === "salary" ? <p className="mt-3 text-sm text-[#d8dde3]">Salario base {money.format(300)}. Puedes descontar hasta {money.format(repaymentSuggested)}; lo descontado cuenta como adelanto de salario.</p> : null}
                    </>
                  )}
                  <button onClick={() => void recordRepayment()} disabled={settlement.saving || repaymentBusy || (pendingDiscount <= 0.01 && repaymentValue <= 0)} className={`${primaryButton} mt-4 w-full`}>{repaymentBusy ? "Registrando..." : pendingDiscount > 0.01 ? "Completar descuento" : repaymentMode === "salary" ? "Registrar descuento y reposición" : "Registrar dinero recibido"}</button>
                </div>
              ) : (
                <div className="mt-5 rounded-lg border border-[#276357] bg-[#0f312e] p-4">
                  <p className="font-semibold text-[#71f2d8]">Préstamo repuesto. Ahora paga el salario.</p>
                  <p className="mt-2 text-sm text-[#d8dde3]">Salario base {money.format(300)} · Descontado como adelanto {money.format(salaryDiscount)} · Entregado {money.format(paidSalary - salaryDiscount)} · Falta entregar {money.format(salaryRemaining)}.</p>
                </div>
              )}
              <div className="mt-5"><AvailableBalances cash={settlement.cashBalance} bank={settlement.bankBalance} /></div>
              {props.loanedBalance <= 0.01 && pendingDiscount <= 0.01 && salaryRemaining > 0.01 ? <div className="mt-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label><span className="text-sm text-[#c7ced6]">Monto de este pago</span><input type="number" inputMode="decimal" min="0" max={salaryRemaining} step="0.01" value={draft.salaryAmount} onChange={(event) => settlement.updateDraft("salaryAmount", event.target.value)} className={inputClass} /></label>
                  <label><span className="text-sm text-[#c7ced6]">Pagar desde</span><select value={draft.salaryPaymentMethod} onChange={(event) => settlement.updateDraft("salaryPaymentMethod", event.target.value)} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
                </div>
                <p className="mt-3 text-sm text-[#aeb5bf]">Puedes entregar ahora hasta {money.format(maxSalaryPayment)} desde {draft.salaryPaymentMethod}.</p>
                <button onClick={() => settlement.updateDraft("salaryAmount", maxSalaryPayment.toFixed(2))} disabled={maxSalaryPayment <= 0} className={`${secondaryButton} mt-3 w-full`}>Usar monto disponible</button>
                <button onClick={() => void settlement.registerSalary()} disabled={settlement.saving || amount(draft.salaryAmount) <= 0 || amount(draft.salaryAmount) > maxSalaryPayment} className={`${primaryButton} mt-3 w-full`}>Registrar pago de salario</button>
              </div> : null}
              {paidSalary > 0 ? (
                <div className="mt-4 rounded-lg border border-[#30333a] bg-[#101113] p-4">
                  <p className="text-sm font-semibold text-[#f7f9fb]">Salario aplicado: {money.format(paidSalary)} de {money.format(300)}</p>
                  <div className="mt-2 space-y-2">
                    {draft.actions.filter((item) => item.kind === "salary_expense" || item.kind === "salary_discount_expense").map((item) => (
                      <div key={item.id} className="flex justify-between gap-3 text-sm"><span className="text-[#aeb5bf]">{item.kind === "salary_discount_expense" ? "Adelanto descontado" : item.paymentMethod}</span><span className="font-semibold text-[#71f2d8]">{money.format(item.amount)}</span></div>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(3)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.goToStep(5)} disabled={props.loanedBalance > 0.01 || pendingDiscount > 0.01} className={primaryButton}>Continuar</button></div>
            </div>
          ) : null}

          {draft?.step === 5 ? (
            <div ref={stepRef} className="scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">5. Abono a la tarjeta</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Pendiente actual: <strong className="text-[#ffe06b]">{money.format(props.pendingCardTotal)}</strong>. Tú decides cuánto abonar.</p>
              <div className="mt-5"><AvailableBalances cash={settlement.cashBalance} bank={settlement.bankBalance} /></div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label><span className="text-sm text-[#c7ced6]">Monto del abono</span><input type="number" inputMode="decimal" min="0" max={props.pendingCardTotal} step="0.01" value={draft.cardPaymentAmount} onChange={(event) => settlement.updateDraft("cardPaymentAmount", event.target.value)} className={inputClass} /></label>
                <label><span className="text-sm text-[#c7ced6]">Sale de</span><select value={draft.cardPaymentMethod} onChange={(event) => settlement.updateDraft("cardPaymentMethod", event.target.value)} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
              </div>
              <button onClick={() => void settlement.registerCardPayment()} disabled={settlement.saving || amount(draft.cardPaymentAmount) <= 0 || amount(draft.cardPaymentAmount) > props.pendingCardTotal || amount(draft.cardPaymentAmount) > (draft.cardPaymentMethod === "Efectivo" ? settlement.cashBalance : settlement.bankBalance) || draft.actions.some((item) => item.kind === "card_payment")} className={`${primaryButton} mt-4 w-full`}>{draft.actions.some((item) => item.kind === "card_payment") ? "Abono registrado" : "Registrar abono"}</button>
              <p className="mt-3 text-xs text-[#aeb5bf]">Puedes continuar sin abonar si decides conservar el dinero.</p>
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(4)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.goToStep(6)} className={primaryButton}>Continuar</button></div>
            </div>
          ) : null}

          {draft?.step === 6 ? (
            <div ref={stepRef} className="scroll-mt-4 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">6. Verificación final</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Cuenta nuevamente. Ambos valores deben coincidir antes de cerrar.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div><DifferenceCard label="Efectivo final" app={settlement.cashBalance} real={draft.realCashFinal} /><label className="mt-3 block"><span className="text-sm text-[#c7ced6]">Conteo final</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.realCashFinal} onChange={(event) => settlement.updateDraft("realCashFinal", event.target.value)} className={inputClass} /></label></div>
                <div><DifferenceCard label="Banco final" app={settlement.bankBalance} real={draft.realBankFinal} /><label className="mt-3 block"><span className="text-sm text-[#c7ced6]">Saldo final</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.realBankFinal} onChange={(event) => settlement.updateDraft("realBankFinal", event.target.value)} className={inputClass} /></label></div>
              </div>
              <label className="mt-4 block"><span className="text-sm text-[#c7ced6]">Notas del cierre</span><textarea value={draft.notes} onChange={(event) => settlement.updateDraft("notes", event.target.value)} rows={3} className={inputClass} /></label>
              <div className="mt-5 rounded-lg bg-[#101113] p-4"><p className="text-sm text-[#aeb5bf]">Acciones registradas</p><p className="mt-1 text-2xl font-semibold text-[#f7f9fb]">{draft.actions.length}</p></div>
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(5)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.finalizeSettlement()} disabled={!finalBalanced || settlement.saving} className={primaryButton}>{settlement.saving ? "Finalizando..." : "Finalizar cuadre"}</button></div>
            </div>
          ) : null}
        </>
      )}

      {!active ? <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
        <h3 className="text-xl font-semibold text-[#f7f9fb]">Historial de cuadres</h3>
        <div className="mt-4 grid gap-3">
          {settlement.settlements.length === 0 ? <p className="rounded-lg bg-[#101113] p-4 text-sm text-[#aeb5bf]">Todavía no hay cuadres guardados.</p> : settlement.settlements.map((item) => (
            <article key={item.id} className="rounded-lg border border-[#30333a] bg-[#101113] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-[#f7f9fb]">{formatMonth(item.periodMonth)} · {item.periodHalf === 1 ? "Primera" : "Segunda"} quincena</p><p className="mt-1 text-xs text-[#aeb5bf]">Realizado {formatDate(item.performedOn)} por {item.performedBy}</p></div><span className="rounded-md bg-[#24352f] px-2 py-1 text-xs font-semibold text-[#71f2d8]">{item.status === "finalized" ? "Finalizado" : item.status === "reopened" ? "Reabierto" : "En proceso"}</span></div>
              <p className="mt-3 text-sm text-[#aeb5bf]">{item.draft.actions.length} acciones · Efectivo final {item.appCashFinal === null ? "pendiente" : money.format(item.appCashFinal)} · Banco final {item.appBankFinal === null ? "pendiente" : money.format(item.appBankFinal)}</p>
              {settlement.teamRole === "owner" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.status === "finalized" ? (
                    <button onClick={() => void settlement.reopenSettlement(item)} disabled={settlement.saving || Boolean(active)} className={secondaryButton}>Reabrir para corregir</button>
                  ) : null}
                  <button
                    onClick={() => void confirmDeleteSettlement(item)}
                    disabled={settlement.deletingSettlementId === item.id || settlement.saving}
                    className={dangerButton}
                  >
                    {settlement.deletingSettlementId === item.id ? "Eliminando..." : "Eliminar cuadre y revertir movimientos"}
                  </button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </div> : null}
    </section>
  );
}
