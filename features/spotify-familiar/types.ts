export type SpotifyMember = {
  id: string;
  name: string;
  monthlyAmount: number;
  startMonth: string;
  active: boolean;
  displayOrder: number;
};

export type SpotifyMemberRow = {
  id: string;
  name: string;
  monthly_amount: number | string;
  start_month: string;
  active: boolean;
  display_order: number | null;
};

export type SpotifyPayment = {
  id: string;
  memberId: string;
  billingMonth: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
};

export type SpotifyPaymentRow = {
  id: string;
  member_id: string;
  billing_month: string;
  amount: number | string;
  payment_date: string;
  payment_method: string | null;
  notes: string | null;
};

export type PaymentDraft = {
  memberId: string;
  months: string;
  amountPerMonth: string;
  paymentDate: string;
  paymentMethod: string;
  notes: string;
};

export type MemberDraft = {
  id: string;
  name: string;
  monthlyAmount: string;
  startMonth: string;
  active: boolean;
};

export type NewMemberDraft = {
  name: string;
  monthlyAmount: string;
  startMonth: string;
};

export type MemberDebt = {
  total: number;
  pendingMonths: string[];
};

export type MonthStatus = "inactive" | "paid" | "partial" | "future" | "pending";

export type PaymentSummaryTotals = {
  expected: number;
  paid: number;
  debt: number;
  activeMembers: number;
};
