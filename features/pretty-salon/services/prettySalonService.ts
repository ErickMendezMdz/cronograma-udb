import type { SupabaseClient } from "@supabase/supabase-js";
import {
  salonCashTransferSelect,
  salonExpensePaymentSelect,
  salonLoanMovementSelect,
  salonTransactionSelect,
} from "@/features/pretty-salon/constants";
import type {
  SalonCashTransferInsert,
  SalonExpensePaymentInsert,
  SalonLoanMovementInsert,
  SalonTransactionInsert,
} from "@/features/pretty-salon/types";

export async function getPrettySalonData(supabase: SupabaseClient) {
  return Promise.all([
    supabase
      .from("pretty_salon_transactions")
      .select(salonTransactionSelect)
      .order("transaction_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("pretty_salon_cash_transfers")
      .select(salonCashTransferSelect)
      .order("transfer_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("pretty_salon_expense_payments")
      .select(salonExpensePaymentSelect)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("pretty_salon_loan_movements")
      .select(salonLoanMovementSelect)
      .order("movement_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
}

export async function countPrettySalonTransactions(supabase: SupabaseClient) {
  return supabase
    .from("pretty_salon_transactions")
    .select("id", { count: "exact", head: true });
}

export async function insertPrettySalonTransactions(
  supabase: SupabaseClient,
  payload: SalonTransactionInsert[]
) {
  return supabase.from("pretty_salon_transactions").insert(payload);
}

export async function createPrettySalonTransaction(
  supabase: SupabaseClient,
  payload: SalonTransactionInsert
) {
  return supabase
    .from("pretty_salon_transactions")
    .insert(payload)
    .select(salonTransactionSelect)
    .single();
}

export async function createPrettySalonCashTransfer(
  supabase: SupabaseClient,
  payload: SalonCashTransferInsert
) {
  return supabase
    .from("pretty_salon_cash_transfers")
    .insert(payload)
    .select(salonCashTransferSelect)
    .single();
}

export async function createPrettySalonExpensePayment(
  supabase: SupabaseClient,
  payload: SalonExpensePaymentInsert
) {
  return supabase
    .from("pretty_salon_expense_payments")
    .insert(payload)
    .select(salonExpensePaymentSelect)
    .single();
}

export async function createPrettySalonLoanMovement(
  supabase: SupabaseClient,
  payload: SalonLoanMovementInsert
) {
  return supabase
    .from("pretty_salon_loan_movements")
    .insert(payload)
    .select(salonLoanMovementSelect)
    .single();
}

export async function deletePrettySalonTransaction(
  supabase: SupabaseClient,
  id: string
) {
  return supabase.from("pretty_salon_transactions").delete().eq("id", id);
}

export async function deletePrettySalonCashTransfer(
  supabase: SupabaseClient,
  id: string
) {
  return supabase.from("pretty_salon_cash_transfers").delete().eq("id", id);
}

export async function deletePrettySalonExpensePayment(
  supabase: SupabaseClient,
  id: string
) {
  return supabase.from("pretty_salon_expense_payments").delete().eq("id", id);
}

export async function deletePrettySalonLoanMovement(
  supabase: SupabaseClient,
  id: string
) {
  return supabase.from("pretty_salon_loan_movements").delete().eq("id", id);
}

export async function collectPrettySalonPendingIncome(
  supabase: SupabaseClient,
  id: string,
  paymentMethod: string,
  notes: string
) {
  return supabase
    .from("pretty_salon_transactions")
    .update({
      payment_method: paymentMethod,
      status: "paid",
      notes,
    })
    .eq("id", id)
    .select(salonTransactionSelect)
    .single();
}
