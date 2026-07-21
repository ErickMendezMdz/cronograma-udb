# Instrucciones permanentes del repositorio

## Inicio de cada tarea

- Leer completamente este `AGENTS.md`.
- Leer `context/PROJECT_CONTEXT.md`.
- Usar el contexto como índice inicial para ahorrar análisis innecesario.
- Inspeccionar después únicamente los archivos relacionados con la tarea.
- Ampliar la inspección solamente cuando existan dependencias o riesgos que lo justifiquen.
- Revisar siempre el código real antes de implementar. El código actual es la fuente definitiva de verdad.
- Si el contexto contradice al código, investigar la diferencia y corregir el contexto cuando corresponda.

## Arquitectura

- Tratar el proyecto como un portal modular, no como una aplicación monolítica con navegación global invasiva.
- Cada módulo conserva su propia ruta, dominio, lógica e identidad.
- Mantener `app/<modulo>/page.tsx` como capa delgada.
- Organizar cada dominio bajo `features/<modulo>/`.
- Seguir la separación existente entre tipos, constantes, componentes, hooks y servicios.
- Mantener las consultas de tablas Supabase en los servicios del dominio.
- Las páginas y los componentes visuales no deben consultar directamente tablas Supabase ni importar el cliente global de Supabase.
- Mantener los módulos separados y no introducir dependencias cruzadas innecesarias.

## Seguridad y alcance

- No cambiar tablas, SQL, RLS, autenticación, rutas o dependencias sin autorización explícita.
- No instalar dependencias nuevas salvo que la tarea lo requiera y se haya informado.
- No revelar ni copiar secretos, claves, tokens o valores de archivos `.env`.
- Preservar los cambios existentes del usuario.
- No modificar archivos ajenos al alcance de la tarea.
- No hacer refactors amplios cuando una corrección localizada sea suficiente.
- No hacer commit ni push salvo solicitud explícita.

## Recursos gratuitos

- Priorizar soluciones ligeras compatibles con Supabase Free y Vercel Hobby.
- No introducir Realtime, Storage, cron jobs, middleware, server actions u otros servicios adicionales salvo solicitud explícita y justificada.
- Evitar dependencias pesadas y consumo innecesario.

## Verificación

- Hacer cambios pequeños y verificables.
- Ejecutar `npm run build` y `npm run lint` después de cambios funcionales, cuando sea posible.
- Revisar errores TypeScript e imports.
- Reportar archivos creados, editados o eliminados; verificaciones realizadas; warnings; riesgos o decisiones importantes; y pasos operativos pendientes, como ejecutar SQL.

## Actualización del contexto

Actualizar `context/PROJECT_CONTEXT.md` solamente cuando cambien aspectos relevantes:

- módulos o rutas;
- arquitectura o estructura importante;
- comportamiento funcional;
- base de datos, SQL o RLS;
- autenticación o acceso;
- decisiones técnicas permanentes;
- funcionalidades disponibles;
- restricciones importantes.

No actualizarlo por correcciones de texto, ajustes visuales menores, cambios de formato, limpieza de imports o refactors internos sin impacto arquitectónico o funcional.

Mantener `context/PROJECT_CONTEXT.md` como una fotografía actual y compacta, no como un historial de cambios. Al actualizarlo:

- modificar la sección correspondiente y eliminar información obsoleta;
- evitar entradas cronológicas e información duplicada;
- mantenerlo suficientemente breve para ahorrar tokens;
- no incluir secretos ni datos sensibles.
