"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { usePrettySalonSettlement } from "@/features/pretty-salon/hooks/usePrettySalonSettlement";
import type { SettlementActionKind } from "@/features/pretty-salon/settlement-types";
import { accountingDateFor, roundMoney } from "@/features/pretty-salon/settlement-utils";
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
};

type CorrectionType = "transfer" | "income" | "expense" | "loan_borrow" | "loan_repay";

const inputClass =
  "mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8]";
const secondaryButton =
  "rounded-lg border border-[#454b55] px-4 py-3 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff] disabled:cursor-not-allowed disabled:opacity-50";
const primaryButton =
  "rounded-lg bg-[#00c2a8] px-4 py-3 text-sm font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-50";

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
  const [correctionType, setCorrectionType] = useState<CorrectionType>("transfer");
  const [correctionAmount, setCorrectionAmount] = useState("");
  const [correctionMethod, setCorrectionMethod] = useState("Efectivo");
  const [correctionConcept, setCorrectionConcept] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const active = settlement.active;
  const draft = active?.draft;

  useEffect(() => {
    if (active && active.periodMonth !== props.selectedMonth) {
      props.onMonthChange(active.periodMonth);
    }
  }, [active, props]);
  const initialCashDiff = draft?.realCashInitial === "" ? null : roundMoney(Number(draft?.realCashInitial) - settlement.cashBalance);
  const initialBankDiff = draft?.realBankInitial === "" ? null : roundMoney(Number(draft?.realBankInitial) - settlement.bankBalance);
  const initialBalanced = initialCashDiff !== null && initialBankDiff !== null && Math.abs(initialCashDiff) <= 0.01 && Math.abs(initialBankDiff) <= 0.01;
  const finalCashDiff = draft?.realCashFinal === "" ? null : roundMoney(Number(draft?.realCashFinal) - settlement.cashBalance);
  const finalBankDiff = draft?.realBankFinal === "" ? null : roundMoney(Number(draft?.realBankFinal) - settlement.bankBalance);
  const finalBalanced = finalCashDiff !== null && finalBankDiff !== null && Math.abs(finalCashDiff) <= 0.01 && Math.abs(finalBankDiff) <= 0.01;

  async function runCorrection() {
    const value = amount(correctionAmount);
    if (value <= 0) {
      setLocalError("Escribe un monto mayor que cero.");
      return;
    }
    setLocalError(null);
    let ok = false;
    if (correctionType === "transfer") {
      const to = correctionMethod === "Efectivo" ? "Cuenta Banco" : "Efectivo";
      ok = await settlement.addTransfer(correctionMethod, to, value);
    } else if (correctionType === "loan_borrow" || correctionType === "loan_repay") {
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

  if (settlement.loading) {
    return <div className="mt-6 rounded-lg border border-[#30333a] bg-[#181a1e] p-5 text-[#aeb5bf]">Cargando cuadres...</div>;
  }

  return (
    <section className="mt-6 space-y-5">
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
          <button onClick={() => void settlement.startSettlement()} disabled={settlement.saving} className={`${primaryButton} mt-5 w-full sm:w-auto`}>
            {settlement.saving ? "Iniciando..." : "Iniciar cuadre"}
          </button>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#aeb5bf]">{formatMonth(active.periodMonth)} · {active.periodHalf === 1 ? "Primera" : "Segunda"} quincena</p>
                <p className="mt-1 font-semibold text-[#f7f9fb]">Fecha contable {formatDate(active.accountingDate)}</p>
              </div>
              <span className="rounded-md bg-[#24352f] px-3 py-1 text-xs font-semibold text-[#71f2d8]">Paso {draft?.step ?? 1} de 5</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#101113]">
              <div className="h-full bg-[#00c2a8] transition-all" style={{ width: `${((draft?.step ?? 1) / 5) * 100}%` }} />
            </div>
            {draft ? (
              <button
                onClick={() => void settlement.persistDraft(draft)}
                disabled={settlement.saving}
                className={`${secondaryButton} mt-4 w-full sm:w-auto`}
              >
                {settlement.saving ? "Guardando..." : "Guardar y continuar despues"}
              </button>
            ) : null}
          </div>

          {draft?.step === 1 ? (
            <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">1. Cuenta y cuadra el dinero</h3>
              <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">Escribe lo que tienes realmente. Registra las correcciones hasta que ambos medios coincidan.</p>
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

              {!initialBalanced ? (
                <div className="mt-6 rounded-lg border border-[#4b4320] bg-[#28240f] p-4">
                  <p className="font-semibold text-[#ffe06b]">Registra lo que haga falta</p>
                  <p className="mt-1 text-sm leading-6 text-[#d8cf9b]">Primero revisa traslados, ingresos, gastos y dinero prestado. Deja el ingreso o gasto de cuadre como ultima opcion.</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <label><span className="text-sm text-[#c7ced6]">Accion</span><select value={correctionType} onChange={(event) => setCorrectionType(event.target.value as CorrectionType)} className={inputClass}><option value="transfer">Traslado entre cajas</option><option value="income">Ingreso omitido o de cuadre</option><option value="expense">Gasto omitido o de cuadre</option><option value="loan_borrow">Prestamo omitido</option><option value="loan_repay">Reposicion omitida</option></select></label>
                    <label><span className="text-sm text-[#c7ced6]">Monto</span><input type="number" inputMode="decimal" min="0" step="0.01" value={correctionAmount} onChange={(event) => setCorrectionAmount(event.target.value)} className={inputClass} /></label>
                    <label><span className="text-sm text-[#c7ced6]">Medio {correctionType === "transfer" ? "de origen" : ""}</span><select value={correctionMethod} onChange={(event) => setCorrectionMethod(event.target.value)} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
                    {(correctionType === "income" || correctionType === "expense") ? <label><span className="text-sm text-[#c7ced6]">Concepto encontrado (opcional)</span><input value={correctionConcept} onChange={(event) => setCorrectionConcept(event.target.value)} placeholder="Vacio = movimiento de cuadre" className={inputClass} /></label> : null}
                  </div>
                  <button onClick={() => void runCorrection()} disabled={settlement.saving} className={`${primaryButton} mt-4 w-full`}>Registrar y recalcular</button>
                </div>
              ) : (
                <p className="mt-5 rounded-lg border border-[#276357] bg-[#0f312e] p-4 text-sm font-semibold text-[#71f2d8]">Efectivo y banco están cuadrados.</p>
              )}
              <div className="mt-5 flex justify-end"><button onClick={() => void settlement.goToStep(2)} disabled={!initialBalanced || settlement.saving} className={primaryButton}>Continuar</button></div>
            </div>
          ) : null}

          {draft?.step === 2 ? (
            <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">2. Prestado y salario</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Pendiente de reponer: <strong className="text-[#ffe06b]">{money.format(Math.max(props.loanedBalance, 0))}</strong>.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label><span className="text-sm text-[#c7ced6]">Salario quincenal</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.salaryAmount} onChange={(event) => settlement.updateDraft("salaryAmount", event.target.value)} className={inputClass} /></label>
                <label><span className="text-sm text-[#c7ced6]">Descontar como adelanto</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.salaryAdvance} onChange={(event) => settlement.updateDraft("salaryAdvance", event.target.value)} className={inputClass} /></label>
                <label><span className="text-sm text-[#c7ced6]">Medio del salario</span><select value={draft.salaryPaymentMethod} onChange={(event) => settlement.updateDraft("salaryPaymentMethod", event.target.value)} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
                <div className="rounded-lg bg-[#101113] p-4"><p className="text-sm text-[#aeb5bf]">Entregar físicamente</p><p className="mt-1 text-2xl font-semibold text-[#71f2d8]">{money.format(Math.max(amount(draft.salaryAmount) - amount(draft.salaryAdvance), 0))}</p></div>
              </div>
              <p className="mt-4 text-xs leading-5 text-[#aeb5bf]">Si hay adelanto, se registrará una reposición contable y el gasto salarial completo. No ingreses físicamente el adelanto otra vez.</p>
              <button onClick={() => void settlement.registerSalary()} disabled={settlement.saving || amount(draft.salaryAmount) <= 0 || amount(draft.salaryAdvance) > Math.max(props.loanedBalance, 0) || draft.actions.some((item) => item.kind === "salary_expense")} className={`${primaryButton} mt-4 w-full`}>
                {draft.actions.some((item) => item.kind === "salary_expense") ? "Salario registrado" : "Registrar salario"}
              </button>
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(1)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.goToStep(3)} disabled={!draft.actions.some((item) => item.kind === "salary_expense")} className={primaryButton}>Continuar</button></div>
            </div>
          ) : null}

          {draft?.step === 3 ? (
            <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">3. Pagos fijos</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Los últimos montos quedan sugeridos para el siguiente cuadre. Indica cuántos meses pagarás.</p>
              <div className="mt-5 grid gap-4">
                {draft.fixedPayments.map((item, index) => (
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
            <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">4. Abono a la tarjeta</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Pendiente actual: <strong className="text-[#ffe06b]">{money.format(props.pendingCardTotal)}</strong>. Tú decides cuánto abonar.</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label><span className="text-sm text-[#c7ced6]">Monto del abono</span><input type="number" inputMode="decimal" min="0" max={props.pendingCardTotal} step="0.01" value={draft.cardPaymentAmount} onChange={(event) => settlement.updateDraft("cardPaymentAmount", event.target.value)} className={inputClass} /></label>
                <label><span className="text-sm text-[#c7ced6]">Sale de</span><select value={draft.cardPaymentMethod} onChange={(event) => settlement.updateDraft("cardPaymentMethod", event.target.value)} className={inputClass}><option>Efectivo</option><option>Cuenta Banco</option></select></label>
              </div>
              <button onClick={() => void settlement.registerCardPayment()} disabled={settlement.saving || amount(draft.cardPaymentAmount) <= 0 || amount(draft.cardPaymentAmount) > props.pendingCardTotal || draft.actions.some((item) => item.kind === "card_payment")} className={`${primaryButton} mt-4 w-full`}>{draft.actions.some((item) => item.kind === "card_payment") ? "Abono registrado" : "Registrar abono"}</button>
              <p className="mt-3 text-xs text-[#aeb5bf]">Puedes continuar sin abonar si decides conservar el dinero.</p>
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(3)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.goToStep(5)} className={primaryButton}>Continuar</button></div>
            </div>
          ) : null}

          {draft?.step === 5 ? (
            <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
              <h3 className="text-xl font-semibold text-[#f7f9fb]">5. Verificación final</h3>
              <p className="mt-2 text-sm text-[#aeb5bf]">Cuenta nuevamente. Ambos valores deben coincidir antes de cerrar.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div><DifferenceCard label="Efectivo final" app={settlement.cashBalance} real={draft.realCashFinal} /><label className="mt-3 block"><span className="text-sm text-[#c7ced6]">Conteo final</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.realCashFinal} onChange={(event) => settlement.updateDraft("realCashFinal", event.target.value)} className={inputClass} /></label></div>
                <div><DifferenceCard label="Banco final" app={settlement.bankBalance} real={draft.realBankFinal} /><label className="mt-3 block"><span className="text-sm text-[#c7ced6]">Saldo final</span><input type="number" inputMode="decimal" min="0" step="0.01" value={draft.realBankFinal} onChange={(event) => settlement.updateDraft("realBankFinal", event.target.value)} className={inputClass} /></label></div>
              </div>
              <label className="mt-4 block"><span className="text-sm text-[#c7ced6]">Notas del cierre</span><textarea value={draft.notes} onChange={(event) => settlement.updateDraft("notes", event.target.value)} rows={3} className={inputClass} /></label>
              <div className="mt-5 rounded-lg bg-[#101113] p-4"><p className="text-sm text-[#aeb5bf]">Acciones registradas</p><p className="mt-1 text-2xl font-semibold text-[#f7f9fb]">{draft.actions.length}</p></div>
              <div className="mt-5 flex justify-between gap-3"><button onClick={() => void settlement.goToStep(4)} className={secondaryButton}>Atrás</button><button onClick={() => void settlement.finalizeSettlement()} disabled={!finalBalanced || settlement.saving} className={primaryButton}>{settlement.saving ? "Finalizando..." : "Finalizar cuadre"}</button></div>
            </div>
          ) : null}
        </>
      )}

      <div className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4 sm:p-5">
        <h3 className="text-xl font-semibold text-[#f7f9fb]">Historial de cuadres</h3>
        <div className="mt-4 grid gap-3">
          {settlement.settlements.length === 0 ? <p className="rounded-lg bg-[#101113] p-4 text-sm text-[#aeb5bf]">Todavía no hay cuadres guardados.</p> : settlement.settlements.map((item) => (
            <article key={item.id} className="rounded-lg border border-[#30333a] bg-[#101113] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-semibold text-[#f7f9fb]">{formatMonth(item.periodMonth)} · {item.periodHalf === 1 ? "Primera" : "Segunda"} quincena</p><p className="mt-1 text-xs text-[#aeb5bf]">Realizado {formatDate(item.performedOn)} por {item.performedBy}</p></div><span className="rounded-md bg-[#24352f] px-2 py-1 text-xs font-semibold text-[#71f2d8]">{item.status === "finalized" ? "Finalizado" : item.status === "reopened" ? "Reabierto" : "En proceso"}</span></div>
              <p className="mt-3 text-sm text-[#aeb5bf]">{item.draft.actions.length} acciones · Efectivo final {item.appCashFinal === null ? "pendiente" : money.format(item.appCashFinal)} · Banco final {item.appBankFinal === null ? "pendiente" : money.format(item.appBankFinal)}</p>
              {item.status === "finalized" && settlement.teamRole === "owner" ? <button onClick={() => void settlement.reopenSettlement(item)} disabled={settlement.saving || Boolean(active)} className={`${secondaryButton} mt-3`}>Reabrir para corregir</button> : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
