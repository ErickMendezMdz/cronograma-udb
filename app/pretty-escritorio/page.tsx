"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getSupabaseBrowserClient,
  getSupabaseConfigError,
} from "@/lib/supabaseClient";

type SectionId =
  | "dashboard"
  | "ingresos"
  | "gastos"
  | "caja"
  | "servicios"
  | "clientes"
  | "reportes";

type TransactionKind = "income" | "expense";
type SalonStatus = "paid" | "pending";

type SalonTransaction = {
  id: string;
  kind: TransactionKind;
  date: string;
  concept: string;
  category: string;
  amount: number;
  paymentMethod: string;
  status: SalonStatus;
  contact: string;
  notes: string;
};

type SalonTransactionRow = {
  id: string;
  owner_id: string;
  kind: TransactionKind;
  transaction_date: string;
  concept: string;
  category: string | null;
  amount: number | string;
  payment_method: string | null;
  status: SalonStatus;
  contact: string | null;
  notes: string | null;
  created_at: string;
};

type SalonTransactionInsert = {
  owner_id: string;
  kind: TransactionKind;
  transaction_date: string;
  concept: string;
  category: string;
  amount: number;
  payment_method: string;
  status: SalonStatus;
  contact: string;
  notes: string;
};

type TransactionFormState = {
  date: string;
  concept: string;
  category: string;
  amount: string;
  paymentMethod: string;
  status: SalonStatus;
  contact: string;
  notes: string;
};

type BreakdownItem = {
  label: string;
  value: number;
  share: number;
  color: string;
};

const money = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

const sectionItems: Array<{ id: SectionId; label: string; detail: string }> = [
  { id: "dashboard", label: "Dashboard", detail: "Vista principal" },
  { id: "ingresos", label: "Ingresos", detail: "Servicios y ventas" },
  { id: "gastos", label: "Gastos", detail: "Costos del salon" },
  { id: "caja", label: "Caja", detail: "Cobros y saldos" },
  { id: "servicios", label: "Servicios", detail: "Precios y margen" },
  { id: "clientes", label: "Clientes", detail: "Historial y deuda" },
  { id: "reportes", label: "Reportes", detail: "Meses cerrados" },
];

const mobileNavItems: Array<{ id: SectionId; label: string }> = [
  { id: "dashboard", label: "Inicio" },
  { id: "ingresos", label: "Ingreso" },
  { id: "gastos", label: "Gasto" },
  { id: "caja", label: "Caja" },
];

const incomeCategories = [
  "Servicios",
  "Productos",
  "Membresias",
  "Paquetes",
  "Propinas",
  "Otros ingresos",
] as const;

const expenseCategories = [
  "Insumos",
  "Nomina",
  "Renta",
  "Servicios basicos",
  "Marketing",
  "Limpieza",
  "Equipo",
  "Otros gastos",
] as const;

const paymentMethods = ["Efectivo", "Tarjeta", "Transferencia", "Credito"] as const;

const salonTransactionSelect =
  "id, owner_id, kind, transaction_date, concept, category, amount, payment_method, status, contact, notes, created_at";

const serviceCatalog = [
  {
    name: "Corte y styling",
    category: "Cabello",
    duration: "45 min",
    price: 28,
    cost: 6,
    demand: "Alta",
  },
  {
    name: "Color global",
    category: "Color",
    duration: "2 h",
    price: 82,
    cost: 24,
    demand: "Media",
  },
  {
    name: "Balayage",
    category: "Color",
    duration: "3 h",
    price: 135,
    cost: 38,
    demand: "Alta",
  },
  {
    name: "Keratina",
    category: "Tratamiento",
    duration: "2 h",
    price: 95,
    cost: 30,
    demand: "Media",
  },
  {
    name: "Manicure gel",
    category: "Unas",
    duration: "1 h",
    price: 22,
    cost: 5,
    demand: "Alta",
  },
  {
    name: "Maquillaje social",
    category: "Makeup",
    duration: "1 h 15 min",
    price: 55,
    cost: 12,
    demand: "Temporada",
  },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toISODate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function todayISO() {
  return toISODate(new Date());
}

function currentMonthISO() {
  return todayISO().slice(0, 7);
}

function dateDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return toISODate(date);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDay(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("es-SV", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}-01T00:00:00`));
}

function isCreditPayment(paymentMethod: string) {
  return paymentMethod === "Credito";
}

function resolveStatusForPayment(paymentMethod: string, status: SalonStatus): SalonStatus {
  return isCreditPayment(paymentMethod) ? "pending" : status;
}

function storageKeyFor(userId: string) {
  return `pretty-salon-finance:${userId}`;
}

function defaultIncomeForm(): TransactionFormState {
  return {
    date: todayISO(),
    concept: "",
    category: "Servicios",
    amount: "",
    paymentMethod: "Efectivo",
    status: "paid",
    contact: "",
    notes: "",
  };
}

function defaultExpenseForm(): TransactionFormState {
  return {
    date: todayISO(),
    concept: "",
    category: "Insumos",
    amount: "",
    paymentMethod: "Efectivo",
    status: "paid",
    contact: "",
    notes: "",
  };
}

function isSalonTransaction(item: unknown): item is SalonTransaction {
  if (!item || typeof item !== "object") return false;

  const tx = item as Record<string, unknown>;
  return (
    (tx.kind === "income" || tx.kind === "expense") &&
    typeof tx.id === "string" &&
    typeof tx.date === "string" &&
    typeof tx.concept === "string" &&
    typeof tx.category === "string" &&
    typeof tx.amount === "number" &&
    typeof tx.paymentMethod === "string" &&
    (tx.status === "paid" || tx.status === "pending") &&
    typeof tx.contact === "string" &&
    typeof tx.notes === "string"
  );
}

function loadLegacyTransactions(userId: string) {
  const stored = localStorage.getItem(storageKeyFor(userId));
  if (!stored) return [];

  try {
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isSalonTransaction)
      .filter((item) => !item.id.startsWith("seed-"));
  } catch {
    return [];
  }
}

function clearLegacyTransactions(userId: string) {
  localStorage.removeItem(storageKeyFor(userId));
}

function normalizeTransactionRow(row: SalonTransactionRow): SalonTransaction {
  return {
    id: row.id,
    kind: row.kind,
    date: row.transaction_date,
    concept: row.concept,
    category: row.category ?? "General",
    amount: Number(row.amount),
    paymentMethod: row.payment_method ?? "Efectivo",
    status: resolveStatusForPayment(row.payment_method ?? "Efectivo", row.status),
    contact: row.contact ?? "",
    notes: row.notes ?? "",
  };
}

function toTransactionInsert(
  ownerId: string,
  item: Omit<SalonTransaction, "id">
): SalonTransactionInsert {
  return {
    owner_id: ownerId,
    kind: item.kind,
    transaction_date: item.date,
    concept: item.concept,
    category: item.category,
    amount: item.amount,
    payment_method: item.paymentMethod,
    status: resolveStatusForPayment(item.paymentMethod, item.status),
    contact: item.contact,
    notes: item.notes,
  };
}

function sumAmounts(items: SalonTransaction[]) {
  return items.reduce((total, item) => total + item.amount, 0);
}

function buildBreakdown(items: SalonTransaction[], colors: string[]): BreakdownItem[] {
  const grouped = new Map<string, number>();
  const total = sumAmounts(items);

  for (const item of items) {
    const key = item.category.trim() || "Sin categoria";
    grouped.set(key, (grouped.get(key) ?? 0) + item.amount);
  }

  return [...grouped.entries()]
    .map(([label, value], index) => ({
      label,
      value,
      share: total > 0 ? (value / total) * 100 : 0,
      color: colors[index % colors.length],
    }))
    .sort((a, b) => b.value - a.value);
}

function getStatusLabel(status: SalonStatus, kind: TransactionKind) {
  if (status === "paid") {
    return kind === "income" ? "Cobrado" : "Pagado";
  }

  return kind === "income" ? "Por cobrar" : "Por pagar";
}

function MetricCard({
  label,
  value,
  detail,
  accent,
}: {
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <article className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4 shadow-lg shadow-black/15">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-[#a9b0ba]">{label}</p>
        <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: accent }} />
      </div>
      <p className="mt-4 break-words text-2xl font-semibold text-[#f7f9fb] sm:text-3xl">{value}</p>
      <p className="mt-2 text-sm text-[#a9b0ba]">{detail}</p>
    </article>
  );
}

function SectionTitle({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-sm font-semibold text-[#00c2a8]">{label}</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#f7f9fb]">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5bf]">{description}</p>
    </div>
  );
}

function BreakdownList({
  items,
  emptyMessage,
}: {
  items: BreakdownItem[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-[#aeb5bf]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#eef2f4]">{item.label}</span>
            <span className="font-semibold text-[#f7f9fb]">{money.format(item.value)}</span>
          </div>
          <div className="mt-2 h-2 rounded-md bg-[#2a2d33]">
            <div
              className="h-full rounded-md"
              style={{ width: `${Math.max(item.share, 4)}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function TransactionTable({
  transactions,
  emptyMessage,
  onDelete,
  deletingId,
}: {
  transactions: SalonTransaction[];
  emptyMessage: string;
  onDelete: (id: string) => void | Promise<void>;
  deletingId?: string | null;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#3a3f48] p-6 text-sm text-[#aeb5bf]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {transactions.map((item) => (
          <article key={item.id} className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-[#f7f9fb]">{item.concept}</p>
                <p className="mt-1 text-xs text-[#aeb5bf]">
                  {formatDate(item.date)} · {item.category}
                </p>
              </div>
              <p
                className={[
                  "shrink-0 text-right text-lg font-semibold",
                  item.kind === "income" ? "text-[#71f2d8]" : "text-[#ff8aa1]",
                ].join(" ")}
              >
                {item.kind === "income" ? "+" : "-"}
                {money.format(item.amount)}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-md bg-[#101113] px-3 py-2">
                <p className="text-[#8f98a5]">Contacto</p>
                <p className="mt-1 truncate text-[#d8dde3]">{item.contact || "Sin contacto"}</p>
              </div>
              <div className="rounded-md bg-[#101113] px-3 py-2">
                <p className="text-[#8f98a5]">Metodo</p>
                <p className="mt-1 truncate text-[#d8dde3]">{item.paymentMethod}</p>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <span
                className={[
                  "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
                  item.status === "paid"
                    ? "bg-[#0f3b33] text-[#71f2d8]"
                    : "bg-[#403611] text-[#ffe06b]",
                ].join(" ")}
              >
                {getStatusLabel(item.status, item.kind)}
              </span>
              <button
                onClick={() => onDelete(item.id)}
                disabled={deletingId === item.id}
                className="rounded-md border border-[#454b55] px-3 py-2 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === item.id ? "Eliminando..." : "Eliminar"}
              </button>
            </div>

            {item.notes ? <p className="mt-3 text-xs leading-5 text-[#aeb5bf]">{item.notes}</p> : null}
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-[#30333a] md:block">
      <table className="min-w-[820px] w-full border-collapse text-left text-sm">
        <thead className="bg-[#111316] text-[#aeb5bf]">
          <tr>
            <th className="px-4 py-3 font-medium">Fecha</th>
            <th className="px-4 py-3 font-medium">Concepto</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 font-medium">Contacto</th>
            <th className="px-4 py-3 font-medium">Metodo</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 text-right font-medium">Monto</th>
            <th className="px-4 py-3 text-right font-medium">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#30333a] bg-[#181a1e]">
          {transactions.map((item) => (
            <tr key={item.id} className="align-top">
              <td className="px-4 py-4 text-[#d8dde3]">{formatDate(item.date)}</td>
              <td className="px-4 py-4">
                <p className="font-medium text-[#f7f9fb]">{item.concept}</p>
                {item.notes ? <p className="mt-1 text-xs text-[#aeb5bf]">{item.notes}</p> : null}
              </td>
              <td className="px-4 py-4 text-[#d8dde3]">{item.category}</td>
              <td className="px-4 py-4 text-[#d8dde3]">{item.contact || "Sin contacto"}</td>
              <td className="px-4 py-4 text-[#d8dde3]">{item.paymentMethod}</td>
              <td className="px-4 py-4">
                <span
                  className={[
                    "inline-flex rounded-md px-2 py-1 text-xs font-semibold",
                    item.status === "paid"
                      ? "bg-[#0f3b33] text-[#71f2d8]"
                      : "bg-[#403611] text-[#ffe06b]",
                  ].join(" ")}
                >
                  {getStatusLabel(item.status, item.kind)}
                </span>
              </td>
              <td
                className={[
                  "px-4 py-4 text-right font-semibold",
                  item.kind === "income" ? "text-[#71f2d8]" : "text-[#ff8aa1]",
                ].join(" ")}
              >
                {item.kind === "income" ? "+" : "-"}
                {money.format(item.amount)}
              </td>
              <td className="px-4 py-4 text-right">
                <button
                  onClick={() => onDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-md border border-[#454b55] px-3 py-1.5 text-xs font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1]"
                >
                  {deletingId === item.id ? "Eliminando..." : "Eliminar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  );
}

function TransactionForm({
  kind,
  title,
  description,
  form,
  categories,
  submitLabel,
  submitting,
  onChange,
  onSubmit,
}: {
  kind: TransactionKind;
  title: string;
  description: string;
  form: TransactionFormState;
  categories: readonly string[];
  submitLabel: string;
  submitting?: boolean;
  onChange: <K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const creditSelected = isCreditPayment(form.paymentMethod);
  const statusText =
    kind === "income"
      ? creditSelected
        ? "Credito se guarda como por cobrar."
        : "Marca por cobrar solo si aun no recibiste el dinero."
      : creditSelected
        ? "Credito se guarda como por pagar."
        : "Marca por pagar solo si aun no salio el dinero.";

  return (
    <form onSubmit={onSubmit} className="rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
      <h3 className="text-xl font-semibold text-[#f7f9fb]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#aeb5bf]">{description}</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm text-[#c7ced6]">Concepto</span>
          <input
            value={form.concept}
            onChange={(event) => onChange("concept", event.target.value)}
            placeholder={kind === "income" ? "Ej. Corte, color, manicure" : "Ej. Tintes, renta, limpieza"}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">Monto</span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={(event) => onChange("amount", event.target.value)}
            placeholder="0.00"
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">Fecha</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => onChange("date", event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">Categoria</span>
          <select
            value={form.category}
            onChange={(event) => onChange("category", event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">Metodo</span>
          <select
            value={form.paymentMethod}
            onChange={(event) => onChange("paymentMethod", event.target.value)}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          >
            {paymentMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">
            {kind === "income" ? "Estado del cobro" : "Estado del pago"}
          </span>
          <select
            value={form.status}
            onChange={(event) => onChange("status", event.target.value as SalonStatus)}
            disabled={creditSelected}
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] disabled:cursor-not-allowed disabled:opacity-70 sm:py-2 sm:text-sm"
          >
            <option value="paid">{kind === "income" ? "Cobrado" : "Pagado"}</option>
            <option value="pending">{kind === "income" ? "Por cobrar" : "Por pagar"}</option>
          </select>
          <p className={["mt-2 text-xs leading-5", creditSelected ? "text-[#ffe06b]" : "text-[#8f98a5]"].join(" ")}>
            {statusText}
          </p>
        </label>

        <label className="block">
          <span className="text-sm text-[#c7ced6]">
            {kind === "income" ? "Cliente" : "Proveedor"}
          </span>
          <input
            value={form.contact}
            onChange={(event) => onChange("contact", event.target.value)}
            placeholder="Nombre"
            className="mt-2 w-full rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>

        <label className="block sm:col-span-2">
          <span className="text-sm text-[#c7ced6]">Notas</span>
          <textarea
            value={form.notes}
            onChange={(event) => onChange("notes", event.target.value)}
            rows={3}
            placeholder="Detalle opcional"
            className="mt-2 w-full resize-none rounded-lg border border-[#3a3f48] bg-[#101113] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:py-2 sm:text-sm"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full rounded-lg bg-[#00c2a8] px-4 py-4 text-base font-semibold text-[#081210] transition hover:bg-[#27dcc4] disabled:cursor-not-allowed disabled:opacity-60 sm:py-3 sm:text-sm"
      >
        {submitting ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}

export default function PrettyEscritorioPage() {
  const router = useRouter();
  const actionAreaRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const configError = useMemo(() => getSupabaseConfigError(), []);

  const [checking, setChecking] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [migrationNotice, setMigrationNotice] = useState<string | null>(null);
  const [savingKind, setSavingKind] = useState<TransactionKind | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(currentMonthISO);
  const [transactions, setTransactions] = useState<SalonTransaction[]>([]);
  const [incomeForm, setIncomeForm] = useState<TransactionFormState>(defaultIncomeForm);
  const [expenseForm, setExpenseForm] = useState<TransactionFormState>(defaultExpenseForm);

  const loadSalonData = useCallback(
    async () => {
      if (!supabase) return false;

      setLoadingData(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("pretty_salon_transactions")
        .select(salonTransactionSelect)
        .order("transaction_date", { ascending: false })
        .order("created_at", { ascending: false });

      setLoadingData(false);

      if (error) {
        setLoadError(
          `${error.message}. Ejecuta supabase/pretty_salon.sql en tu proyecto de Supabase.`
        );
        return false;
      }

      setTransactions(
        ((data as SalonTransactionRow[] | null) ?? []).map(normalizeTransactionRow)
      );
      return true;
    },
    [supabase]
  );

  const migrateLegacyTransactions = useCallback(
    async (currentUserId: string) => {
      if (!supabase) return;

      const legacyTransactions = loadLegacyTransactions(currentUserId);
      if (legacyTransactions.length === 0) return;

      const { count, error: countError } = await supabase
        .from("pretty_salon_transactions")
        .select("id", { count: "exact", head: true });

      if (countError) {
        setMigrationNotice(
          "No pude revisar los datos remotos para migrar los registros locales."
        );
        return;
      }

      if ((count ?? 0) > 0) {
        setMigrationNotice(
          "Supabase ya tiene movimientos. Deje los registros locales en este navegador para evitar duplicados."
        );
        return;
      }

      const payload = legacyTransactions.map((item) =>
        toTransactionInsert(currentUserId, {
          kind: item.kind,
          date: item.date,
          concept: item.concept,
          category: item.category,
          amount: item.amount,
          paymentMethod: item.paymentMethod,
          status: item.status,
          contact: item.contact,
          notes: item.notes,
        })
      );

      const { error } = await supabase.from("pretty_salon_transactions").insert(payload);

      if (error) {
        setMigrationNotice(
          `No pude migrar los registros locales a Supabase: ${error.message}`
        );
        return;
      }

      clearLegacyTransactions(currentUserId);
      setMigrationNotice(
        `Migre ${legacyTransactions.length} movimiento(s) locales reales a Supabase.`
      );
    },
    [supabase]
  );

  useEffect(() => {
    let cancelled = false;

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

      setUserId(session.user.id);
      setEmail(session.user.email ?? null);
      await migrateLegacyTransactions(session.user.id);
      await loadSalonData();

      if (!cancelled) {
        setChecking(false);
      }
    }

    loadSession();

    return () => {
      cancelled = true;
    };
  }, [loadSalonData, migrateLegacyTransactions, router, supabase]);

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function scrollToActionArea() {
    window.setTimeout(() => {
      actionAreaRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }

  function scrollToTop() {
    window.setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 0);
  }

  function switchSection(section: SectionId, shouldScroll = true) {
    setActiveSection(section);

    if (!shouldScroll) return;

    if (section === "dashboard") {
      scrollToTop();
      return;
    }

    scrollToActionArea();
  }

  function updateIncomeForm<K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) {
    setIncomeForm((current) => {
      const next = { ...current, [field]: value };
      return {
        ...next,
        status: resolveStatusForPayment(next.paymentMethod, next.status),
      };
    });
  }

  function updateExpenseForm<K extends keyof TransactionFormState>(
    field: K,
    value: TransactionFormState[K]
  ) {
    setExpenseForm((current) => {
      const next = { ...current, [field]: value };
      return {
        ...next,
        status: resolveStatusForPayment(next.paymentMethod, next.status),
      };
    });
  }

  function openIncomeForm(paymentMethod = "Efectivo") {
    setIncomeForm((current) => ({
      ...current,
      paymentMethod,
      status: resolveStatusForPayment(paymentMethod, "paid"),
    }));
    switchSection("ingresos");
  }

  function openExpenseForm() {
    switchSection("gastos");
  }

  function handleMobileNavigation(section: SectionId) {
    if (section === "ingresos") {
      openIncomeForm("Efectivo");
      return;
    }

    if (section === "gastos") {
      openExpenseForm();
      return;
    }

    switchSection(section);
  }

  async function addTransaction(kind: TransactionKind, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !userId) return;

    const form = kind === "income" ? incomeForm : expenseForm;
    const amount = Number(form.amount);

    if (!form.concept.trim()) {
      alert("Agrega un concepto para guardar el movimiento.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      alert("El monto debe ser mayor que cero.");
      return;
    }

    const next: Omit<SalonTransaction, "id"> = {
      kind,
      date: form.date || todayISO(),
      concept: form.concept.trim(),
      category: form.category,
      amount: Math.round(amount * 100) / 100,
      paymentMethod: form.paymentMethod,
      status: resolveStatusForPayment(form.paymentMethod, form.status),
      contact: form.contact.trim(),
      notes: form.notes.trim(),
    };

    setSavingKind(kind);

    const { data, error } = await supabase
      .from("pretty_salon_transactions")
      .insert(toTransactionInsert(userId, next))
      .select(salonTransactionSelect)
      .single();

    setSavingKind(null);

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setTransactions((current) => [
        normalizeTransactionRow(data as SalonTransactionRow),
        ...current,
      ]);
    } else {
      await loadSalonData();
    }

    if (kind === "income") {
      setIncomeForm(defaultIncomeForm());
      setActiveSection("ingresos");
    } else {
      setExpenseForm(defaultExpenseForm());
      setActiveSection("gastos");
    }
  }

  async function deleteTransaction(id: string) {
    if (!supabase || !userId) return;

    setDeletingId(id);

    const { error } = await supabase
      .from("pretty_salon_transactions")
      .delete()
      .eq("id", id);

    setDeletingId(null);

    if (error) {
      alert(error.message);
      return;
    }

    setTransactions((current) => current.filter((item) => item.id !== id));
  }

  function startIncomeFromService(service: (typeof serviceCatalog)[number]) {
    setIncomeForm({
      ...defaultIncomeForm(),
      concept: service.name,
      category: "Servicios",
      amount: String(service.price),
      notes: `${service.duration} - costo estimado ${money.format(service.cost)}`,
    });
    openIncomeForm("Efectivo");
  }

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
  }, [transactions]);

  const monthOptions = useMemo(() => {
    return [...new Set([selectedMonth, currentMonthISO(), ...transactions.map((item) => item.date.slice(0, 7))])]
      .sort((a, b) => b.localeCompare(a));
  }, [selectedMonth, transactions]);

  const monthlyTransactions = useMemo(() => {
    return sortedTransactions.filter((item) => item.date.startsWith(selectedMonth));
  }, [selectedMonth, sortedTransactions]);

  const paidIncome = useMemo(() => {
    return sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "income" && item.status === "paid")
    );
  }, [monthlyTransactions]);

  const pendingIncome = useMemo(() => {
    return sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "income" && item.status === "pending")
    );
  }, [monthlyTransactions]);

  const paidExpenses = useMemo(() => {
    return sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "expense" && item.status === "paid")
    );
  }, [monthlyTransactions]);

  const pendingExpenses = useMemo(() => {
    return sumAmounts(
      monthlyTransactions.filter((item) => item.kind === "expense" && item.status === "pending")
    );
  }, [monthlyTransactions]);

  const netProfit = paidIncome - paidExpenses;
  const projectedProfit = paidIncome + pendingIncome - paidExpenses - pendingExpenses;
  const margin = paidIncome > 0 ? (netProfit / paidIncome) * 100 : 0;

  const incomeBreakdown = useMemo(() => {
    return buildBreakdown(
      monthlyTransactions.filter((item) => item.kind === "income" && item.status === "paid"),
      ["#00c2a8", "#70d6ff", "#f7d84a", "#b8f060", "#ff8aa1"]
    );
  }, [monthlyTransactions]);

  const expenseBreakdown = useMemo(() => {
    return buildBreakdown(
      monthlyTransactions.filter((item) => item.kind === "expense" && item.status === "paid"),
      ["#ff5f7e", "#f7d84a", "#70d6ff", "#b8f060", "#00c2a8"]
    );
  }, [monthlyTransactions]);

  const dailyTrend = useMemo(() => {
    return Array.from({ length: 10 }, (_, index) => {
      const date = dateDaysAgo(9 - index);
      const dayTransactions = transactions.filter(
        (item) => item.date === date && item.status === "paid"
      );
      const income = sumAmounts(dayTransactions.filter((item) => item.kind === "income"));
      const expense = sumAmounts(dayTransactions.filter((item) => item.kind === "expense"));

      return {
        date,
        label: formatDay(date),
        income,
        expense,
      };
    });
  }, [transactions]);

  const trendMax = Math.max(
    1,
    ...dailyTrend.flatMap((item) => [item.income, item.expense])
  );

  const paymentBreakdown = useMemo(() => {
    const grouped = new Map<string, { method: string; income: number; expense: number }>();

    for (const item of monthlyTransactions.filter((tx) => tx.status === "paid")) {
      const method = item.paymentMethod || "Otro";
      const current = grouped.get(method) ?? { method, income: 0, expense: 0 };

      if (item.kind === "income") {
        current.income += item.amount;
      } else {
        current.expense += item.amount;
      }

      grouped.set(method, current);
    }

    return [...grouped.values()]
      .map((item) => ({ ...item, balance: item.income - item.expense }))
      .sort((a, b) => b.balance - a.balance);
  }, [monthlyTransactions]);

  const clientRows = useMemo(() => {
    const grouped = new Map<
      string,
      { name: string; visits: number; paid: number; pending: number; lastDate: string }
    >();

    for (const item of transactions.filter((tx) => tx.kind === "income" && tx.contact.trim())) {
      const name = item.contact.trim();
      const current = grouped.get(name) ?? {
        name,
        visits: 0,
        paid: 0,
        pending: 0,
        lastDate: item.date,
      };

      current.visits += 1;
      current.lastDate = item.date > current.lastDate ? item.date : current.lastDate;

      if (item.status === "paid") {
        current.paid += item.amount;
      } else {
        current.pending += item.amount;
      }

      grouped.set(name, current);
    }

    return [...grouped.values()].sort((a, b) => b.lastDate.localeCompare(a.lastDate));
  }, [transactions]);

  const monthlyReports = useMemo(() => {
    return monthOptions.map((month) => {
      const items = transactions.filter((item) => item.date.startsWith(month));
      const income = sumAmounts(
        items.filter((item) => item.kind === "income" && item.status === "paid")
      );
      const expenses = sumAmounts(
        items.filter((item) => item.kind === "expense" && item.status === "paid")
      );
      const pending = sumAmounts(items.filter((item) => item.status === "pending"));
      const profit = income - expenses;

      return {
        month,
        income,
        expenses,
        pending,
        profit,
        margin: income > 0 ? (profit / income) * 100 : 0,
      };
    });
  }, [monthOptions, transactions]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101113] text-[#f7f9fb]">
        Cargando...
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#101113] p-4">
        <div className="w-full max-w-lg rounded-lg border border-[#ff5f7e] bg-[#181a1e] p-6 text-[#f7f9fb] shadow-2xl shadow-black/30">
          <h1 className="text-xl font-semibold">Configuracion incompleta</h1>
          <p className="mt-2 text-sm text-[#aeb5bf]">
            {configError ?? "Faltan las variables publicas de Supabase."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#101113] text-[#f7f9fb]">
      <div className="mx-auto grid min-h-screen w-full max-w-[1500px] min-w-0 lg:grid-cols-[292px_minmax(0,1fr)]">
        <aside className="min-w-0 border-b border-[#30333a] bg-[#15171a] p-4 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex items-start justify-between gap-4 lg:block">
            <div className="min-w-0">
              <p className="text-2xl font-semibold leading-tight text-[#f7f9fb]">Pretty Salon</p>
              <p className="mt-1 text-sm text-[#aeb5bf]">Control de ingresos y gastos</p>
            </div>
            <Link
              href="/modulos"
              className="shrink-0 rounded-lg border border-[#3a3f48] px-3 py-2 text-sm font-semibold text-[#d8dde3] transition hover:border-[#00c2a8] hover:text-[#71f2d8]"
            >
              Modulos
            </Link>
          </div>

          <div
            role="img"
            aria-label="Interior de salon de belleza"
            className="mt-5 hidden h-36 rounded-lg border border-[#30333a] bg-cover bg-center sm:block"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(16,17,19,0.05), rgba(16,17,19,0.65)), url('https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80')",
            }}
          />

          <nav className="mt-5 hidden gap-2 lg:grid">
            {sectionItems.map((item) => {
              const isActive = activeSection === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={[
                    "min-w-[128px] rounded-lg border px-3 py-3 text-left transition lg:min-w-0",
                    isActive
                      ? "border-[#00c2a8] bg-[#0f312e] text-[#f7f9fb]"
                      : "border-[#30333a] bg-[#181a1e] text-[#d8dde3] hover:border-[#70d6ff]",
                  ].join(" ")}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className="mt-1 block text-xs text-[#aeb5bf]">{item.detail}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-5 hidden rounded-lg border border-[#30333a] bg-[#181a1e] p-4 lg:block">
            <p className="text-sm font-semibold text-[#f7f9fb]">Sesion activa</p>
            <p className="mt-1 break-all text-sm text-[#aeb5bf]">{email ?? "Administracion"}</p>
            <button
              onClick={handleLogout}
              className="mt-4 w-full rounded-lg border border-[#454b55] px-3 py-2 text-sm font-semibold text-[#d8dde3] transition hover:border-[#ff5f7e] hover:text-[#ff8aa1]"
            >
              Salir
            </button>
          </div>
        </aside>

        <main className="min-w-0 pb-28 pl-4 pr-4 pt-4 sm:p-6 sm:pb-28 lg:p-8">
          <header className="flex min-w-0 flex-col gap-4 border-b border-[#30333a] pb-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#00c2a8]">Pretty Salon de belleza</p>
              <h1 className="mt-2 max-w-full text-3xl font-semibold leading-tight text-[#f7f9fb] sm:text-5xl">
                Dashboard financiero
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-[#aeb5bf]">
                Registra servicios, productos, insumos y pagos pendientes.
              </p>
            </div>

            <div className="grid min-w-0 gap-3 sm:flex sm:items-center">
              <label className="block min-w-0">
                <span className="text-sm text-[#aeb5bf]">Mes de trabajo</span>
                <select
                  value={selectedMonth}
                  onChange={(event) => setSelectedMonth(event.target.value)}
                  className="mt-2 w-full max-w-full rounded-lg border border-[#3a3f48] bg-[#181a1e] px-3 py-3 text-base text-[#f7f9fb] outline-none transition focus:border-[#00c2a8] sm:w-56 sm:py-2 sm:text-sm"
                >
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>
                      {formatMonth(month)}
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid grid-cols-3 gap-2 sm:mt-7 sm:flex">
                <button
                  onClick={() => openIncomeForm("Efectivo")}
                  className="min-w-0 rounded-lg bg-[#00c2a8] px-3 py-3 text-sm font-semibold text-[#081210] transition hover:bg-[#27dcc4] sm:px-4"
                >
                  Ingreso
                </button>
                <button
                  onClick={() => openIncomeForm("Credito")}
                  className="min-w-0 rounded-lg border border-[#f7d84a] px-3 py-3 text-sm font-semibold text-[#ffe06b] transition hover:bg-[#302a12] sm:px-4"
                >
                  Credito
                </button>
                <button
                  onClick={openExpenseForm}
                  className="min-w-0 rounded-lg border border-[#ff5f7e] px-3 py-3 text-sm font-semibold text-[#ff8aa1] transition hover:bg-[#321820] sm:px-4"
                >
                  Gasto
                </button>
              </div>
            </div>
          </header>

          {loadingData ? (
            <div className="mt-5 rounded-lg border border-[#30333a] bg-[#181a1e] px-4 py-3 text-sm text-[#aeb5bf]">
              Sincronizando movimientos con Supabase...
            </div>
          ) : null}

          {loadError ? (
            <div className="mt-5 rounded-lg border border-[#ff5f7e] bg-[#321820] p-4 text-sm text-[#ffd4dd]">
              <p className="font-semibold text-[#fff2f5]">No se pudieron cargar los datos.</p>
              <p className="mt-1">{loadError}</p>
              <button
                onClick={() => {
                  if (userId) void loadSalonData();
                }}
                className="mt-3 rounded-lg border border-[#ff8aa1] px-3 py-2 text-xs font-semibold text-[#ffd4dd] transition hover:bg-[#49212b]"
              >
                Reintentar
              </button>
            </div>
          ) : null}

          {migrationNotice ? (
            <div className="mt-5 rounded-lg border border-[#f7d84a] bg-[#2e2912] px-4 py-3 text-sm text-[#fff1a6]">
              {migrationNotice}
            </div>
          ) : null}

          <section className="mt-6 grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Ingresos cobrados"
              value={money.format(paidIncome)}
              detail={`${money.format(pendingIncome)} por cobrar`}
              accent="#00c2a8"
            />
            <MetricCard
              label="Gastos pagados"
              value={money.format(paidExpenses)}
              detail={`${money.format(pendingExpenses)} por pagar`}
              accent="#ff5f7e"
            />
            <MetricCard
              label="Utilidad real"
              value={money.format(netProfit)}
              detail={`${margin.toFixed(1)}% de margen`}
              accent="#f7d84a"
            />
            <MetricCard
              label="Proyeccion"
              value={money.format(projectedProfit)}
              detail="Incluye pendientes"
              accent="#70d6ff"
            />
          </section>

          <div ref={actionAreaRef} className="scroll-mt-4" />

          {activeSection === "dashboard" ? (
            <>
              <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Vista principal"
                    title="Ingresos contra gastos"
                    description="Comparativo de los ultimos dias con movimientos pagados."
                  />

                  <div className="mt-6 flex h-44 min-w-0 items-end gap-1 border-b border-[#30333a] px-1 pb-3 sm:h-64 sm:gap-2">
                    {dailyTrend.map((item) => {
                      const incomeHeight = item.income > 0 ? Math.max((item.income / trendMax) * 100, 6) : 0;
                      const expenseHeight = item.expense > 0 ? Math.max((item.expense / trendMax) * 100, 6) : 0;

                      return (
                        <div key={item.date} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                          <div className="flex h-32 w-full items-end justify-center gap-1 sm:h-48">
                            <div
                              title={`Ingresos ${money.format(item.income)}`}
                              className="w-3 rounded-sm bg-[#00c2a8]"
                              style={{ height: `${incomeHeight}%` }}
                            />
                            <div
                              title={`Gastos ${money.format(item.expense)}`}
                              className="w-3 rounded-sm bg-[#ff5f7e]"
                              style={{ height: `${expenseHeight}%` }}
                            />
                          </div>
                          <span className="truncate text-xs text-[#aeb5bf]">{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#c7ced6]">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-[#00c2a8]" />
                      Ingresos
                    </span>
                    <span className="inline-flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm bg-[#ff5f7e]" />
                      Gastos
                    </span>
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Accesos"
                    title="Siguiente accion"
                    description="Elige la opcion que necesitas mover ahora."
                  />
                  <div className="mt-5 grid gap-3">
                    <button
                      onClick={() => openIncomeForm("Efectivo")}
                      className="rounded-lg border border-[#3a3f48] bg-[#101113] px-4 py-3 text-left transition hover:border-[#70d6ff]"
                    >
                      <span className="block text-sm font-semibold text-[#f7f9fb]">Ingreso cobrado</span>
                      <span className="mt-1 block text-xs text-[#aeb5bf]">
                        Efectivo, tarjeta o transferencia
                      </span>
                    </button>
                    <button
                      onClick={() => openIncomeForm("Credito")}
                      className="rounded-lg border border-[#3a3f48] bg-[#101113] px-4 py-3 text-left transition hover:border-[#70d6ff]"
                    >
                      <span className="block text-sm font-semibold text-[#f7f9fb]">Venta al credito</span>
                      <span className="mt-1 block text-xs text-[#aeb5bf]">Queda como por cobrar</span>
                    </button>
                    <button
                      onClick={openExpenseForm}
                      className="rounded-lg border border-[#3a3f48] bg-[#101113] px-4 py-3 text-left transition hover:border-[#70d6ff]"
                    >
                      <span className="block text-sm font-semibold text-[#f7f9fb]">Registrar gasto</span>
                      <span className="mt-1 block text-xs text-[#aeb5bf]">
                        Insumos, renta, nomina o equipo
                      </span>
                    </button>
                    <button
                      onClick={() => switchSection("caja")}
                      className="rounded-lg border border-[#3a3f48] bg-[#101113] px-4 py-3 text-left transition hover:border-[#70d6ff]"
                    >
                      <span className="block text-sm font-semibold text-[#f7f9fb]">Revisar caja</span>
                      <span className="mt-1 block text-xs text-[#aeb5bf]">
                        Saldo por metodo de pago
                      </span>
                    </button>
                  </div>
                </div>
              </section>

              <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-2">
                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Ingresos"
                    title="Fuentes del mes"
                    description="Lo que mas esta aportando al salon."
                  />
                  <div className="mt-5">
                    <BreakdownList
                      items={incomeBreakdown}
                      emptyMessage="Aun no hay ingresos cobrados en este mes."
                    />
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                  <SectionTitle
                    label="Gastos"
                    title="Costos principales"
                    description="Categorias que estan consumiendo caja."
                  />
                  <div className="mt-5">
                    <BreakdownList
                      items={expenseBreakdown}
                      emptyMessage="Aun no hay gastos pagados en este mes."
                    />
                  </div>
                </div>
              </section>

              <section className="mt-6 min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <SectionTitle
                    label="Movimientos"
                    title="Actividad reciente"
                    description="Ultimos registros creados para el salon."
                  />
                  <button
                    onClick={() => switchSection("reportes")}
                    className="rounded-lg border border-[#3a3f48] px-4 py-2 text-sm font-semibold text-[#d8dde3] transition hover:border-[#70d6ff]"
                  >
                    Ver reportes
                  </button>
                </div>
                <div className="mt-5">
                  <TransactionTable
                    transactions={sortedTransactions.slice(0, 6)}
                    emptyMessage="Todavia no hay movimientos."
                    onDelete={deleteTransaction}
                    deletingId={deletingId}
                  />
                </div>
              </section>
            </>
          ) : null}

          {activeSection === "ingresos" ? (
            <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
              <TransactionForm
                kind="income"
                title="Registrar ingreso"
                description="Guarda cobros de servicios, ventas de producto, membresias, paquetes o propinas."
                form={incomeForm}
                categories={incomeCategories}
                submitLabel="Guardar ingreso"
                submitting={savingKind === "income"}
                onChange={updateIncomeForm}
                onSubmit={(event) => addTransaction("income", event)}
              />
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Ingresos"
                  title="Historial de cobros"
                  description="Movimientos positivos del salon, pagados o pendientes."
                />
                <div className="mt-5">
                  <TransactionTable
                    transactions={sortedTransactions.filter((item) => item.kind === "income")}
                    emptyMessage="No hay ingresos registrados."
                    onDelete={deleteTransaction}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "gastos" ? (
            <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[420px_minmax(0,1fr)]">
              <TransactionForm
                kind="expense"
                title="Registrar gasto"
                description="Controla insumos, nomina, renta, servicios basicos, marketing, limpieza y equipo."
                form={expenseForm}
                categories={expenseCategories}
                submitLabel="Guardar gasto"
                submitting={savingKind === "expense"}
                onChange={updateExpenseForm}
                onSubmit={(event) => addTransaction("expense", event)}
              />
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Gastos"
                  title="Historial de pagos"
                  description="Costos operativos del salon, pagados o pendientes."
                />
                <div className="mt-5">
                  <TransactionTable
                    transactions={sortedTransactions.filter((item) => item.kind === "expense")}
                    emptyMessage="No hay gastos registrados."
                    onDelete={deleteTransaction}
                    deletingId={deletingId}
                  />
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "caja" ? (
            <section className="mt-6 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Caja"
                  title="Saldo por metodo de pago"
                  description="Ingresos menos gastos pagados durante el mes seleccionado."
                />
                <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                  <table className="min-w-[640px] w-full text-left text-sm">
                    <thead className="bg-[#111316] text-[#aeb5bf]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Metodo</th>
                        <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                        <th className="px-4 py-3 text-right font-medium">Gastos</th>
                        <th className="px-4 py-3 text-right font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30333a]">
                      {paymentBreakdown.map((item) => (
                        <tr key={item.method}>
                          <td className="px-4 py-4 text-[#f7f9fb]">{item.method}</td>
                          <td className="px-4 py-4 text-right text-[#71f2d8]">
                            {money.format(item.income)}
                          </td>
                          <td className="px-4 py-4 text-right text-[#ff8aa1]">
                            {money.format(item.expense)}
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-[#f7f9fb]">
                            {money.format(item.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Cierre"
                  title="Resumen de caja"
                  description="Lo esencial para revisar antes de cerrar el dia."
                />
                <div className="mt-5 space-y-4 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                    <span className="text-[#aeb5bf]">Saldo real</span>
                    <span className="font-semibold text-[#f7f9fb]">{money.format(netProfit)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                    <span className="text-[#aeb5bf]">Por cobrar</span>
                    <span className="font-semibold text-[#ffe06b]">{money.format(pendingIncome)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 border-b border-[#30333a] pb-3">
                    <span className="text-[#aeb5bf]">Pagado</span>
                    <span className="font-semibold text-[#ff8aa1]">{money.format(paidExpenses)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[#aeb5bf]">Saldo proyectado</span>
                    <span className="font-semibold text-[#70d6ff]">
                      {money.format(projectedProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "servicios" ? (
            <section className="mt-6">
              <div className="min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
                <SectionTitle
                  label="Servicios"
                  title="Catalogo base"
                  description="Precios de referencia con costo estimado para entender margen antes de vender."
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {serviceCatalog.map((service) => {
                    const profit = service.price - service.cost;
                    const serviceMargin = service.price > 0 ? (profit / service.price) * 100 : 0;

                    return (
                      <article
                        key={service.name}
                        className="rounded-lg border border-[#30333a] bg-[#101113] p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-[#f7f9fb]">{service.name}</p>
                            <p className="mt-1 text-sm text-[#aeb5bf]">
                              {service.category} - {service.duration}
                            </p>
                          </div>
                          <span className="rounded-md bg-[#24352f] px-2 py-1 text-xs font-semibold text-[#71f2d8]">
                            {service.demand}
                          </span>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-[#aeb5bf]">Precio</p>
                            <p className="mt-1 font-semibold text-[#f7f9fb]">
                              {money.format(service.price)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#aeb5bf]">Costo</p>
                            <p className="mt-1 font-semibold text-[#ff8aa1]">
                              {money.format(service.cost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[#aeb5bf]">Margen</p>
                            <p className="mt-1 font-semibold text-[#f7d84a]">
                              {serviceMargin.toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => startIncomeFromService(service)}
                          className="mt-5 w-full rounded-lg border border-[#00c2a8] px-3 py-2 text-sm font-semibold text-[#71f2d8] transition hover:bg-[#0f312e]"
                        >
                          Registrar venta
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          ) : null}

          {activeSection === "clientes" ? (
            <section className="mt-6 min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
              <SectionTitle
                label="Clientes"
                title="Historial financiero"
                description="Clientes generados a partir de los ingresos registrados."
              />
              <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                <table className="min-w-[720px] w-full text-left text-sm">
                  <thead className="bg-[#111316] text-[#aeb5bf]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Cliente</th>
                      <th className="px-4 py-3 text-right font-medium">Visitas</th>
                      <th className="px-4 py-3 text-right font-medium">Pagado</th>
                      <th className="px-4 py-3 text-right font-medium">Pendiente</th>
                      <th className="px-4 py-3 text-right font-medium">Ultima visita</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30333a]">
                    {clientRows.map((client) => (
                      <tr key={client.name}>
                        <td className="px-4 py-4 font-medium text-[#f7f9fb]">{client.name}</td>
                        <td className="px-4 py-4 text-right text-[#d8dde3]">{client.visits}</td>
                        <td className="px-4 py-4 text-right text-[#71f2d8]">
                          {money.format(client.paid)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#ffe06b]">
                          {money.format(client.pending)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#d8dde3]">
                          {formatDate(client.lastDate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          {activeSection === "reportes" ? (
            <section className="mt-6 min-w-0 rounded-lg border border-[#30333a] bg-[#181a1e] p-4">
              <SectionTitle
                label="Reportes"
                title="Resumen mensual"
                description="Lectura rapida de ingresos, gastos, pendientes y margen por mes."
              />
              <div className="mt-5 overflow-x-auto rounded-lg border border-[#30333a]">
                <table className="min-w-[760px] w-full text-left text-sm">
                  <thead className="bg-[#111316] text-[#aeb5bf]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Mes</th>
                      <th className="px-4 py-3 text-right font-medium">Ingresos</th>
                      <th className="px-4 py-3 text-right font-medium">Gastos</th>
                      <th className="px-4 py-3 text-right font-medium">Utilidad</th>
                      <th className="px-4 py-3 text-right font-medium">Pendientes</th>
                      <th className="px-4 py-3 text-right font-medium">Margen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#30333a]">
                    {monthlyReports.map((report) => (
                      <tr key={report.month}>
                        <td className="px-4 py-4 font-medium text-[#f7f9fb]">
                          {formatMonth(report.month)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#71f2d8]">
                          {money.format(report.income)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#ff8aa1]">
                          {money.format(report.expenses)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#f7f9fb]">
                          {money.format(report.profit)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#ffe06b]">
                          {money.format(report.pending)}
                        </td>
                        <td className="px-4 py-4 text-right text-[#70d6ff]">
                          {report.margin.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[#30333a] bg-[#15171a]/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_30px_rgba(0,0,0,0.35)] backdrop-blur lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
          {mobileNavItems.map((item) => {
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMobileNavigation(item.id)}
                className={[
                  "rounded-lg border px-2 py-2.5 text-xs font-semibold transition",
                  isActive
                    ? "border-[#00c2a8] bg-[#0f312e] text-[#71f2d8]"
                    : "border-[#30333a] bg-[#181a1e] text-[#c7ced6]",
                ].join(" ")}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
