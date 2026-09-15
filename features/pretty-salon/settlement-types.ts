import type { SalonStatus } from "@/features/pretty-salon/types";

export type SettlementHalf = 1 | 2;
export type SettlementStatus = "in_progress" | "finalized" | "reopened";
export type SettlementStep = 1 | 2 | 3 | 4 | 5;

export type SettlementActionKind =
  | "transfer"
  | "adjustment_income"
  | "adjustment_expense"
  | "missing_income"
  | "missing_expense"
  | "loan_borrow"
  | "loan_repay"
  | "salary_advance_repay"
  | "fixed_expense"
  | "salary_expense"
  | "card_payment";

export type SettlementAction = {
  id: string;
  kind: SettlementActionKind;
  label: string;
  amount: number;
  paymentMethod: string;
  financialRecordId: string;
  financialTable: string;
  createdAt: string;
};

export type SettlementFixedPayment = {
  key: "alcaldia" | "luz" | "publicidad";
  label: string;
  monthlyAmount: string;
  months: string;
  paymentMethod: string;
  registered: boolean;
};

export type SettlementDraft = {
  step: SettlementStep;
  realCashInitial: string;
  realBankInitial: string;
  realCashFinal: string;
  realBankFinal: string;
  salaryAmount: string;
  salaryAdvance: string;
  salaryPaymentMethod: string;
  fixedPayments: SettlementFixedPayment[];
  cardPaymentAmount: string;
  cardPaymentMethod: string;
  notes: string;
  actions: SettlementAction[];
};

export type SalonSettlement = {
  id: string;
  ownerId: string;
  periodMonth: string;
  periodHalf: SettlementHalf;
  accountingDate: string;
  performedOn: string;
  performedBy: string;
  status: SettlementStatus;
  appCashInitial: number;
  appBankInitial: number;
  appCashFinal: number | null;
  appBankFinal: number | null;
  draft: SettlementDraft;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SalonSettlementRow = {
  id: string;
  owner_id: string;
  period_month: string;
  period_half: SettlementHalf;
  accounting_date: string;
  performed_on: string;
  performed_by: string;
  status: SettlementStatus;
  app_cash_initial: number | string;
  app_bank_initial: number | string;
  app_cash_final: number | string | null;
  app_bank_final: number | string | null;
  draft: SettlementDraft;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
};

export type SettlementTransactionInput = {
  kind: "income" | "expense";
  actionKind: SettlementActionKind;
  concept: string;
  category: string;
  amount: number;
  paymentMethod: string;
  status?: SalonStatus;
  notes?: string;
};

export type TeamRole = "owner" | "member" | null;
