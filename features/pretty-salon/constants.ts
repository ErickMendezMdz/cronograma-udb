import type { SectionId, ServiceDefinition } from "@/features/pretty-salon/types";

export const sectionItems: Array<{ id: SectionId; label: string; detail: string }> = [
  { id: "dashboard", label: "Dashboard", detail: "Vista principal" },
  { id: "ingresos", label: "Ingresos", detail: "Servicios y ventas" },
  { id: "gastos", label: "Gastos", detail: "Costos del salon" },
  { id: "caja", label: "Caja", detail: "Cobros y saldos" },
  { id: "servicios", label: "Servicios", detail: "Precios y margen" },
  { id: "clientes", label: "Clientes", detail: "Historial y deuda" },
  { id: "reportes", label: "Reportes", detail: "Meses cerrados" },
];

export const mobileNavItems: Array<{ id: SectionId; label: string }> = [
  { id: "dashboard", label: "Inicio" },
  { id: "ingresos", label: "Ingreso" },
  { id: "gastos", label: "Gasto" },
  { id: "caja", label: "Caja" },
];

export const incomeCategories = [
  "Servicios",
  "Productos",
  "Membresias",
  "Paquetes",
  "Propinas",
  "Otros ingresos",
] as const;

export const expenseCategories = [
  "Insumos",
  "Salarios",
  "Prestamo",
  "Alcaldia",
  "Servicios basicos",
  "Marketing",
  "Limpieza",
  "Equipo",
  "Otros gastos",
] as const;

export const incomePaymentMethods = ["Efectivo", "Cuenta Banco", "Credito"] as const;
export const expensePaymentMethods = ["Efectivo", "Cuenta Banco", "Tarjeta de credito"] as const;
export const cashMovementMethods = ["Efectivo", "Cuenta Banco"] as const;
export const expenseSettlementMethods = ["Efectivo", "Cuenta Banco", "Donacion"] as const;
export const collectionPaymentMethods = cashMovementMethods;

export const salonTransactionSelect =
  "id, owner_id, kind, transaction_date, concept, category, amount, payment_method, status, contact, notes, created_at";
export const salonCashTransferSelect =
  "id, owner_id, transfer_date, from_method, to_method, amount, notes, created_at";
export const salonExpensePaymentSelect =
  "id, owner_id, payment_date, payment_method, amount, notes, created_at";
export const salonLoanMovementSelect =
  "id, owner_id, movement_date, movement_type, borrower, payment_method, amount, notes, created_at";

export const serviceCatalog: ServiceDefinition[] = [
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
