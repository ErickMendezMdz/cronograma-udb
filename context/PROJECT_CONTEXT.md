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
- Función: calendario académico semanal por materias, con actividades de uno o varios días; permite crear, editar y eliminar eventos y navegar semanas.
- La opción `Gestionar materias` permite crear, editar y ordenar materias. Eliminar una materia borra también sus actividades, y `Limpiar todo el cronograma` elimina todas las materias y actividades del usuario tras confirmación. No conserva ciclos ni historial y ya no existe una lista fija de materias iniciales.

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

### Recordatorios

- Ruta y registro: `Recordatorios`, `/prestamos`; dominios `features/recordatorios/` y `features/prestamos/`.
- Presenta dos vertientes independientes: `Cosas prestadas`, que conserva el comportamiento anterior, y `Compras con tarjeta de crédito` para compras compartidas.
- Cosas prestadas usa `LoansDashboard`, `useLoans`, `loansService.ts` y la tabla `personal_loans`. Separa préstamos activos del historial de devueltos. Las categorías son una lista cerrada e incluyen `No lo sé`; los activos sin categoría tienen vista propia y pueden reclasificarse después.
- La búsqueda cubre objeto, persona y notas. Los activos admiten filtro por categoría, edición, marcado como devuelto y eliminación; el historial permite restaurar o eliminar.
- No existe fecha esperada de devolución ni estado vencido: solo `active` y `returned`, con fecha real de devolución.
- El formulario inicia oculto y se abre con `+ Registrar préstamo`. La fecha inicial del préstamo se construye con año, mes y día locales del navegador, no mediante una conversión UTC.
- Compras con tarjeta usa `SharedPurchasesDashboard`, `useSharedPurchases` y `remindersService.ts`. Organiza cada causa como un caso con participantes editables y varias compras; una compra nueva recalcula lo asignado sin eliminar pagos anteriores.
- Cada compra conserva tarjeta, fecha, monto y dos oportunidades completas de pago (normalmente 15 y 30); no divide el aporte entre esas fechas. Los pagos se acumulan por persona y producen estados pendiente, parcial, pagado o vencido.
- Los aportes se redondean hacia arriba al centavo para que todos paguen exactamente lo mismo; cualquier diferencia mínima queda identificada como ajuste de redondeo. El participante `Yo` representa la parte propia y se muestra al final.
- Registra tarjetas por nombre, banco y días de corte/pago, y cuentas de ahorro únicamente por nombre. El dinero recibido permanece sin destinar hasta registrarlo como abono a tarjeta, ahorro u otro uso.
- La vista para captura muestra el resumen grupal de un caso, oculta la información financiera privada y permite destacar opcionalmente a una persona sin ocultar a las demás.
- El detalle del caso permite eliminar compras, transferencias y destinos con confirmación. Eliminar una transferencia elimina también sus destinos vinculados; los saldos se recalculan después de cada eliminación.
- Las tarjetas pueden editarse desde la configuración y la descripción de cada compra desde el caso. En la captura, el detalle identifica primero la tarjeta acreedora y conserva debajo el motivo y la fecha de la compra.
- Los nombres de los participantes pueden editarse dentro del caso. Un hermano puede quitarse con confirmación; se eliminan sus pagos y destinos asociados y los aportes se redistribuyen entre los participantes restantes. La parte propia no puede eliminarse.

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
- `supabase/recordatorios_compras.sql`: crea las ocho tablas `reminder_*` para tarjetas, cuentas, casos, participantes, compras, participaciones, pagos y destinos del dinero.

Los cinco archivos habilitan RLS y definen políticas para usuarios autenticados. Dinero Tanque, Spotify Familiar, Recordatorios y Préstamos aplican aislamiento por `owner_id`. Pretty Salon combina propiedad con membresía compartida por correo para lectura, actualización y eliminación; su tabla de miembros solo permite a cada usuario leer su propia fila. Cronograma también escribe `owner_id` desde el código, pero su esquema y sus políticas no están documentados por un SQL del repositorio.

## Decisiones vigentes

- Portal modular con dominios y rutas independientes, sin navegación global invasiva.
- Páginas de módulo delgadas; hooks para orquestación; services para consultas de tablas; UI separada del acceso a datos.
- Registro de módulos centralizado en `config/modules.ts` y dependencias cruzadas mínimas.
- Compatibilidad prioritaria con Supabase Free y Vercel Hobby/Free.
- Cronograma administra una única lista vigente de materias: no conserva ciclos; sus eliminaciones y limpieza también descartan las actividades relacionadas.
- Pretty Salon conserva una identidad visual y navegación interna propias.
- Recordatorios conserva el historial de cosas devueltas separado y permite reclasificar `No lo sé`; las compras compartidas se consolidan por caso, pero cada transacción mantiene su tarjeta y fechas.

## Pendientes operativos conocidos

- Ejecutar `supabase/recordatorios_compras.sql` en Supabase antes de utilizar la vertiente `Compras con tarjeta de crédito`.

## Guía de lectura selectiva

- Cronograma: `app/cronograma/`, `features/cronograma/` y `lib/week.ts`; revisar `config/modules.ts` solo si cambia el registro. No existe SQL local del dominio.
- Dinero Tanque: `app/dinero-tanque/`, `features/dinero-tanque/`, `lib/dineroTanque.ts` y `supabase/dinero_tanque.sql`; sumar `config/modules.ts` solo para cambios de registro.
- Spotify Familiar: `app/spotify-familiar/`, `features/spotify-familiar/` y `supabase/spotify_family.sql`; sumar `config/modules.ts` solo para cambios de registro.
- Pretty Salon: `app/pretty-escritorio/`, `features/pretty-salon/`, `supabase/pretty_salon.sql` y, para acceso, `lib/moduleAccess.ts`; sumar `config/modules.ts` solo para cambios de registro.
- Recordatorios: `app/prestamos/`, `features/recordatorios/`, `features/prestamos/`, `supabase/recordatorios_compras.sql` y `supabase/personal_loans.sql`; sumar `config/modules.ts` para cambios de registro.
- Login, selector o shells: `app/login/`, `app/modulos/`, `components/layout/`, `components/ui/`, `lib/supabaseClient.ts`, `lib/moduleAccess.ts` y `config/modules.ts` según el cambio.
