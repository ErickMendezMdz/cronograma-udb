"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";
import { isSalonOnlyEmail } from "@/lib/moduleAccess";
import {
  createSpotifyMember,
  deleteSpotifyMember,
  deleteSpotifyPayment,
  loadSpotifyFamilyData,
  updateSpotifyMember,
  upsertSpotifyPayments,
} from "@/features/spotify-familiar/services/spotifyFamilyService";
import type {
  MemberDebt,
  MemberDraft,
  MonthStatus,
  NewMemberDraft,
  PaymentDraft,
  PaymentSummaryTotals,
  SpotifyMember,
  SpotifyPayment,
} from "@/features/spotify-familiar/types";

export const paymentMethods = ["Cuenta Banco", "Efectivo"] as const;

export const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

export function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function currentMonthISO() {
  return todayISO().slice(0, 7);
}

export function addMonths(month: string, amount: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + amount, 1);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function formatMonth(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function paymentKey(memberId: string, month: string) {
  return `${memberId}:${month}`;
}

export function getPaidAmount(
  paymentsByMonth: Map<string, SpotifyPayment>,
  memberId: string,
  month: string
) {
  return paymentsByMonth.get(paymentKey(memberId, month))?.amount ?? 0;
}

export function getMonthStatus(
  member: SpotifyMember,
  month: string,
  paymentsByMonth: Map<string, SpotifyPayment>
): MonthStatus {
  if (month < member.startMonth) return "inactive";

  const paid = getPaidAmount(paymentsByMonth, member.id, month);
  if (paid >= member.monthlyAmount) return "paid";
  if (paid > 0) return "partial";
  if (!member.active) return "inactive";
  if (month > currentMonthISO()) return "future";
  return "pending";
}

export function findFirstPaymentMonth(
  member: SpotifyMember,
  paymentsByMonth: Map<string, SpotifyPayment>
) {
  let month = member.startMonth;
  const limit = addMonths(currentMonthISO(), 36);

  while (month <= limit) {
    if (getPaidAmount(paymentsByMonth, member.id, month) < member.monthlyAmount) {
      return month;
    }
    month = addMonths(month, 1);
  }

  return addMonths(limit, 1);
}

export function getMemberDebt(
  member: SpotifyMember,
  paymentsByMonth: Map<string, SpotifyPayment>,
  throughMonth = currentMonthISO()
): MemberDebt {
  if (!member.active) {
    return { total: 0, pendingMonths: [] };
  }

  let total = 0;
  const pendingMonths: string[] = [];
  let month = member.startMonth;

  while (month <= throughMonth) {
    const pending = Math.max(
      member.monthlyAmount - getPaidAmount(paymentsByMonth, member.id, month),
      0
    );
    if (pending > 0) {
      total += pending;
      pendingMonths.push(month);
    }
    month = addMonths(month, 1);
  }

  return { total, pendingMonths };
}

function buildPaymentApplications(
  member: SpotifyMember,
  paymentsByMonth: Map<string, SpotifyPayment>,
  monthCount: number,
  amountPerMonth: number
) {
  const applications = new Map<string, number>();
  let remaining = Math.round(monthCount * amountPerMonth * 100) / 100;
  let month = findFirstPaymentMonth(member, paymentsByMonth);

  while (remaining > 0.001) {
    const existing = getPaidAmount(paymentsByMonth, member.id, month);
    const expected = member.monthlyAmount;
    const pending = Math.max(expected - existing, 0);
    const applied = Math.min(remaining, pending > 0 ? pending : amountPerMonth);

    applications.set(month, Math.round((existing + applied) * 100) / 100);
    remaining = Math.round((remaining - applied) * 100) / 100;
    month = addMonths(month, 1);
  }

  return applications;
}

export function useSpotifyFamily() {
  const router = useRouter();
  const memberMatrixRefs = useRef(new Map<string, HTMLElement>());
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);

  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingPaymentFor, setSavingPaymentFor] = useState<string | null>(null);
  const [savingMember, setSavingMember] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [members, setMembers] = useState<SpotifyMember[]>([]);
  const [payments, setPayments] = useState<SpotifyPayment[]>([]);
  const [newMemberDraft, setNewMemberDraft] = useState<NewMemberDraft>({
    name: "",
    monthlyAmount: "2",
    startMonth: currentMonthISO(),
  });
  const [paymentDraft, setPaymentDraft] = useState<PaymentDraft | null>(null);
  const [memberDraft, setMemberDraft] = useState<MemberDraft | null>(null);
  const [selectedYear, setSelectedYear] = useState(
    String(new Date().getFullYear())
  );

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.name.localeCompare(b.name);
    });
  }, [members]);

  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      if (a.paymentDate !== b.paymentDate) {
        return b.paymentDate.localeCompare(a.paymentDate);
      }
      if (a.billingMonth !== b.billingMonth) {
        return b.billingMonth.localeCompare(a.billingMonth);
      }
      return b.id.localeCompare(a.id);
    });
  }, [payments]);

  const paymentsByMonth = useMemo(() => {
    const grouped = new Map<string, SpotifyPayment>();

    for (const item of payments) {
      grouped.set(paymentKey(item.memberId, item.billingMonth), item);
    }

    return grouped;
  }, [payments]);

  const matrixMonths = useMemo(() => {
    return Array.from({ length: 12 }, (_, index) => `${selectedYear}-${pad(index + 1)}`);
  }, [selectedYear]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = new Set<string>([
      String(currentYear - 1),
      String(currentYear),
      String(currentYear + 1),
      ...members.map((item) => item.startMonth.slice(0, 4)),
      ...payments.map((item) => item.billingMonth.slice(0, 4)),
    ]);

    return [...years].sort((a, b) => Number(b) - Number(a));
  }, [members, payments]);

  const summaryTotals = useMemo<PaymentSummaryTotals>(() => {
    const activeMembers = members.filter((member) => member.active);
    const expected = activeMembers.reduce((sum, member) => {
      return sum + getMemberDebt(member, new Map(), currentMonthISO()).total;
    }, 0);
    const debt = activeMembers.reduce((sum, member) => {
      return sum + getMemberDebt(member, paymentsByMonth).total;
    }, 0);

    return {
      expected,
      paid: Math.max(expected - debt, 0),
      debt,
      activeMembers: activeMembers.length,
    };
  }, [members, paymentsByMonth]);

  const loadData = useCallback(
    async (currentUserId: string) => {
      if (!supabase) return;

      setLoadingData(true);
      setLoadError(null);

      const result = await loadSpotifyFamilyData(supabase, currentUserId);

      setLoadingData(false);

      if (result.error || !result.members || !result.payments) {
        setLoadError(result.error);
        return;
      }

      setMembers(result.members);
      setPayments(result.payments);
    },
    [supabase]
  );

  useEffect(() => {
    async function loadSession() {
      if (!supabase) {
        setChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (!session) {
        router.replace("/login");
        return;
      }

      if (isSalonOnlyEmail(session.user.email)) {
        router.replace("/pretty-escritorio");
        return;
      }

      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      await loadData(session.user.id);
      setChecking(false);
    }

    loadSession();
  }, [loadData, router, supabase]);

  const scrollToMemberMatrix = useCallback((memberId: string) => {
    memberMatrixRefs.current.get(memberId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  const addMember = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase || !userId) return;

      const monthlyAmount =
        Math.round(Number(newMemberDraft.monthlyAmount) * 100) / 100;
      if (!newMemberDraft.name.trim()) {
        alert("Escribe el nombre de la persona.");
        return;
      }
      if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
        alert("El monto mensual debe ser mayor que cero.");
        return;
      }

      setSavingMember(true);

      const { error } = await createSpotifyMember(
        supabase,
        userId,
        newMemberDraft,
        members.length
      );

      setSavingMember(false);

      if (error) {
        alert(error.message);
        return;
      }

      setNewMemberDraft({
        name: "",
        monthlyAmount: "2",
        startMonth: currentMonthISO(),
      });
      await loadData(userId);
    },
    [loadData, members.length, newMemberDraft, supabase, userId]
  );

  const openPaymentDraft = useCallback((member: SpotifyMember, months = 1) => {
    setPaymentDraft({
      memberId: member.id,
      months: String(months),
      amountPerMonth: String(member.monthlyAmount),
      paymentDate: todayISO(),
      paymentMethod: "Cuenta Banco",
      notes: "",
    });
  }, []);

  const openMemberDraft = useCallback((member: SpotifyMember) => {
    setMemberDraft({
      id: member.id,
      name: member.name,
      monthlyAmount: String(member.monthlyAmount),
      startMonth: member.startMonth,
      active: member.active,
    });
  }, []);

  const savePayment = useCallback(
    async (draft: PaymentDraft) => {
      if (!supabase || !userId) return;

      const member = members.find((item) => item.id === draft.memberId);
      if (!member) return;

      const months = Number(draft.months);
      const amountPerMonth =
        Math.round(Number(draft.amountPerMonth) * 100) / 100;

      if (!Number.isInteger(months) || months <= 0) {
        alert("La cantidad de meses debe ser mayor que cero.");
        return;
      }
      if (!Number.isFinite(amountPerMonth) || amountPerMonth <= 0) {
        alert("El monto por mes debe ser mayor que cero.");
        return;
      }

      const applications = buildPaymentApplications(
        member,
        paymentsByMonth,
        months,
        amountPerMonth
      );

      setSavingPaymentFor(member.id);

      const { error } = await upsertSpotifyPayments(
        supabase,
        userId,
        member.id,
        applications,
        draft,
        todayISO()
      );

      setSavingPaymentFor(null);

      if (error) {
        alert(error.message);
        return;
      }

      setPaymentDraft(null);
      await loadData(userId);
    },
    [loadData, members, paymentsByMonth, supabase, userId]
  );

  const quickPay = useCallback(
    async (member: SpotifyMember, months = 1) => {
      await savePayment({
        memberId: member.id,
        months: String(months),
        amountPerMonth: String(member.monthlyAmount),
        paymentDate: todayISO(),
        paymentMethod: "Cuenta Banco",
        notes: "",
      });
    },
    [savePayment]
  );

  const deletePayment = useCallback(
    async (paymentId: string) => {
      if (!supabase || !userId) return;

      setDeletingPaymentId(paymentId);

      const { error } = await deleteSpotifyPayment(supabase, userId, paymentId);

      setDeletingPaymentId(null);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData(userId);
    },
    [loadData, supabase, userId]
  );

  const updateMember = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!supabase || !userId || !memberDraft) return;

      const monthlyAmount =
        Math.round(Number(memberDraft.monthlyAmount) * 100) / 100;

      if (!memberDraft.name.trim()) {
        alert("Escribe el nombre de la persona.");
        return;
      }

      if (!Number.isFinite(monthlyAmount) || monthlyAmount <= 0) {
        alert("El monto mensual debe ser mayor que cero.");
        return;
      }

      setSavingMember(true);

      const { error } = await updateSpotifyMember(supabase, userId, memberDraft);

      setSavingMember(false);

      if (error) {
        alert(error.message);
        return;
      }

      setMemberDraft(null);
      await loadData(userId);
    },
    [loadData, memberDraft, supabase, userId]
  );

  const deleteMember = useCallback(
    async (member: SpotifyMember) => {
      if (!supabase || !userId) return;

      const confirmed = window.confirm(
        `Eliminar a ${member.name}? Tambien se eliminaran sus pagos registrados.`
      );

      if (!confirmed) return;

      setDeletingMemberId(member.id);

      const { error } = await deleteSpotifyMember(supabase, userId, member.id);

      setDeletingMemberId(null);

      if (error) {
        alert(error.message);
        return;
      }

      await loadData(userId);
    },
    [loadData, supabase, userId]
  );

  const handleLogout = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }, [router, supabase]);

  return {
    checking,
    supabase,
    configError,
    loadingData,
    loadError,
    savingPaymentFor,
    savingMember,
    deletingPaymentId,
    deletingMemberId,
    email,
    members,
    sortedMembers,
    payments,
    sortedPayments,
    paymentsByMonth,
    matrixMonths,
    yearOptions,
    selectedYear,
    setSelectedYear,
    newMemberDraft,
    setNewMemberDraft,
    paymentDraft,
    setPaymentDraft,
    memberDraft,
    setMemberDraft,
    memberMatrixRefs,
    summaryTotals,
    loadData,
    scrollToMemberMatrix,
    addMember,
    openPaymentDraft,
    openMemberDraft,
    savePayment,
    quickPay,
    deletePayment,
    updateMember,
    deleteMember,
    handleLogout,
  };
}
