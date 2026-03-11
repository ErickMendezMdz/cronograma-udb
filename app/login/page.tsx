"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setMsg(configError ?? "Falta configurar Supabase.");
      return;
    }

    setLoading(true);
    setMsg(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/cronograma");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-transparent">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700/70 bg-slate-900/85 shadow-2xl shadow-black/30 backdrop-blur p-6 text-slate-100">
        <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
        <p className="text-sm text-slate-400 mt-1">
          Entrá para ver tu cronograma semanal.
        </p>

        {configError && (
          <div className="mt-4 text-sm text-red-200 bg-red-950/60 border border-red-900 rounded-xl p-3">
            {configError}
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200">Correo</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-200">Contraseña</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950/80 p-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
          </div>

          {msg && (
            <div className="text-sm text-red-200 bg-red-950/60 border border-red-900 rounded-xl p-3">
              {msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !supabase}
            className="w-full rounded-xl bg-blue-500 text-slate-950 py-3 font-semibold disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
