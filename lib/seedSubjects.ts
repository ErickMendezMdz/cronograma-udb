import { supabase } from "./supabaseClient";

export async function seedSubjectsIfEmpty() {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) throw new Error("No hay sesión.");

  const { data: existing, error: e1 } = await supabase
    .from("uni_subjects")
    .select("id")
    .limit(1);

  if (e1) throw e1;

  // Si ya hay materias, no hacemos nada
  if (existing && existing.length > 0) return { seeded: false };

  const subjects = [
    { code: "ACE", name: null, order_index: 1 },
    { code: "ACO", name: null, order_index: 2 },
    { code: "DDP", name: null, order_index: 3 },
    { code: "OFC", name: null, order_index: 4 },
    { code: "PSC", name: null, order_index: 5 },
  ].map((s) => ({ ...s, owner_id: user.id }));

  const { error: e2 } = await supabase.from("uni_subjects").insert(subjects);
  if (e2) throw e2;

  return { seeded: true };
}
