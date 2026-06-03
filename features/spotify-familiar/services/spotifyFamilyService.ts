import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  MemberDraft,
  NewMemberDraft,
  PaymentDraft,
  SpotifyMember,
  SpotifyMemberRow,
  SpotifyPayment,
  SpotifyPaymentRow,
} from "@/features/spotify-familiar/types";

const memberSelect =
  "id, name, monthly_amount, start_month, active, display_order";
const paymentSelect =
  "id, member_id, billing_month, amount, payment_date, payment_method, notes";

export function normalizeMember(row: SpotifyMemberRow): SpotifyMember {
  return {
    id: row.id,
    name: row.name,
    monthlyAmount: Number(row.monthly_amount),
    startMonth: row.start_month,
    active: row.active,
    displayOrder: row.display_order ?? 0,
  };
}

export function normalizePayment(row: SpotifyPaymentRow): SpotifyPayment {
  return {
    id: row.id,
    memberId: row.member_id,
    billingMonth: row.billing_month,
    amount: Number(row.amount),
    paymentDate: row.payment_date,
    paymentMethod: row.payment_method ?? "Cuenta Banco",
    notes: row.notes ?? "",
  };
}

export async function getSpotifyMembers(
  supabase: SupabaseClient,
  ownerId: string
) {
  return supabase
    .from("spotify_family_members")
    .select(memberSelect)
    .eq("owner_id", ownerId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });
}

export async function getSpotifyPayments(
  supabase: SupabaseClient,
  ownerId: string
) {
  return supabase
    .from("spotify_family_payments")
    .select(paymentSelect)
    .eq("owner_id", ownerId)
    .order("payment_date", { ascending: false })
    .order("created_at", { ascending: false });
}

export async function loadSpotifyFamilyData(
  supabase: SupabaseClient,
  ownerId: string
) {
  const [membersResult, paymentsResult] = await Promise.all([
    getSpotifyMembers(supabase, ownerId),
    getSpotifyPayments(supabase, ownerId),
  ]);

  if (membersResult.error || paymentsResult.error) {
    const error = membersResult.error ?? paymentsResult.error;
    return {
      members: null,
      payments: null,
      error: `${error?.message ?? "No pude cargar Spotify Familiar"}. Ejecuta supabase/spotify_family.sql en Supabase.`,
    };
  }

  return {
    members: ((membersResult.data as SpotifyMemberRow[] | null) ?? []).map(
      normalizeMember
    ),
    payments: ((paymentsResult.data as SpotifyPaymentRow[] | null) ?? []).map(
      normalizePayment
    ),
    error: null,
  };
}

export async function createSpotifyMember(
  supabase: SupabaseClient,
  ownerId: string,
  draft: NewMemberDraft,
  displayOrder: number
) {
  const monthlyAmount = Math.round(Number(draft.monthlyAmount) * 100) / 100;

  return supabase.from("spotify_family_members").insert({
    owner_id: ownerId,
    name: draft.name.trim(),
    monthly_amount: monthlyAmount,
    start_month: draft.startMonth,
    display_order: displayOrder,
  });
}

export async function updateSpotifyMember(
  supabase: SupabaseClient,
  ownerId: string,
  draft: MemberDraft
) {
  const monthlyAmount = Math.round(Number(draft.monthlyAmount) * 100) / 100;

  return supabase
    .from("spotify_family_members")
    .update({
      name: draft.name.trim(),
      monthly_amount: monthlyAmount,
      start_month: draft.startMonth,
      active: draft.active,
    })
    .eq("id", draft.id)
    .eq("owner_id", ownerId);
}

export async function deleteSpotifyMember(
  supabase: SupabaseClient,
  ownerId: string,
  memberId: string
) {
  return supabase
    .from("spotify_family_members")
    .delete()
    .eq("id", memberId)
    .eq("owner_id", ownerId);
}

export async function upsertSpotifyPayments(
  supabase: SupabaseClient,
  ownerId: string,
  memberId: string,
  applications: Map<string, number>,
  draft: PaymentDraft,
  fallbackPaymentDate: string
) {
  return supabase.from("spotify_family_payments").upsert(
    [...applications.entries()].map(([billingMonth, amount]) => ({
      owner_id: ownerId,
      member_id: memberId,
      billing_month: billingMonth,
      amount,
      payment_date: draft.paymentDate || fallbackPaymentDate,
      payment_method: draft.paymentMethod,
      notes: draft.notes.trim(),
    })),
    { onConflict: "member_id,billing_month" }
  );
}

export async function deleteSpotifyPayment(
  supabase: SupabaseClient,
  ownerId: string,
  paymentId: string
) {
  return supabase
    .from("spotify_family_payments")
    .delete()
    .eq("id", paymentId)
    .eq("owner_id", ownerId);
}
