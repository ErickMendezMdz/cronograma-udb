import type {
  BreakdownItem,
  CashTransferFormState,
  ExpensePaymentFormState,
  LoanMovementFormState,
  SalonCashTransfer,
  SalonCashTransferInsert,
  SalonCashTransferRow,
  SalonExpensePayment,
  SalonExpensePaymentInsert,
  SalonExpensePaymentRow,
  SalonLoanMovement,
  SalonLoanMovementInsert,
  SalonLoanMovementRow,
  SalonStatus,
  SalonTransaction,
  SalonTransactionInsert,
  SalonTransactionRow,
  TransactionFormState,
  TransactionKind,
} from "@/features/pretty-salon/types";

export const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function currentMonthISO() {
  return todayISO().slice(0, 7);
}

export function dateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return toISODate(date);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatDay(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

export function normalizeCashMethod(paymentMethod: string | null | undefined) {
  if (paymentMethod === "Tarjeta" || paymentMethod === "Transferencia" || paymentMethod === "Cuenta Banco") {
    return "Cuenta Banco";
  }

  return "Efectivo";
}

export function normalizeExpenseSettlementMethod(paymentMethod: string | null | undefined) {
  return paymentMethod === "Donacion" ? "Donacion" : normalizeCashMethod(paymentMethod);
}

export function normalizePaymentMethod(kind: TransactionKind, paymentMethod: string | null | undefined) {
  if (kind === "income") {
    if (paymentMethod === "Credito" || paymentMethod === "Tarjeta de credito") return "Credito";
    return normalizeCashMethod(paymentMethod);
  }

  if (paymentMethod === "Credito" || paymentMethod === "Tarjeta de credito") {
    return "Tarjeta de credito";
  }

  return normalizeCashMethod(paymentMethod);
}

export function normalizeTransactionCategory(
  kind: TransactionKind,
  category: string | null | undefined
) {
  if (kind !== "expense") return category ?? "General";
  if (category === "Nomina") return "Salarios";
  if (category === "Renta") return "Prestamo";
  return category ?? "General";
}

export function isCreditPayment(paymentMethod: string) {
  return paymentMethod === "Credito" || paymentMethod === "Tarjeta de credito";
}

export function isDonationPayment(paymentMethod: string) {
  return paymentMethod === "Donacion";
}

export function resolveStatusForPayment(paymentMethod: string, status: SalonStatus): SalonStatus {
  return isCreditPayment(paymentMethod) ? "pending" : status;
}

export function storageKeyFor(userId: string) {
  return `pretty-salon-finance:${userId}`;
}

export function defaultIncomeForm(): TransactionFormState {
  return {
    date: todayISO(),
    concept: "",
    category: "Servicios",
    amount: "",
    paymentMethod: "Efectivo",
    status: "paid",
    contact: "",
    notes: "",
  };
}

export function defaultExpenseForm(): TransactionFormState {
  return {
    date: todayISO(),
    concept: "",
    category: "Insumos",
    amount: "",
    paymentMethod: "Efectivo",
    status: "paid",
    contact: "",
    notes: "",
  };
}

export function defaultCashTransferForm(): CashTransferFormState {
  return {
    date: todayISO(),
    fromMethod: "Efectivo",
    toMethod: "Cuenta Banco",
    amount: "",
    notes: "",
  };
}

export function defaultExpensePaymentForm(): ExpensePaymentFormState {
  return {
    date: todayISO(),
    amount: "",
    paymentMethod: "Cuenta Banco",
    notes: "",
  };
}

export function defaultLoanMovementForm(): LoanMovementFormState {
  return {
    date: todayISO(),
    movementType: "borrow",
    borrower: "Erick",
    amount: "",
    paymentMethod: "Efectivo",
    notes: "",
  };
}

export function isSalonTransaction(item: unknown): item is SalonTransaction {
  if (!item || typeof item !== "object") return false;

  const tx = item as Record<string, unknown>;
  return (
    (tx.kind === "income" || tx.kind === "expense") &&
    typeof tx.id === "string" &&
    typeof tx.date === "string" &&
    typeof tx.concept === "string" &&
    typeof tx.category === "string" &&
    typeof tx.amount === "number" &&
    typeof tx.paymentMethod === "string" &&
    (tx.status === "paid" || tx.status === "pending") &&
    typeof tx.contact === "string" &&
    typeof tx.notes === "string"
  );
}

export function loadLegacyTransactions(userId: string) {
  const stored = localStorage.getItem(storageKeyFor(userId));
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSalonTransaction)
      .filter((item) => !item.id.startsWith("seed-"));
  } catch {
    return [];
  }
}

export function clearLegacyTransactions(userId: string) {
  localStorage.removeItem(storageKeyFor(userId));
}

export function normalizeTransactionRow(row: SalonTransactionRow): SalonTransaction {
  const paymentMethod = normalizePaymentMethod(row.kind, row.payment_method);

  return {
    id: row.id,
    kind: row.kind,
    date: row.transaction_date,
    concept: row.concept,
    category: normalizeTransactionCategory(row.kind, row.category),
    amount: Number(row.amount),
    paymentMethod,
    status: resolveStatusForPayment(paymentMethod, row.status),
    contact: row.contact ?? "",
    notes: row.notes ?? "",
  };
}

export function normalizeCashTransferRow(row: SalonCashTransferRow): SalonCashTransfer {
  return {
    id: row.id,
    date: row.transfer_date,
    fromMethod: normalizeCashMethod(row.from_method),
    toMethod: normalizeCashMethod(row.to_method),
    amount: Number(row.amount),
    notes: row.notes ?? "",
  };
}

export function normalizeExpensePaymentRow(row: SalonExpensePaymentRow): SalonExpensePayment {
  return {
    id: row.id,
    date: row.payment_date,
    paymentMethod: normalizeExpenseSettlementMethod(row.payment_method),
    amount: Number(row.amount),
    notes: row.notes ?? "",
  };
}

export function normalizeLoanMovementRow(row: SalonLoanMovementRow): SalonLoanMovement {
  return {
    id: row.id,
    date: row.movement_date,
    movementType: row.movement_type === "repay" ? "repay" : "borrow",
    borrower: row.borrower ?? "",
    paymentMethod: normalizeCashMethod(row.payment_method),
    amount: Number(row.amount),
    notes: row.notes ?? "",
  };
}

export function toTransactionInsert(
  ownerId: string,
  item: Omit<SalonTransaction, "id">
): SalonTransactionInsert {
  const paymentMethod = normalizePaymentMethod(item.kind, item.paymentMethod);

  return {
    owner_id: ownerId,
    kind: item.kind,
    transaction_date: item.date,
    concept: item.concept,
    category: normalizeTransactionCategory(item.kind, item.category),
    amount: item.amount,
    payment_method: paymentMethod,
    status: resolveStatusForPayment(paymentMethod, item.status),
    contact: item.contact,
    notes: item.notes,
  };
}

export function toCashTransferInsert(
  ownerId: string,
  item: Omit<SalonCashTransfer, "id">
): SalonCashTransferInsert {
  return {
    owner_id: ownerId,
    transfer_date: item.date,
    from_method: normalizeCashMethod(item.fromMethod),
    to_method: normalizeCashMethod(item.toMethod),
    amount: item.amount,
    notes: item.notes,
  };
}

export function toExpensePaymentInsert(
  ownerId: string,
  item: Omit<SalonExpensePayment, "id">
): SalonExpensePaymentInsert {
  return {
    owner_id: ownerId,
    payment_date: item.date,
    payment_method: normalizeExpenseSettlementMethod(item.paymentMethod),
    amount: item.amount,
    notes: item.notes,
  };
}

export function toLoanMovementInsert(
  ownerId: string,
  item: Omit<SalonLoanMovement, "id">
): SalonLoanMovementInsert {
  return {
    owner_id: ownerId,
    movement_date: item.date,
    movement_type: item.movementType,
    borrower: item.borrower,
    payment_method: normalizeCashMethod(item.paymentMethod),
    amount: item.amount,
    notes: item.notes,
  };
}

export function sumAmounts(items: SalonTransaction[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

export function allocateExpensePayments(
  payments: SalonExpensePayment[],
  transactions: SalonTransaction[]
) {
  const allocation = new Map<string, number>();
  const pendingExpenseQueue = [...transactions]
    .filter((item) => item.kind === "expense" && item.status === "pending")
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.id.localeCompare(b.id);
    })
    .map((item) => ({ id: item.id, remaining: item.amount }));

  let expenseIndex = 0;

  for (const payment of [...payments].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.id.localeCompare(b.id);
  })) {
    let remainingPayment = payment.amount;

    while (remainingPayment > 0 && expenseIndex < pendingExpenseQueue.length) {
      const currentExpense = pendingExpenseQueue[expenseIndex];
      const appliedAmount = Math.min(currentExpense.remaining, remainingPayment);

      allocation.set(
        currentExpense.id,
        (allocation.get(currentExpense.id) ?? 0) + appliedAmount
      );

      currentExpense.remaining = Math.round((currentExpense.remaining - appliedAmount) * 100) / 100;
      remainingPayment = Math.round((remainingPayment - appliedAmount) * 100) / 100;

      if (currentExpense.remaining <= 0.001) {
        expenseIndex += 1;
      }
    }
  }

  return allocation;
}

export function formatSignedMoney(value: number) {
  if (value === 0) return money.format(0);

  const formatted = money.format(Math.abs(value));
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

export function buildBreakdown(items: SalonTransaction[], colors: string[]): BreakdownItem[] {
  const grouped = new Map<string, number>();
  const total = sumAmounts(items);

  for (const item of items) {
    const key = item.category.trim() || "Sin categoria";
    grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
  }

  return [...grouped.entries()]
    .map(([label, value], index) => ({
      label,
      value,
      share: total > 0 ? (value / total) * 100 : 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function buildValueBreakdown(items: Array<{ label: string; value: number }>, colors: string[]): BreakdownItem[] {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const key = item.label.trim() || "Sin categoria";
    grouped.set(key, (grouped.get(key) ?? 0) + item.value);
  }

  const total = [...grouped.values()].reduce((sum, value) => sum + value, 0);

  return [...grouped.entries()]
    .filter(([, value]) => value > 0)
    .map(([label, value], index) => ({
      label,
      value,
      share: total > 0 ? (value / total) * 100 : 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
}

export function getStatusLabel(status: SalonStatus, kind: TransactionKind) {
  if (status === "paid") {
    return kind === "income" ? "Cobrado" : "Pagado";
  }

  return kind === "income" ? "Por cobrar" : "Por pagar";
}
