export type AppModule = {
  id:
    | "cronograma"
    | "dinero-tanque"
    | "spotify-familiar"
    | "pretty-escritorio"
    | "prestamos";
  name: string;
  description: string;
  href: string;
  accent: "blue" | "emerald" | "green" | "salon";
  status?: string;
  salonOnly?: boolean;
};

export const appModules: AppModule[] = [
  {
    id: "cronograma",
    name: "Cronograma",
    description:
      "Gestiona materias y actividades semanales desde el calendario academico.",
    href: "/cronograma",
    accent: "blue",
    status: "Disponible",
  },
  {
    id: "dinero-tanque",
    name: "Dinero Tanque",
    description:
      "Registra compras, controla gastos y revisa el dinero disponible del proyecto.",
    href: "/dinero-tanque",
    accent: "emerald",
    status: "Disponible",
  },
  {
    id: "spotify-familiar",
    name: "Spotify Familiar",
    description:
      "Controla pagos mensuales, abonos rapidos y deudas acumuladas por miembro.",
    href: "/spotify-familiar",
    accent: "green",
    status: "Nuevo",
  },
  {
    id: "prestamos",
    name: "Cosas Prestadas",
    description: "Control rápido de cosas que has prestado",
    href: "/prestamos",
    accent: "blue",
    status: "Nuevo",
  },
  {
    id: "pretty-escritorio",
    name: "Pretty - Salon de belleza",
    description:
      "Dashboard para controlar ingresos, gastos, caja, clientes y servicios del salon.",
    href: "/pretty-escritorio",
    accent: "salon",
    status: "Nuevo",
    salonOnly: true,
  },
];
