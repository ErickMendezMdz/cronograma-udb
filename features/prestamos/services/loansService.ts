import type { SupabaseClient } from "@supabase/supabase-js";
import { loanCategories } from "@/features/prestamos/constants";
import type {
  LoanCategory,
  LoanFormState,
  PersonalLoan,
  PersonalLoanRow,
} from "@/features/prestamos/types";

const loanSelect =
  "id, owner_id, item_name, borrower_name, category, loan_date, returned_at, status, notes, created_at, updated_at";

function normalizeCategory(value: string): LoanCategory {
  return loanCategories.includes(value as LoanCategory)
    ? (value as LoanCategory)
    : "No lo sé";
}

export function normalizeLoan(row: PersonalLoanRow): PersonalLoan {
  return {
    id: row.id,
    itemName: row.item_name,
    borrowerName: row.borrower_name,
    category: normalizeCategory(row.category),
    loanDate: row.loan_date,
    returnedAt: row.returned_at,
    status: row.status,
    notes: row.notes ?? "",
  };
}

export async function getLoans(supabase: SupabaseClient, ownerId: string) {
  return supabase
    .from("personal_loans")
    .select(loanSelect)
    .eq("owner_id", ownerId)
    .order("loan_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function createLoan(
  supabase: SupabaseClient,
  ownerId: string,
  data: LoanFormState
) {
  return supabase.from("personal_loans").insert({
    owner_id: ownerId,
    item_name: data.itemName.trim(),
    borrower_name: data.borrowerName.trim(),
    category: data.category,
    loan_date: data.loanDate,
    notes: data.notes.trim(),
  });
}

export async function updateLoan(
  supabase: SupabaseClient,
  id: string,
  ownerId: string,
  data: LoanFormState
) {
  return supabase
    .from("personal_loans")
    .update({
      item_name: data.itemName.trim(),
      borrower_name: data.borrowerName.trim(),
      category: data.category,
      loan_date: data.loanDate,
      notes: data.notes.trim(),
    })
    .eq("id", id)
    .eq("owner_id", ownerId);
}

export async function markLoanReturned(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
) {
  return supabase
    .from("personal_loans")
    .update({
      status: "returned",
      returned_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("owner_id", ownerId);
}

export async function restoreLoan(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
) {
  return supabase
    .from("personal_loans")
    .update({
      status: "active",
      returned_at: null,
    })
    .eq("id", id)
    .eq("owner_id", ownerId);
}

export async function deleteLoan(
  supabase: SupabaseClient,
  id: string,
  ownerId: string
) {
  return supabase
    .from("personal_loans")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);
}
