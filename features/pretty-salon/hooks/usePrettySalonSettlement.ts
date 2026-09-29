"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createPrettySalonCashTransfer,
  createPrettySalonExpensePayment,
  createPrettySalonLoanMovement,
  createPrettySalonTransaction,
} from "@/features/pretty-salon/services/prettySalonService";
import {
  createPrettySalonSettlement,
  deletePrettySalonSettlement,
  getPrettySalonSettlements,
  getPrettySalonTeamRole,
  reopenPrettySalonSettlement,
  updatePrettySalonSettlement,
} from "@/features/pretty-salon/services/prettySalonSettlementService";
import type {
  SalonSettlement,
  SettlementAction,
  SettlementActionKind,
  SettlementDraft,
  SettlementHalf,
  SettlementTransactionInput,
  TeamRole,
} from "@/features/pretty-salon/settlement-types";
import {
  accountingDateFor,
  defaultSettlementDraft,
  roundMoney,
  todayForInput,
  validMoney,
} from "@/features/pretty-salon/settlement-utils";
import {
  toCashTransferInsert,
  toExpensePaymentInsert,
  toLoanMovementInsert,
  toTransactionInsert,
} from "@/features/pretty-salon/utils";

type BalanceItem = { method: string; balance: number };

type UsePrettySalonSettlementOptions = {
  supabase: SupabaseClient;
  userId: string;
  email: string | null;
  selectedMonth: string;
  balances: BalanceItem[];
  pendingCardTotal: number;
  loanedBalance: number;
  onReload: () => Promise<boolean>;
};

function errorMessage(error: { message: string } | null) {
  return error?.message ?? "No se pudo completar la operacion.";
}

export function usePrettySalonSettlement({
  supabase,
  userId,
  email,
  selectedMonth,
  balances,
  pendingCardTotal,
  loanedBalance,
  onReload,
}: UsePrettySalonSettlementOptions) {
  const [settlements, setSettlements] = useState<SalonSettlement[]>([]);
  const [active, setActive] = useState<SalonSettlement | null>(null);
  const activeRef = useRef<SalonSettlement | null>(null);
  const [teamRole, setTeamRole] = useState<TeamRole>(null);
  const [periodHalf, setPeriodHalf] = useState<SettlementHalf>(new Date().getDate() <= 15 ? 1 : 2);
  const [performedOn, setPerformedOn] = useState(todayForInput);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingSettlementId, setDeletingSettlementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cashBalance = roundMoney(balances.find((item) => item.method === "Efectivo")?.balance ?? 0);
  const bankBalance = roundMoney(balances.find((item) => item.method === "Cuenta Banco")?.balance ?? 0);

  const loadSettlements = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [settlementResult, roleResult] = await Promise.all([
      getPrettySalonSettlements(supabase),
      getPrettySalonTeamRole(supabase, email),
    ]);
    setLoading(false);

    if (settlementResult.error) {
      setError(`${settlementResult.error.message}. Ejecuta supabase/pretty_salon_settlements.sql.`);
      return;
    }

    setSettlements(settlementResult.data);
    setTeamRole(roleResult.role);
    const open = settlementResult.data.find((item) => item.status !== "finalized") ?? null;
    activeRef.current = open;
    setActive(open);
  }, [email, supabase]);

  useEffect(() => {
    void loadSettlements();
  }, [loadSettlements]);

  const latestSuggestion = useMemo(
    () => settlements.find((item) => item.status === "finalized") ?? settlements[0] ?? null,
    [settlements]
  );

  function replaceSettlement(next: SalonSettlement) {
    activeRef.current = next;
    setActive(next);
    setSettlements((current) => [next, ...current.filter((item) => item.id !== next.id)]);
  }

  async function startSettlement() {
    setSaving(true);
    setError(null);
    const result = await createPrettySalonSettlement(supabase, {
      owner_id: userId,
      period_month: selectedMonth,
      period_half: periodHalf,
      accounting_date: accountingDateFor(selectedMonth, periodHalf),
      performed_on: performedOn,
      performed_by: email ?? "Administracion",
      app_cash_initial: roundMoney(cashBalance),
      app_bank_initial: roundMoney(bankBalance),
      draft: defaultSettlementDraft(latestSuggestion),
    });
    setSaving(false);

    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return;
    }
    replaceSettlement(result.data);
  }

  async function persistDraft(draft: SettlementDraft) {
    const current = activeRef.current;
    if (!current) return false;
    setSaving(true);
    const result = await updatePrettySalonSettlement(supabase, current.id, { draft });
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return false;
    }
    replaceSettlement(result.data);
    return true;
  }

  function updateDraft<K extends keyof SettlementDraft>(field: K, value: SettlementDraft[K]) {
    const current = activeRef.current;
    if (!current) return;
    replaceSettlement({ ...current, draft: { ...current.draft, [field]: value } });
  }

  async function goToStep(step: SettlementDraft["step"]) {
    if (!active) return;
    await persistDraft({ ...active.draft, step });
  }

  async function appendAction(action: Omit<SettlementAction, "id" | "createdAt">) {
    const current = activeRef.current;
    if (!current) return false;
    const nextAction: SettlementAction = {
      ...action,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return persistDraft({ ...current.draft, actions: [...current.draft.actions, nextAction] });
  }

  async function recordPhysicalTransfer(
    fromMethod: string,
    toMethod: string,
    amount: number,
    realCashInitial: string,
    realBankInitial: string
  ) {
    const current = activeRef.current;
    if (!current) return false;
    const action: SettlementAction = {
      id: crypto.randomUUID(),
      kind: "physical_transfer",
      label: `Traslado fisico de ${fromMethod} a ${toMethod}`,
      amount: roundMoney(amount),
      paymentMethod: fromMethod,
      financialRecordId: "",
      financialTable: "",
      createdAt: new Date().toISOString(),
    };
    return persistDraft({
      ...current.draft,
      realCashInitial,
      realBankInitial,
      actions: [...current.draft.actions, action],
    });
  }

  async function addTransaction(input: SettlementTransactionInput) {
    if (!active || input.amount <= 0) return false;
    setSaving(true);
    const result = await createPrettySalonTransaction(
      supabase,
      toTransactionInsert(userId, {
        kind: input.kind,
        date: active.accountingDate,
        concept: input.concept,
        category: input.category,
        amount: roundMoney(input.amount),
        paymentMethod: input.paymentMethod,
        status: input.status ?? "paid",
        contact: "",
        notes: `${input.notes ? `${input.notes}\n` : ""}Registrado desde cuadre ${active.periodMonth} Q${active.periodHalf}. Cuadre ID: ${active.id}.`,
      })
    );
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return false;
    }
    await appendAction({
      kind: input.actionKind,
      label: input.concept,
      amount: roundMoney(input.amount),
      paymentMethod: input.paymentMethod,
      financialRecordId: result.data.id,
      financialTable: "pretty_salon_transactions",
    });
    await onReload();
    return true;
  }

  async function addTransfer(fromMethod: string, toMethod: string, amount: number) {
    if (!active || amount <= 0 || fromMethod === toMethod) return false;
    setSaving(true);
    const result = await createPrettySalonCashTransfer(
      supabase,
      toCashTransferInsert(userId, {
        date: active.accountingDate,
        fromMethod,
        toMethod,
        amount: roundMoney(amount),
        notes: `Registrado desde cuadre ${active.periodMonth} Q${active.periodHalf}. Cuadre ID: ${active.id}.`,
      })
    );
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return false;
    }
    await appendAction({
      kind: "transfer",
      label: `Traslado de ${fromMethod} a ${toMethod}`,
      amount: roundMoney(amount),
      paymentMethod: fromMethod,
      financialRecordId: result.data.id,
      financialTable: "pretty_salon_cash_transfers",
    });
    await onReload();
    return true;
  }

  async function addLoanMovement(
    movementType: "borrow" | "repay",
    amount: number,
    paymentMethod: string,
    actionKind: SettlementActionKind = movementType === "borrow" ? "loan_borrow" : "loan_repay"
  ) {
    if (!active || amount <= 0) return false;
    setSaving(true);
    const result = await createPrettySalonLoanMovement(
      supabase,
      toLoanMovementInsert(userId, {
        date: active.accountingDate,
        movementType,
        borrower: "Esposa",
        paymentMethod,
        amount: roundMoney(amount),
        notes: `Registrado desde cuadre ${active.periodMonth} Q${active.periodHalf}. Cuadre ID: ${active.id}.`,
      })
    );
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return false;
    }
    await appendAction({
      kind: actionKind,
      label: actionKind === "salary_discount_repay" ? "Adelanto descontado del salario" : movementType === "borrow" ? "Dinero prestado omitido" : "Reposicion de dinero prestado",
      amount: roundMoney(amount),
      paymentMethod,
      financialRecordId: result.data.id,
      financialTable: "pretty_salon_loan_movements",
    });
    await onReload();
    return true;
  }

  function pendingSalaryDiscount() {
    const actions = activeRef.current?.draft.actions ?? [];
    return roundMoney(
      actions.filter((item) => item.kind === "salary_discount_repay").reduce((total, item) => total + item.amount, 0) -
      actions.filter((item) => item.kind === "salary_discount_expense").reduce((total, item) => total + item.amount, 0)
    );
  }

  async function registerSalaryDiscount(amount: number, method: string) {
    const current = activeRef.current;
    if (!current) return false;
    const pending = pendingSalaryDiscount();
    if (pending > 0.001) {
      const repaidAction = [...current.draft.actions].reverse().find((item) => item.kind === "salary_discount_repay");
      if (!repaidAction) return false;
      const recorded = await addTransaction({ kind: "expense", actionKind: "salary_discount_expense", concept: "Adelanto de salario", category: "Salarios", amount: pending, paymentMethod: repaidAction.paymentMethod });
      if (recorded) {
        const paid = activeRef.current?.draft.actions.filter((item) => item.kind === "salary_expense" || item.kind === "salary_discount_expense").reduce((total, item) => total + item.amount, 0) ?? 0;
        updateDraft("salaryAmount", Math.max(roundMoney(300 - paid), 0).toFixed(2));
      }
      return recorded;
    }
    const value = roundMoney(amount);
    const paid = current.draft.actions.filter((item) => item.kind === "salary_expense" || item.kind === "salary_discount_expense").reduce((total, item) => total + item.amount, 0);
    if (value <= 0 || value > loanedBalance + 0.001 || value > roundMoney(300 - paid) + 0.001) {
      setError("El adelanto supera el préstamo o el salario pendiente.");
      return false;
    }
    const repaid = await addLoanMovement("repay", value, method, "salary_discount_repay");
    if (!repaid) return false;
    const recorded = await addTransaction({ kind: "expense", actionKind: "salary_discount_expense", concept: "Adelanto de salario", category: "Salarios", amount: value, paymentMethod: method });
    if (recorded) updateDraft("salaryAmount", Math.max(roundMoney(300 - paid - value), 0).toFixed(2));
    return recorded;
  }

  async function registerSalary() {
    if (!active || !validMoney(active.draft.salaryAmount)) return false;
    const salary = roundMoney(Number(active.draft.salaryAmount));
    const method = active.draft.salaryPaymentMethod as "Efectivo" | "Cuenta Banco";
    const availableCash = method === "Efectivo" ? cashBalance : bankBalance;
    const alreadyPaid = active.draft.actions
      .filter((item) => item.kind === "salary_expense" || item.kind === "salary_discount_expense")
      .reduce((total, item) => total + item.amount, 0);
    if (loanedBalance > 0.01 || pendingSalaryDiscount() > 0.01) {
      setError("Primero repón todo el dinero prestado.");
      return false;
    }
    if (salary > roundMoney(300 - alreadyPaid) + 0.001) {
      setError("El pago supera el salario quincenal pendiente.");
      return false;
    }
    if (salary <= 0) {
      setError("Escribe un pago de salario mayor que cero.");
      return false;
    }
    if (salary > availableCash + 0.001) {
      setError(`No hay suficiente saldo en ${method}. Disponible: ${availableCash.toFixed(2)}.`);
      return false;
    }

    const registered = await addTransaction({
      kind: "expense",
      actionKind: "salary_expense",
      concept: "Salario quincenal",
      category: "Salarios",
      amount: salary,
      paymentMethod: active.draft.salaryPaymentMethod,
    });
    if (!registered) return false;
    const current = activeRef.current;
    if (current) {
      await persistDraft({ ...current.draft, salaryAmount: "" });
    }
    return true;
  }

  async function registerFixedPayment(index: number) {
    if (!active) return false;
    const item = active.draft.fixedPayments[index];
    const monthly = Number(item.monthlyAmount);
    const months = Number(item.months);
    if (!Number.isFinite(monthly) || monthly <= 0 || !Number.isInteger(months) || months <= 0) return false;
    const paymentAmount = roundMoney(monthly * months);
    const available = item.paymentMethod === "Efectivo" ? cashBalance : bankBalance;
    if (paymentAmount > available + 0.001) {
      setError(`No hay suficiente saldo en ${item.paymentMethod}. Disponible: ${available.toFixed(2)}.`);
      return false;
    }
    const ok = await addTransaction({
      kind: "expense",
      actionKind: "fixed_expense",
      concept: `${item.label} (${months} mes${months === 1 ? "" : "es"})`,
      category: item.key === "alcaldia" ? "Alcaldia" : item.key === "luz" ? "Servicios basicos" : "Marketing",
      amount: paymentAmount,
      paymentMethod: item.paymentMethod,
    });
    if (!ok) return false;
    const current = activeRef.current;
    if (!current) return true;
    const fixedPayments = current.draft.fixedPayments.map((candidate, candidateIndex) =>
      candidateIndex === index ? { ...candidate, registered: true } : candidate
    );
    await persistDraft({ ...current.draft, fixedPayments });
    return true;
  }

  async function registerCardPayment() {
    if (!active) return false;
    const amount = roundMoney(Number(active.draft.cardPaymentAmount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > pendingCardTotal + 0.001) return false;
    const available = active.draft.cardPaymentMethod === "Efectivo" ? cashBalance : bankBalance;
    if (amount > available + 0.001) {
      setError(`No hay suficiente saldo en ${active.draft.cardPaymentMethod}. Disponible: ${available.toFixed(2)}.`);
      return false;
    }
    setSaving(true);
    const result = await createPrettySalonExpensePayment(
      supabase,
      toExpensePaymentInsert(userId, {
        date: active.accountingDate,
        amount,
        paymentMethod: active.draft.cardPaymentMethod,
        notes: `Abono registrado desde cuadre ${active.periodMonth} Q${active.periodHalf}. Cuadre ID: ${active.id}.`,
      })
    );
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return false;
    }
    await appendAction({
      kind: "card_payment",
      label: "Abono a tarjeta de credito",
      amount,
      paymentMethod: active.draft.cardPaymentMethod,
      financialRecordId: result.data.id,
      financialTable: "pretty_salon_expense_payments",
    });
    await onReload();
    return true;
  }

  async function finalizeSettlement() {
    if (!active || !validMoney(active.draft.realCashFinal) || !validMoney(active.draft.realBankFinal)) return false;
    const realCash = roundMoney(Number(active.draft.realCashFinal));
    const realBank = roundMoney(Number(active.draft.realBankFinal));
    if (Math.abs(realCash - cashBalance) > 0.01 || Math.abs(realBank - bankBalance) > 0.01) return false;
    setSaving(true);
    const result = await updatePrettySalonSettlement(supabase, active.id, {
      status: "finalized",
      app_cash_final: roundMoney(cashBalance),
      app_bank_final: roundMoney(bankBalance),
      draft: { ...active.draft, step: 6 },
      finalized_at: new Date().toISOString(),
    });
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return false;
    }
    replaceSettlement(result.data);
    activeRef.current = null;
    setActive(null);
    return true;
  }

  async function reopenSettlement(settlement: SalonSettlement) {
    if (teamRole !== "owner") return;
    setSaving(true);
    const result = await reopenPrettySalonSettlement(supabase, settlement);
    setSaving(false);
    if (result.error || !result.data) {
      setError(errorMessage(result.error));
      return;
    }
    replaceSettlement(result.data);
  }

  async function deleteSettlement(settlement: SalonSettlement) {
    if (teamRole !== "owner") return false;
    setDeletingSettlementId(settlement.id);
    setError(null);
    const result = await deletePrettySalonSettlement(supabase, settlement.id);
    setDeletingSettlementId(null);
    if (result.error) {
      setError(errorMessage(result.error));
      return false;
    }

    if (activeRef.current?.id === settlement.id) {
      activeRef.current = null;
      setActive(null);
    }
    setSettlements((current) => current.filter((item) => item.id !== settlement.id));
    await onReload();
    return true;
  }

  return {
    settlements,
    active,
    teamRole,
    periodHalf,
    setPeriodHalf,
    performedOn,
    setPerformedOn,
    loading,
    saving,
    deletingSettlementId,
    error,
    cashBalance,
    bankBalance,
    startSettlement,
    updateDraft,
    persistDraft,
    goToStep,
    addTransaction,
    addTransfer,
    recordPhysicalTransfer,
    addLoanMovement,
    registerSalaryDiscount,
    registerSalary,
    registerFixedPayment,
    registerCardPayment,
    finalizeSettlement,
    reopenSettlement,
    deleteSettlement,
  };
}
