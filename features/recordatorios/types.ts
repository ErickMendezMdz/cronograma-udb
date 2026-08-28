export type ReminderSection = "loans" | "cards";

export type CreditCard = {
  id: string;
  name: string;
  bank: string;
  cutDay: number;
  dueDay: number;
  active: boolean;
};

export type SavingsAccount = {
  id: string;
  name: string;
  active: boolean;
};

export type SharedParticipant = {
  id: string;
  name: string;
  isOwner: boolean;
};

export type PurchaseShare = {
  id: string;
  participantId: string;
  amount: number;
};

export type SharedPurchase = {
  id: string;
  description: string;
  purchaseDate: string;
  amount: number;
  firstOpportunity: string;
  secondOpportunity: string;
  cardId: string | null;
  shares: PurchaseShare[];
};

export type SharedPayment = {
  id: string;
  participantId: string;
  amount: number;
  paidAt: string;
  method: string;
  notes: string;
};

export type FundAllocation = {
  id: string;
  paymentId: string;
  amount: number;
  allocatedAt: string;
  destinationType: "card" | "savings" | "other";
  cardId: string | null;
  accountId: string | null;
  notes: string;
};

export type SharedCase = {
  id: string;
  title: string;
  notes: string;
  status: "active" | "closed";
  createdAt: string;
  participants: SharedParticipant[];
  purchases: SharedPurchase[];
  payments: SharedPayment[];
  allocations: FundAllocation[];
};

export type ParticipantBalance = SharedParticipant & {
  assigned: number;
  paid: number;
  pending: number;
  status: "own" | "pending" | "partial" | "paid" | "overdue";
  firstOpportunity: string | null;
  secondOpportunity: string | null;
};

export type NewCaseInput = {
  title: string;
  notes: string;
  participantNames: string[];
  purchase: NewPurchaseInput;
};

export type NewPurchaseInput = {
  description: string;
  purchaseDate: string;
  amount: number;
  cardId: string | null;
  firstOpportunity: string;
  secondOpportunity: string;
};

export type NewPaymentInput = {
  caseId: string;
  participantId: string;
  amount: number;
  paidAt: string;
  method: string;
  notes: string;
};

export type NewAllocationInput = {
  caseId: string;
  paymentId: string;
  amount: number;
  allocatedAt: string;
  destinationType: "card" | "savings" | "other";
  cardId: string | null;
  accountId: string | null;
  notes: string;
};
