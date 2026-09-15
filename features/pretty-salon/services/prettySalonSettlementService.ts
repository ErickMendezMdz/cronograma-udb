import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SalonSettlement,
  SalonSettlementRow,
  SettlementDraft,
  SettlementHalf,
  SettlementStatus,
  TeamRole,
} from "@/features/pretty-salon/settlement-types";
import { normalizeSettlement } from "@/features/pretty-salon/settlement-utils";

const settlementSelect =
  "id, owner_id, period_month, period_half, accounting_date, performed_on, performed_by, status, app_cash_initial, app_bank_initial, app_cash_final, app_bank_final, draft, finalized_at, created_at, updated_at";

export async function getPrettySalonSettlements(supabase: SupabaseClient) {
  const result = await supabase
    .from("pretty_salon_settlements")
    .select(settlementSelect)
    .order("period_month", { ascending: false })
    .order("period_half", { ascending: false });

  return {
    data: ((result.data as SalonSettlementRow[] | null) ?? []).map(normalizeSettlement),
    error: result.error,
  };
}

export async function getPrettySalonTeamRole(
  supabase: SupabaseClient,
  email: string | null
): Promise<{ role: TeamRole; error: { message: string } | null }> {
  if (!email) return { role: null, error: null };

  const result = await supabase
    .from("pretty_salon_team_members")
    .select("role")
    .ilike("email", email)
    .maybeSingle();

  return {
    role: result.data?.role === "owner" ? "owner" : result.data?.role === "member" ? "member" : null,
    error: result.error,
  };
}

export async function createPrettySalonSettlement(
  supabase: SupabaseClient,
  payload: {
    owner_id: string;
    period_month: string;
    period_half: SettlementHalf;
    accounting_date: string;
    performed_on: string;
    performed_by: string;
    app_cash_initial: number;
    app_bank_initial: number;
    draft: SettlementDraft;
  }
) {
  const result = await supabase
    .from("pretty_salon_settlements")
    .insert(payload)
    .select(settlementSelect)
    .single();

  return {
    data: result.data ? normalizeSettlement(result.data as SalonSettlementRow) : null,
    error: result.error,
  };
}

export async function updatePrettySalonSettlement(
  supabase: SupabaseClient,
  id: string,
  payload: {
    performed_on?: string;
    status?: SettlementStatus;
    app_cash_final?: number | null;
    app_bank_final?: number | null;
    draft?: SettlementDraft;
    finalized_at?: string | null;
  }
) {
  const result = await supabase
    .from("pretty_salon_settlements")
    .update(payload)
    .eq("id", id)
    .select(settlementSelect)
    .single();

  return {
    data: result.data ? normalizeSettlement(result.data as SalonSettlementRow) : null,
    error: result.error,
  };
}

export async function reopenPrettySalonSettlement(
  supabase: SupabaseClient,
  settlement: SalonSettlement
) {
  return updatePrettySalonSettlement(supabase, settlement.id, {
    status: "reopened",
    finalized_at: null,
    draft: { ...settlement.draft, step: 5, realCashFinal: "", realBankFinal: "" },
  });
}

export async function deletePrettySalonSettlement(
  supabase: SupabaseClient,
  settlementId: string
) {
  return supabase.rpc("delete_pretty_salon_settlement", {
    p_settlement_id: settlementId,
  });
}
