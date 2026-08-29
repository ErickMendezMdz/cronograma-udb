import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CreditCard,
  FundAllocation,
  NewAllocationInput,
  NewCaseInput,
  NewPaymentInput,
  NewPurchaseInput,
  PurchaseShare,
  SavingsAccount,
  SharedCase,
  SharedParticipant,
  SharedPayment,
  SharedPurchase,
} from "@/features/recordatorios/types";
import { splitAmount } from "@/features/recordatorios/utils";

type Row = Record<string, unknown>;

const asNumber = (value: unknown) => Number(value ?? 0);

export async function loadReminderData(
  supabase: SupabaseClient,
  ownerId: string
) {
  const [cardsResult, accountsResult, casesResult, participantsResult, purchasesResult, sharesResult, paymentsResult, allocationsResult] =
    await Promise.all([
      supabase.from("reminder_credit_cards").select("*").eq("owner_id", ownerId).order("name"),
      supabase.from("reminder_savings_accounts").select("*").eq("owner_id", ownerId).order("name"),
      supabase.from("reminder_shared_cases").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false }),
      supabase.from("reminder_case_participants").select("*").eq("owner_id", ownerId).order("display_order"),
      supabase.from("reminder_shared_purchases").select("*").eq("owner_id", ownerId).order("purchase_date", { ascending: false }),
      supabase.from("reminder_purchase_shares").select("*").eq("owner_id", ownerId),
      supabase.from("reminder_shared_payments").select("*").eq("owner_id", ownerId).order("paid_at", { ascending: false }),
      supabase.from("reminder_fund_allocations").select("*").eq("owner_id", ownerId).order("allocated_at", { ascending: false }),
    ]);

  const error = [cardsResult, accountsResult, casesResult, participantsResult, purchasesResult, sharesResult, paymentsResult, allocationsResult]
    .find((result) => result.error)?.error;
  if (error) return { data: null, error };

  const cards: CreditCard[] = ((cardsResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    bank: String(row.bank ?? ""),
    cutDay: asNumber(row.cut_day),
    dueDay: asNumber(row.due_day),
    active: Boolean(row.active),
  }));
  const accounts: SavingsAccount[] = ((accountsResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    active: Boolean(row.active),
  }));
  const participants: Array<SharedParticipant & { caseId: string }> = ((participantsResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    caseId: String(row.case_id),
    name: String(row.name),
    isOwner: Boolean(row.is_owner),
  }));
  const shares: Array<PurchaseShare & { purchaseId: string }> = ((sharesResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    purchaseId: String(row.purchase_id),
    participantId: String(row.participant_id),
    amount: asNumber(row.amount),
  }));
  const purchases: Array<SharedPurchase & { caseId: string }> = ((purchasesResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    caseId: String(row.case_id),
    description: String(row.description),
    purchaseDate: String(row.purchase_date),
    amount: asNumber(row.amount),
    firstOpportunity: String(row.first_opportunity),
    secondOpportunity: String(row.second_opportunity),
    cardId: row.card_id ? String(row.card_id) : null,
    shares: shares.filter((share) => share.purchaseId === String(row.id)),
  }));
  const payments: Array<SharedPayment & { caseId: string }> = ((paymentsResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    caseId: String(row.case_id),
    participantId: String(row.participant_id),
    amount: asNumber(row.amount),
    paidAt: String(row.paid_at),
    method: String(row.method ?? "Transferencia"),
    notes: String(row.notes ?? ""),
  }));
  const allocations: Array<FundAllocation & { caseId: string }> = ((allocationsResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    caseId: String(row.case_id),
    paymentId: String(row.payment_id),
    amount: asNumber(row.amount),
    allocatedAt: String(row.allocated_at),
    destinationType: row.destination_type as FundAllocation["destinationType"],
    cardId: row.card_id ? String(row.card_id) : null,
    accountId: row.account_id ? String(row.account_id) : null,
    notes: String(row.notes ?? ""),
  }));
  const cases: SharedCase[] = ((casesResult.data ?? []) as Row[]).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    notes: String(row.notes ?? ""),
    status: row.status as SharedCase["status"],
    createdAt: String(row.created_at),
    participants: participants.filter((item) => item.caseId === String(row.id)),
    purchases: purchases.filter((item) => item.caseId === String(row.id)),
    payments: payments.filter((item) => item.caseId === String(row.id)),
    allocations: allocations.filter((item) => item.caseId === String(row.id)),
  }));

  return { data: { cards, accounts, cases }, error: null };
}

export async function createCard(supabase: SupabaseClient, ownerId: string, input: Omit<CreditCard, "id" | "active">) {
  return supabase.from("reminder_credit_cards").insert({
    owner_id: ownerId,
    name: input.name.trim(),
    bank: input.bank.trim(),
    cut_day: input.cutDay,
    due_day: input.dueDay,
  });
}

export async function createAccount(supabase: SupabaseClient, ownerId: string, name: string) {
  return supabase.from("reminder_savings_accounts").insert({ owner_id: ownerId, name: name.trim() });
}

export async function updateCard(
  supabase: SupabaseClient,
  ownerId: string,
  cardId: string,
  input: Omit<CreditCard, "id" | "active">
) {
  return supabase
    .from("reminder_credit_cards")
    .update({
      name: input.name.trim(),
      bank: input.bank.trim(),
      cut_day: input.cutDay,
      due_day: input.dueDay,
    })
    .eq("id", cardId)
    .eq("owner_id", ownerId);
}

async function insertPurchase(
  supabase: SupabaseClient,
  ownerId: string,
  caseId: string,
  participants: SharedParticipant[],
  input: NewPurchaseInput
) {
  const purchaseResult = await supabase
    .from("reminder_shared_purchases")
    .insert({
      owner_id: ownerId,
      case_id: caseId,
      card_id: input.cardId,
      description: input.description.trim(),
      purchase_date: input.purchaseDate,
      amount: input.amount,
      first_opportunity: input.firstOpportunity,
      second_opportunity: input.secondOpportunity,
    })
    .select("id")
    .single();
  if (purchaseResult.error) return purchaseResult;

  const shareResult = await supabase.from("reminder_purchase_shares").insert(
    splitAmount(input.amount, participants).map((share) => ({
      owner_id: ownerId,
      purchase_id: purchaseResult.data.id,
      participant_id: share.participantId,
      amount: share.amount,
    }))
  );
  if (shareResult.error) {
    await supabase.from("reminder_shared_purchases").delete().eq("id", purchaseResult.data.id).eq("owner_id", ownerId);
  }
  return shareResult;
}

export async function createSharedCase(supabase: SupabaseClient, ownerId: string, input: NewCaseInput) {
  const caseResult = await supabase
    .from("reminder_shared_cases")
    .insert({ owner_id: ownerId, title: input.title.trim(), notes: input.notes.trim() })
    .select("id")
    .single();
  if (caseResult.error) return caseResult;

  const participantResult = await supabase
    .from("reminder_case_participants")
    .insert(
      input.participantNames.map((name, index) => ({
        owner_id: ownerId,
        case_id: caseResult.data.id,
        name: name.trim(),
        is_owner: name.trim().toLocaleLowerCase("es") === "yo",
        display_order:
          name.trim().toLocaleLowerCase("es") === "yo" ? 999 : index,
      }))
    )
    .select("id, name, is_owner");
  if (participantResult.error) return participantResult;

  const participants: SharedParticipant[] = participantResult.data.map((row) => ({
    id: row.id,
    name: row.name,
    isOwner: row.is_owner,
  }));
  return insertPurchase(supabase, ownerId, caseResult.data.id, participants, input.purchase);
}

export function addPurchase(supabase: SupabaseClient, ownerId: string, sharedCase: SharedCase, input: NewPurchaseInput) {
  return insertPurchase(supabase, ownerId, sharedCase.id, sharedCase.participants, input);
}

export async function createPayment(supabase: SupabaseClient, ownerId: string, input: NewPaymentInput) {
  return supabase.from("reminder_shared_payments").insert({
    owner_id: ownerId,
    case_id: input.caseId,
    participant_id: input.participantId,
    amount: input.amount,
    paid_at: input.paidAt,
    method: input.method.trim(),
    notes: input.notes.trim(),
  });
}

export async function createAllocation(supabase: SupabaseClient, ownerId: string, input: NewAllocationInput) {
  return supabase.from("reminder_fund_allocations").insert({
    owner_id: ownerId,
    case_id: input.caseId,
    payment_id: input.paymentId,
    amount: input.amount,
    allocated_at: input.allocatedAt,
    destination_type: input.destinationType,
    card_id: input.destinationType === "card" ? input.cardId : null,
    account_id: input.destinationType === "savings" ? input.accountId : null,
    notes: input.notes.trim(),
  });
}

export async function deletePayment(
  supabase: SupabaseClient,
  ownerId: string,
  paymentId: string
) {
  return supabase
    .from("reminder_shared_payments")
    .delete()
    .eq("id", paymentId)
    .eq("owner_id", ownerId);
}

export async function deleteAllocation(
  supabase: SupabaseClient,
  ownerId: string,
  allocationId: string
) {
  return supabase
    .from("reminder_fund_allocations")
    .delete()
    .eq("id", allocationId)
    .eq("owner_id", ownerId);
}

export async function deletePurchase(
  supabase: SupabaseClient,
  ownerId: string,
  purchaseId: string
) {
  return supabase
    .from("reminder_shared_purchases")
    .delete()
    .eq("id", purchaseId)
    .eq("owner_id", ownerId);
}

export async function updatePurchaseDescription(
  supabase: SupabaseClient,
  ownerId: string,
  purchaseId: string,
  description: string
) {
  return supabase
    .from("reminder_shared_purchases")
    .update({ description: description.trim() })
    .eq("id", purchaseId)
    .eq("owner_id", ownerId);
}

export async function updateParticipantName(
  supabase: SupabaseClient,
  ownerId: string,
  participantId: string,
  name: string
) {
  return supabase
    .from("reminder_case_participants")
    .update({ name: name.trim() })
    .eq("id", participantId)
    .eq("owner_id", ownerId);
}

export async function deleteParticipant(
  supabase: SupabaseClient,
  ownerId: string,
  participantId: string
) {
  return supabase
    .from("reminder_case_participants")
    .delete()
    .eq("id", participantId)
    .eq("owner_id", ownerId)
    .eq("is_owner", false);
}

export async function closeCase(supabase: SupabaseClient, ownerId: string, caseId: string, closed: boolean) {
  return supabase
    .from("reminder_shared_cases")
    .update({ status: closed ? "closed" : "active" })
    .eq("id", caseId)
    .eq("owner_id", ownerId);
}
