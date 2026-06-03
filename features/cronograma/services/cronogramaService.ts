import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatISODate } from "@/lib/week";
import type {
  EventDraft,
  Subject,
  UniEvent,
  UniEventRow,
} from "@/features/cronograma/types";

export async function getSubjects(supabase: SupabaseClient) {
  return supabase
    .from("uni_subjects")
    .select("id, code, name, order_index")
    .order("order_index", { ascending: true });
}

export async function getWeekEvents(
  supabase: SupabaseClient,
  monday: Date
) {
  const start = formatISODate(monday);
  const endExclusive = formatISODate(addDays(monday, 7));

  return supabase
    .from("uni_events")
    .select("id, subject_id, title, type, date, end_date, weight_percent")
    .lt("date", endExclusive)
    .gte("end_date", start);
}

export async function loadCronogramaWeek(
  supabase: SupabaseClient,
  monday: Date
) {
  const { data: subj, error: subjectsError } = await getSubjects(supabase);

  if (subjectsError) {
    return {
      subjects: null,
      events: null,
      error: subjectsError.message,
    };
  }

  const { data: ev, error: eventsError } = await getWeekEvents(
    supabase,
    monday
  );

  if (eventsError) {
    return {
      subjects: null,
      events: null,
      error: eventsError.message,
    };
  }

  const normalized = ((ev as UniEventRow[] | null) ?? []).map((item) => ({
    ...item,
    end_date: item.end_date ?? item.date,
  }));

  return {
    subjects: (subj ?? []) as Subject[],
    events: normalized as UniEvent[],
    error: null,
  };
}

export async function createCronogramaEvent(
  supabase: SupabaseClient,
  ownerId: string,
  draft: EventDraft,
  weightPercent: number | null
) {
  return supabase.from("uni_events").insert({
    owner_id: ownerId,
    subject_id: draft.subjectId,
    title: draft.title.trim(),
    type: draft.type,
    date: draft.startDate,
    end_date: draft.endDate || draft.startDate,
    weight_percent: weightPercent,
  });
}

export async function updateCronogramaEvent(
  supabase: SupabaseClient,
  eventId: string,
  draft: EventDraft,
  weightPercent: number | null
) {
  return supabase
    .from("uni_events")
    .update({
      title: draft.title.trim(),
      type: draft.type,
      date: draft.startDate,
      end_date: draft.endDate || draft.startDate,
      weight_percent: weightPercent,
    })
    .eq("id", eventId);
}

export async function deleteCronogramaEvent(
  supabase: SupabaseClient,
  eventId: string
) {
  return supabase.from("uni_events").delete().eq("id", eventId);
}

export async function seedSubjectsIfEmpty(supabase: SupabaseClient) {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("No hay sesión.");

  const { data: existing, error: e1 } = await supabase
    .from("uni_subjects")
    .select("id")
    .limit(1);

  if (e1) throw e1;
  if (existing && existing.length > 0) return { seeded: false };

  const subjects = [
    { code: "ACE", name: null, order_index: 1 },
    { code: "ACO", name: null, order_index: 2 },
    { code: "DDP", name: null, order_index: 3 },
    { code: "OFC", name: null, order_index: 4 },
    { code: "PSC", name: null, order_index: 5 },
  ].map((subject) => ({ ...subject, owner_id: user.id }));

  const { error: e2 } = await supabase.from("uni_subjects").insert(subjects);
  if (e2) throw e2;

  return { seeded: true };
}
