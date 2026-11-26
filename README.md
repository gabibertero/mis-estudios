# Mis Estudios

Planificador académico independiente de Mis Correlativas. Objetivo universal: 100% de rendimiento; mínimo personal configurable por evaluación.

## Primera versión

Aplicación estática sin build, con dashboard, materias, evaluaciones, disponibilidad, compromisos semanales, excepciones, planificador, calendario, Pomodoro y estadísticas. El motor distribuye sesiones dentro de los intervalos disponibles, respeta descansos y fechas, prioriza por urgencia y mínimo, y muestra trabajo sin asignar. La preparación se estima; no garantiza una nota.

## Publicar

En GitHub, Settings → Pages → Build and deployment → Deploy from a branch → main → / (root) → Save. La URL prevista es https://gabibertero.github.io/mis-estudios/. No está verificada hasta que Pages termine de desplegar.

Para probar localmente, ejecutar desde la carpeta del repositorio: python3 -m http.server 8000 y abrir http://localhost:8000.

## Sincronización

1. Abrir el proyecto de Supabase ya utilizado por Mis Correlativas.
2. En SQL Editor, ejecutar el contenido de [supabase/migration.sql](supabase/migration.sql). Crea únicamente study_workspace, con RLS y políticas de acceso por usuario. No modifica progreso ni auth.users.
3. Iniciar sesión con el correo y contraseña de Correlativas. El sitio consulta la fila propia de progreso en modo lectura e importa materias activas y estados.
4. Verificar que el estado muestre sincronización y que una segunda sesión de la misma cuenta reciba los datos.

La clave pública anon del proyecto está en el cliente, igual que en Correlativas. Nunca colocar service_role ni contraseñas en GitHub. El modo local funciona sin iniciar sesión; los datos de invitado son independientes de los datos autenticados. Los cambios concurrentes se detectan por revisión y no se sobrescriben automáticamente ante conflicto.

## Límites de esta versión

- La aplicación debe estar abierta para replanificar. No hay jobs ni notificaciones en segundo plano.
- La planificación usa estimaciones de tiempo y resultados registrados. No evalúa por sí misma el dominio de cada tema.
- Los horarios de finales importados requieren confirmación manual; Correlativas no almacena la hora.
- Falta verificar el login real, RLS con dos cuentas, instalación en Dock, interfaz y comportamiento offline en navegador. No importar respaldos JSON de terceros hasta completar validación exhaustiva.
- Las fases, integración con electivas, impacto estratégico de correlativas, sincronización avanzada, edición directa de horarios y calendario externo son áreas de mejora.
- Escalas según requisitos: regularidad 55% y final 60% predeterminados, 10 desde 96%, objetivo 100%. Otros criterios de cada materia requieren configuración.

## Verificaciones del motor

Se comprobó sintaxis de la aplicación, límites de nota, límite diario, exclusión de un compromiso y aviso por capacidad insuficiente mediante una ejecución aislada del motor. Las pruebas de navegador y Supabase están pendientes.
