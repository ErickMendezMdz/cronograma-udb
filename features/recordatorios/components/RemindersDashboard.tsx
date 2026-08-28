"use client";

import { useState } from "react";
import { LoansDashboard } from "@/features/prestamos/components/LoansDashboard";
import { SharedPurchasesDashboard } from "@/features/recordatorios/components/SharedPurchasesDashboard";
import type { ReminderSection } from "@/features/recordatorios/types";

export function RemindersDashboard() {
  const [section, setSection] = useState<ReminderSection>("loans");

  return (
    <div>
      <nav className="grid gap-3 sm:grid-cols-2" aria-label="Secciones de Recordatorios">
        <button
          onClick={() => setSection("loans")}
          className={`rounded-2xl border p-4 text-left transition ${section === "loans" ? "border-blue-400 bg-blue-500/15" : "border-slate-700 bg-slate-900/70 hover:border-slate-500"}`}
        >
          <span className="text-sm font-semibold text-blue-200">Cosas prestadas</span>
          <span className="mt-1 block text-sm text-slate-400">Lo que prestaste, quién lo tiene y su historial.</span>
        </button>
        <button
          onClick={() => setSection("cards")}
          className={`rounded-2xl border p-4 text-left transition ${section === "cards" ? "border-emerald-400 bg-emerald-500/15" : "border-slate-700 bg-slate-900/70 hover:border-slate-500"}`}
        >
          <span className="text-sm font-semibold text-emerald-200">Compras con tarjeta de crédito</span>
          <span className="mt-1 block text-sm text-slate-400">Compras compartidas, cobros y destino del dinero.</span>
        </button>
      </nav>

      <div className="mt-6">
        {section === "loans" ? <LoansDashboard /> : <SharedPurchasesDashboard />}
      </div>
    </div>
  );
}
