import type { SupabaseClient } from "@supabase/supabase-js";
import { addDays, formatISODate } from "@/lib/week";
import type {
  EventDraft,
  Subject,
  SubjectDraft,
  UniEvent,
  UniEventRow,
} from "@/features/cronograma/types";

export async function getSubjects(
  supabase: SupabaseClient,
  ownerId: string
) {
  return supabase
    .from("uni_subjects")
    .select("id, code, name, order_index")
    .eq("owner_id", ownerId)
    .order("order_index", { ascending: true });
}

export async function getWeekEvents(
  supabase: SupabaseClient,
  ownerId: string,
  monday: Date
) {
  const start = formatISODate(monday);
  const endExclusive = formatISODate(addDays(monday, 7));

  return supabase
    .from("uni_events")
    .select("id, subject_id, title, type, date, end_date, weight_percent")
    .eq("owner_id", ownerId)
    .lt("date", endExclusive)
    .gte("end_date", start);
}

export async function loadCronogramaWeek(
  supabase: SupabaseClient,
  ownerId: string,
  monday: Date
) {
  const { data: subj, error: subjectsError } = await getSubjects(
    supabase,
    ownerId
  );

  if (subjectsError) {
    return {
      subjects: null,
      events: null,
      error: subjectsError.message,
    };
  }

  const { data: ev, error: eventsError } = await getWeekEvents(
    supabase,
    ownerId,
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
  ownerId: string,
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
    .eq("id", eventId)
    .eq("owner_id", ownerId);
}

export async function deleteCronogramaEvent(
  supabase: SupabaseClient,
  ownerId: string,
  eventId: string
) {
  return supabase
    .from("uni_events")
    .delete()
    .eq("id", eventId)
    .eq("owner_id", ownerId);
}

export async function createCronogramaSubject(
  supabase: SupabaseClient,
  ownerId: string,
  draft: SubjectDraft
) {
  return supabase.from("uni_subjects").insert({
    owner_id: ownerId,
    code: draft.code.trim().toUpperCase(),
    name: draft.name.trim() || null,
    order_index: draft.orderIndex,
  });
}

export async function updateCronogramaSubject(
  supabase: SupabaseClient,
  ownerId: string,
  subjectId: string,
  draft: SubjectDraft
) {
  return supabase
    .from("uni_subjects")
    .update({
      code: draft.code.trim().toUpperCase(),
      name: draft.name.trim() || null,
      order_index: draft.orderIndex,
    })
    .eq("id", subjectId)
    .eq("owner_id", ownerId);
}

export async function deleteCronogramaSubject(
  supabase: SupabaseClient,
  ownerId: string,
  subjectId: string
) {
  const { error: eventsError } = await supabase
    .from("uni_events")
    .delete()
    .eq("subject_id", subjectId)
    .eq("owner_id", ownerId);

  if (eventsError) return { error: eventsError };

  return supabase
    .from("uni_subjects")
    .delete()
    .eq("id", subjectId)
    .eq("owner_id", ownerId);
}

export async function clearCronograma(
  supabase: SupabaseClient,
  ownerId: string
) {
  const { error: eventsError } = await supabase
    .from("uni_events")
    .delete()
    .eq("owner_id", ownerId);

  if (eventsError) return { error: eventsError };

  return supabase
    .from("uni_subjects")
    .delete()
    .eq("owner_id", ownerId);
}
