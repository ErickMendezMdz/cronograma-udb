# Contexto actual de `cronograma-udb`

Fotografía comprobada contra el repositorio. El código vigente prevalece si este documento queda desactualizado.

## Identidad del proyecto

`cronograma-udb` es un portal personal privado para gestión académica, financiera y doméstica. La pantalla `/modulos` registra y presenta módulos independientes; cada uno conserva ruta, dominio, lógica e identidad visual propios, sin una navegación global que invada sus flujos.

## Stack comprobado

- Next.js 16.1.6 con App Router y React/React DOM 19.2.3.
- TypeScript 5, modo `strict`, resolución `bundler` y alias `@/*` hacia la raíz.
- Tailwind CSS 4 mediante `@tailwindcss/postcss` 4.
- Supabase JS `@supabase/supabase-js` ^2.93.3 para autenticación y datos.
- ESLint 9 con `eslint-config-next` 16.1.6 (`core-web-vitals` y TypeScript).

## Restricciones de operación

El proyecto debe seguir siendo compatible con Supabase Free y Vercel Hobby/Free. Se prefieren soluciones ligeras y no se deben asumir recursos de pago ni añadir servicios de plataforma innecesarios.

## Arquitectura actual

- `app/` define el layout y las rutas. Las cinco páginas de módulo son capas delgadas que montan `ModuleShell` y el dashboard del dominio.
- `features/<modulo>/` concentra tipos, constantes cuando aplican, componentes, un hook orquestador y un service. Los hooks gestionan sesión, estado, acciones y datos derivados.
- Los services contienen las consultas a tablas Supabase; los componentes visuales no importan el cliente global ni consultan tablas directamente.
- `lib/supabaseClient.ts` crea de forma perezosa un cliente Supabase de navegador. `lib/moduleAccess.ts` resuelve la restricción de cuentas exclusivas del salón. `lib/week.ts` y `lib/dineroTanque.ts` contienen utilidades compartidas puntuales.
- `config/modules.ts` es el registro central de los módulos visibles, sus rutas, textos, acentos y la marca `salonOnly`.

## Rutas y módulos existentes

Además de los módulos, `/` redirige a `/login`; `/login` autentica con correo/contraseña; y `/modulos` es el selector del portal.

### Cronograma

- Ruta y registro: `Cronograma`, `/cronograma`; dominio `features/cronograma/`.
- Ensamblador, hook y service: `CronogramaDashboard`, `useCronograma`, `cronogramaService.ts`.
- Tablas: `uni_subjects` y `uni_events`. No hay un archivo SQL para ellas en `supabase/`.
- Función: calendario académico semanal por materias, con actividades de uno o varios días; permite crear, editar y eliminar eventos, navegar semanas y sembrar materias iniciales si no existen.

### Dinero Tanque

- Ruta y registro: `Dinero Tanque`, `/dinero-tanque`; dominio `features/dinero-tanque/`.
- Ensamblador, hook y service: `DineroTanqueDashboard`, `useTankBudget`, `tankBudgetService.ts`.
- Tablas: `tank_budgets` y `tank_expenses`.
- Función: define un fondo, registra y elimina gastos, calcula disponible, total gastado y desglose por categoría, y muestra historial. Incluye migración única de datos heredados desde `localStorage` cuando el usuario aún no tiene datos remotos.

### Spotify Familiar

- Ruta y registro: `Spotify Familiar`, `/spotify-familiar`; dominio `features/spotify-familiar/`.
- Ensamblador, hook y service: `SpotifyFamilyDashboard`, `useSpotifyFamily`, `spotifyFamilyService.ts`.
- Tablas: `spotify_family_members` y `spotify_family_payments`.
- Función: administra miembros, cuota mensual, mes de inicio y estado activo; presenta matriz mensual, pendientes y totales; registra pagos manuales o rápidos al pendiente más antiguo y permite eliminar miembros o pagos.

### Pretty Salon

- Ruta y registro: `Pretty - Salon de belleza`, `/pretty-escritorio`; dominio `features/pretty-salon/`.
- Ensamblador, hook y service: `PrettySalonDashboard`, `usePrettySalon`, `prettySalonService.ts`.
- Tablas: `pretty_salon_transactions`, `pretty_salon_cash_transfers`, `pretty_salon_expense_payments`, `pretty_salon_loan_movements` y `pretty_salon_team_members` (esta última sostiene acceso compartido por correo mediante RLS).
- Función: panel de ingresos, gastos, caja, transferencias, pagos de gastos, préstamos, clientes, catálogo base de servicios y reportes mensuales. Gestiona movimientos pagados o pendientes y conserva migración de datos heredados desde `localStorage`.
- Identidad visual: usa su propio dashboard y navegación interna; la página pasa `chrome={false}` a `ModuleShell` para omitir el encabezado y contenedor visual estándar.

### Cosas Prestadas

- Ruta y registro: `Cosas Prestadas`, `/prestamos`; dominio `features/prestamos/`.
- Ensamblador, hook y service: `LoansDashboard`, `useLoans`, `loansService.ts`.
- Tabla: `personal_loans`.
- Función: separa préstamos activos del historial de devueltos. Las categorías son una lista cerrada e incluyen `No lo sé`; los activos sin categoría tienen vista propia y pueden reclasificarse después.
- La búsqueda cubre objeto, persona y notas. Los activos admiten filtro por categoría, edición, marcado como devuelto y eliminación; el historial permite restaurar o eliminar.
- No existe fecha esperada de devolución ni estado vencido: solo `active` y `returned`, con fecha real de devolución.
- El formulario inicia oculto y se abre con `+ Registrar préstamo`. La fecha inicial del préstamo se construye con año, mes y día locales del navegador, no mediante una conversión UTC.

## Shells y componentes compartidos

- `PortalShell` envuelve el selector `/modulos`, muestra la identidad del portal o del salón, la sesión y acciones.
- `ModuleShell` proporciona por defecto fondo, ancho, tarjeta de encabezado y enlace de regreso a `/modulos`. Con `chrome={false}` devuelve solo un `main` y el contenido; Pretty Salon usa intencionalmente esta excepción.
- `components/ui/` contiene `Badge`, `Button`, `Card` y `PageHeader`, primitivas visuales compartidas y sin acceso a datos.
- Los componentes internos de Pretty Salon son compartidos solo dentro de ese dominio; no forman parte del UI global.

## Autenticación y acceso

- El cliente de navegador usa las variables públicas de URL y clave anónima de Supabase, sin copiar sus valores a este documento.
- `/login` usa `signInWithPassword`; una sesión existente lleva a `/modulos`. La raíz también redirige a `/login`, y cerrar sesión vuelve allí.
- `/modulos` y los hooks de cada dominio consultan la sesión en el cliente y redirigen al login si falta. Cronograma, Dinero Tanque, Spotify Familiar y Préstamos redirigen las cuentas configuradas como exclusivas del salón a `/pretty-escritorio`.
- `config/modules.ts` marca Pretty Salon como `salonOnly`: una cuenta exclusiva ve solo ese módulo en el selector. Una cuenta autenticada normal puede abrir Pretty Salon.
- En general los registros llevan `owner_id` igual al id del usuario y RLS limita el acceso al propietario.
- Pretty Salon es la excepción compartida: su SQL permite a correos registrados en `pretty_salon_team_members` seleccionar, actualizar y eliminar movimientos de otros propietarios. Las inserciones siguen exigiendo que `owner_id` sea el usuario autenticado.

## Supabase y SQL

Archivos existentes, no ejecutados durante esta revisión:

- `supabase/dinero_tanque.sql`: crea `tank_budgets` y `tank_expenses`.
- `supabase/spotify_family.sql`: crea `spotify_family_members` y `spotify_family_payments`.
- `supabase/pretty_salon.sql`: crea las cinco tablas `pretty_salon_*` indicadas arriba y la función de pertenencia al equipo.
- `supabase/personal_loans.sql`: crea `personal_loans`.

Los cuatro archivos habilitan RLS y definen políticas para usuarios autenticados. Dinero Tanque, Spotify Familiar y Préstamos aplican aislamiento por `owner_id`. Pretty Salon combina propiedad con membresía compartida por correo para lectura, actualización y eliminación; su tabla de miembros solo permite a cada usuario leer su propia fila. Cronograma también escribe `owner_id` desde el código, pero su esquema y sus políticas no están documentados por un SQL del repositorio.

## Decisiones vigentes

- Portal modular con dominios y rutas independientes, sin navegación global invasiva.
- Páginas de módulo delgadas; hooks para orquestación; services para consultas de tablas; UI separada del acceso a datos.
- Registro de módulos centralizado en `config/modules.ts` y dependencias cruzadas mínimas.
- Compatibilidad prioritaria con Supabase Free y Vercel Hobby/Free.
- Pretty Salon conserva una identidad visual y navegación interna propias.
- Cosas Prestadas mantiene el historial de devueltos separado y permite reclasificar `No lo sé`.

## Pendientes operativos conocidos

No hay pendientes operativos comprobados en esta revisión.

## Guía de lectura selectiva

- Cronograma: `app/cronograma/`, `features/cronograma/` y `lib/week.ts`; revisar `config/modules.ts` solo si cambia el registro. No existe SQL local del dominio.
- Dinero Tanque: `app/dinero-tanque/`, `features/dinero-tanque/`, `lib/dineroTanque.ts` y `supabase/dinero_tanque.sql`; sumar `config/modules.ts` solo para cambios de registro.
- Spotify Familiar: `app/spotify-familiar/`, `features/spotify-familiar/` y `supabase/spotify_family.sql`; sumar `config/modules.ts` solo para cambios de registro.
- Pretty Salon: `app/pretty-escritorio/`, `features/pretty-salon/`, `supabase/pretty_salon.sql` y, para acceso, `lib/moduleAccess.ts`; sumar `config/modules.ts` solo para cambios de registro.
- Cosas Prestadas: `app/prestamos/`, `features/prestamos/` y `supabase/personal_loans.sql`; sumar `config/modules.ts` solo para cambios de registro.
- Login, selector o shells: `app/login/`, `app/modulos/`, `components/layout/`, `components/ui/`, `lib/supabaseClient.ts`, `lib/moduleAccess.ts` y `config/modules.ts` según el cambio.
