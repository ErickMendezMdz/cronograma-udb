import type {
  SalonSettlement,
  SalonSettlementRow,
  SettlementDraft,
  SettlementFixedPayment,
  SettlementHalf,
} from "@/features/pretty-salon/settlement-types";
import { todayISO } from "@/features/pretty-salon/utils";

export const settlementFixedPayments = (): SettlementFixedPayment[] => [
  { key: "alcaldia", label: "Alcaldia", monthlyAmount: "", months: "1", paymentMethod: "Cuenta Banco", registered: false },
  { key: "luz", label: "Luz", monthlyAmount: "", months: "1", paymentMethod: "Cuenta Banco", registered: false },
  { key: "publicidad", label: "Publicidad", monthlyAmount: "", months: "1", paymentMethod: "Cuenta Banco", registered: false },
];

export function accountingDateFor(month: string, half: SettlementHalf) {
  if (half === 1) return `${month}-15`;
  const [year, monthNumber] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, "0")}`;
}

export function defaultSettlementDraft(suggestions?: SalonSettlement | null): SettlementDraft {
  const prior = suggestions?.draft;
  const priorSalary = prior?.salaryAmount || String(
    prior?.actions
      .filter((item) => item.kind === "salary_expense")
      .reduce((total, item) => total + item.amount, 0) || ""
  );
  return {
    step: 1,
    realCashInitial: "",
    realBankInitial: "",
    realCashFinal: "",
    realBankFinal: "",
    salaryAmount: priorSalary,
    salaryAdvance: "",
    salaryPaymentMethod: prior?.salaryPaymentMethod ?? "Efectivo",
    fixedPayments: settlementFixedPayments().map((item) => {
      const old = prior?.fixedPayments.find((candidate) => candidate.key === item.key);
      return old ? { ...item, monthlyAmount: old.monthlyAmount, paymentMethod: old.paymentMethod } : item;
    }),
    cardPaymentAmount: "",
    cardPaymentMethod: "Cuenta Banco",
    notes: "",
    actions: [],
  };
}

function hydrateSettlementDraft(draft: SettlementDraft): SettlementDraft {
  return {
    ...defaultSettlementDraft(),
    ...draft,
    step: draft.step >= 1 && draft.step <= 6 ? draft.step : 1,
    fixedPayments: settlementFixedPayments().map((item) => {
      const saved = draft.fixedPayments?.find((candidate) => candidate.key === item.key);
      return saved ? { ...item, ...saved } : item;
    }),
    actions: Array.isArray(draft.actions) ? draft.actions : [],
  };
}

export function normalizeSettlement(row: SalonSettlementRow): SalonSettlement {
  return {
    id: row.id,
    ownerId: row.owner_id,
    periodMonth: row.period_month,
    periodHalf: row.period_half,
    accountingDate: row.accounting_date,
    performedOn: row.performed_on,
    performedBy: row.performed_by,
    status: row.status,
    appCashInitial: Number(row.app_cash_initial),
    appBankInitial: Number(row.app_bank_initial),
    appCashFinal: row.app_cash_final === null ? null : Number(row.app_cash_final),
    appBankFinal: row.app_bank_final === null ? null : Number(row.app_bank_final),
    draft: hydrateSettlementDraft(row.draft),
    finalizedAt: row.finalized_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function validMoney(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0;
}

export function todayForInput() {
  return todayISO();
}

type SettlementReviewContext = {
  settlementId: string;
  periodMonth: string;
  periodHalf: SettlementHalf;
  expiresAt: number;
};

function reviewStorageKey(userId: string) {
  return `pretty-salon-settlement-review:${userId}`;
}

export function beginSettlementReview(
  userId: string,
  settlement: Pick<SalonSettlement, "id" | "periodMonth" | "periodHalf">
) {
  const context: SettlementReviewContext = {
    settlementId: settlement.id,
    periodMonth: settlement.periodMonth,
    periodHalf: settlement.periodHalf,
    expiresAt: Date.now() + 4 * 60 * 60 * 1000,
  };
  localStorage.setItem(reviewStorageKey(userId), JSON.stringify(context));
}

export function getSettlementReview(userId: string): SettlementReviewContext | null {
  const raw = localStorage.getItem(reviewStorageKey(userId));
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SettlementReviewContext>;
    if (
      typeof value.settlementId !== "string" ||
      typeof value.periodMonth !== "string" ||
      (value.periodHalf !== 1 && value.periodHalf !== 2) ||
      typeof value.expiresAt !== "number" ||
      value.expiresAt < Date.now()
    ) {
      localStorage.removeItem(reviewStorageKey(userId));
      return null;
    }
    return value as SettlementReviewContext;
  } catch {
    localStorage.removeItem(reviewStorageKey(userId));
    return null;
  }
}

export function clearSettlementReview(userId: string) {
  localStorage.removeItem(reviewStorageKey(userId));
}
