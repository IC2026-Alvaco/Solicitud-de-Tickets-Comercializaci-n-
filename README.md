# Tickets Inteligencia Comercial · versión GitHub Pages

Sistema de solicitudes al área de IC de ALVACO. Es la misma app de la versión
Next.js (mismo diseño, mismas pantallas, mismas reglas), pero sin servidor:

- **La página** (HTML, CSS y JavaScript) vive en un repositorio de GitHub y se publica con GitHub Pages.
- **Los datos, el login y la seguridad** viven en Supabase.
- **Los correos** los manda una Edge Function de Supabase.

Mientras `js/config.js` esté vacío, la app corre en **modo demo**: datos de
prueba guardados en el navegador y correos simulados. Así puedes subirla y
enseñarla antes de tener la base lista.

---

## Instalación rápida en Supabase (proyecto nuevo)

Los scripts SQL **no viven en este repositorio** (se guardan aparte, fuera de GitHub).
En **SQL Editor** corre el archivo `TICKETS_IC_INSTALACION_COMPLETA.sql` (o, si es muy grande para el editor, los 5 archivos `INSTALAR_1…5`):

1. `INSTALAR_1_estructura.sql` (todo: tablas, seguridad, 13 usuarios, avisos, chat, tipos, cadenas, fase Entregado)
2. `INSTALAR_2_plazas_parte1.sql`
3. `INSTALAR_3_plazas_parte2.sql`
4. `INSTALAR_4_plazas_parte3.sql`
5. `INSTALAR_5_plazas_parte4.sql`

Los scripts sueltos (`01`…`09b`) quedan como historial de cambios; para un proyecto nuevo **no hace falta correrlos**.

## 1. Qué hay en el repo

```
tickets-ic-pages/
├── index.html                 # la app completa (login, nueva solicitud, tablero)
├── css/estilos.css            # el diseño aprobado, intacto
├── js/
│   ├── config.js              # ← aquí van la URL y la llave anon de Supabase
│   ├── app.js                 # pantallas y comportamiento
│   ├── datos-demo.js          # datos de prueba (modo demo)
│   ├── datos-supabase.js      # conexión real
│   └── vendor/supabase.js     # librería de Supabase guardada en el repo (sin CDN)
├── fuentes/archivo.woff2      # fuente Archivo guardada en el repo (sin Google Fonts)
├── js/otto.js                 # Otto en el login: garra, saludo, parpadeo y reacciones
├── marca/                     # logos, osos, máquina, garra y las capas de Otto
│                              #   (otto-cuerpo, otto-mano y otto-ojos)
├── supabase/
│   ├── 01_estructura.sql      # tablas, triggers, seguridad y catálogos
│   ├── 02_usuarios.sql        # nombres y roles
│   └── functions/notificar/index.ts   # correos
└── .nojekyll
```

Nada se descarga de internet al abrir la página, salvo la conexión a tu
proyecto de Supabase. Eso evita problemas con el Fortinet.

---

## 2. Cómo se protege si todo es público

El repo y la llave `anon` de Supabase son públicos. Es normal y está bien,
porque la página no decide nada: **la base de datos decide**.

| Regla | Dónde vive |
|---|---|
| El solicitante solo ve sus tickets; IC ve todos | Política RLS `tickets: ver` |
| Solo IC puede mover estatus | Política RLS `tickets: mover` |
| La página solo puede escribir los campos del formulario y el estatus | Permisos por columna (`grant insert (...)`, `grant update (estatus)`) |
| Folio, dueño, fecha compromiso, historial y cierre | Triggers; lo que mande el navegador se ignora |
| La llave de Resend | Secreto de la Edge Function; nunca llega al navegador |

**Nunca** pongas la llave `service_role` en `config.js` ni en ningún archivo del repo.

---

## 3. Puesta en marcha

### Paso 1 · Probar la red de la oficina (2 minutos)

Desde una computadora en la red de ALVACO, abre en el navegador
`https://supabase.com`. Si carga, crea el proyecto (paso 3) y abre
`https://TU-PROYECTO.supabase.co/rest/v1/` — debe responder un error de
"No API key found". Si la página no carga o sale el bloqueo del Fortinet,
hay que pedir a TI que permita `*.supabase.co` antes de seguir.

### Paso 2 · Subir el repo y activar GitHub Pages (modo demo)

1. En GitHub crea un repositorio nuevo, por ejemplo `tickets-ic`, dentro de la cuenta `ic2026-alvaco`.
   Debe ser **público** para usar Pages en el plan gratuito.
2. Sube **el contenido** de esta carpeta (que `index.html` quede en la raíz del repo).
   Desde el navegador: *Add file → Upload files* y arrastra todo.
3. *Settings → Pages → Build and deployment*: Source **Deploy from a branch**, Branch **main** y carpeta **/ (root)**. Guardar.
4. En un par de minutos queda en `https://ic2026-alvaco.github.io/tickets-ic/`.

Ya funciona en modo demo con algunos nombres reales del equipo (por ejemplo
`david.castillo@alvaco.com.mx` como admin y `ximena.perez@alvaco.com.mx` como
ejecutiva), contraseña `Comer26`. También hay botones de acceso rápido en el login.

### Paso 3 · Crear la base en Supabase

1. En supabase.com crea un proyecto (región `East US` o la más cercana).
2. *SQL Editor → New query*: pega **todo** `supabase/01_estructura.sql` y presiona **Run**.
3. *Authentication → Sign In / Providers*: desactiva **Allow new users to sign up**.
   Así nadie se registra solo; las cuentas las das de alta tú.
4. *Authentication → URL Configuration*: en **Site URL** pon la dirección de GitHub Pages.

### Paso 4 · Dar de alta las cuentas

*SQL Editor*: pega `supabase/02_usuarios.sql` completo y presiona **Run**.
Crea las 13 cuentas ya confirmadas, con contraseña inicial `Comer26`:

| Rol | Quiénes | Qué pueden hacer |
|---|---|---|
| ADMIN | David Castillo, Julio Chávez, Marco García | Tablero completo, mover estatus y levantar solicitudes |
| SOLICITANTE | Liliana Rincón y los 9 ejecutivos | Levantar solicitudes y recibir los avisos |

Si el script se vuelve a correr, no toca las contraseñas: solo actualiza
nombre, rol y estado. Para agregar a alguien, añade su renglón a la lista y
córrelo otra vez. Los nombres con acento se escribieron a partir del correo;
corrígelos ahí mismo si alguno no es así.

Para cambiarle la contraseña a una persona: *Authentication → Users*, clic en
el usuario y **Reset password** / editar contraseña.

### Paso 5 · Conectar la página

1. *Project Settings → API*: copia **Project URL** y la llave **anon / public**.
2. En GitHub abre `js/config.js`, presiona el lápiz y pega los dos valores.
3. *Commit changes*. En un minuto la página ya usa la base real y la cinta amarilla de demo desaparece.

### Paso 6 · Correos

1. Crea una cuenta en resend.com y genera una **API Key**.
   Para mandar a cualquier correo hay que verificar un dominio en Resend
   (por ejemplo un subdominio de alvaco.com.mx; lo agrega TI en el DNS).
   Sin dominio verificado, Resend solo entrega al correo con que creaste la cuenta: sirve para probar.
2. En Supabase: *Edge Functions → Deploy a new function → Via Editor*.
   Nómbrala `notificar`, pega `supabase/functions/notificar/index.ts` y despliega.
3. En los detalles de la función desactiva **Verify JWT** (la protege el secreto del webhook).
4. *Edge Functions → Secrets*, agrega:
   - `WEBHOOK_SECRET`: un texto largo inventado
   - `RESEND_API_KEY`: la llave de Resend
   - `CORREO_REMITENTE`: `Tickets IC <tickets@tu-dominio-verificado>`
   - `CORREO_BUZON_IC`: el buzón del equipo (varios separados por coma)
   - `APP_URL`: la dirección de GitHub Pages
5. *Database → Webhooks → Create a new hook*:
   tabla **tickets**, eventos **Insert** y **Update**, tipo **Supabase Edge Functions**,
   función **notificar**, método **POST**, y en *HTTP Headers* agrega
   `x-webhook-secret` con el mismo valor de `WEBHOOK_SECRET`.

Cada intento de correo queda en la tabla `log_correo`, salga bien o mal.

---

### Paso 7 · Avisos dentro de la app (sin servicio de correo)

*SQL Editor*: corre `supabase/03_avisos.sql`. Con eso:

- **Campana de novedades:** a IC le llega un aviso por cada solicitud nueva; a quien solicitó, uno por cada cambio de estatus, con la nota que IC haya escrito.
- **Al instante:** los avisos llegan sin recargar gracias a Supabase Realtime (el script ya activa la tabla).
- **Avisos de Windows:** desde la campana, cada quien puede activar las notificaciones del navegador.
- **Mis solicitudes:** cada ejecutivo ve sus tickets, su avance y el historial con las notas.
- **Avisar por correo:** en el detalle, IC tiene un botón que abre Outlook con el correo ya escrito.

Todo funciona sin Resend ni Microsoft 365. Si después se conectan los correos automáticos (paso 6), conviven sin cambiar nada.

### Paso 8 · Tipos de solicitud de Comercialización

*SQL Editor*: corre `supabase/04_equipo.sql` y después `supabase/05_tipos_comercial.sql`.

- Retira Acceso a un dashboard, Alta de ubicación y Corrección de datos (los tickets viejos conservan su tipo).
- Agrega: Contratos nuevos, Renovaciones de contratos, Margen comercial por punto de venta, Margen comercial por cadena, Análisis de ingreso, Análisis por proyecto, Análisis de locales y Estatus actual de instalaciones.
- Los datos que pide cada tipo (punto de venta, periodo, proyecto, local…) se guardan en la columna `detalles`.
- Para cambiar el tiempo de respuesta de un tipo, edita su número en ese script y vuelve a correrlo.
- Las preguntas y ejemplos de cada tipo están en `js/app.js`, en `GUIA_CAT`.

### Paso 9 · Chat por ticket

*SQL Editor*: corre `supabase/06_chat.sql`.

- Cada ticket tiene su conversación entre quien lo levantó y el equipo de IC (pestaña **Chat** en el detalle).
- Los mensajes quedan guardados para siempre: nadie los puede editar ni borrar desde la app.
- Solo pueden leer y escribir quien levantó el ticket y las personas de IC.
- Avisa en la campana al otro lado, muestra globitos de mensajes sin leer y la doble palomita cuando ya se leyó.

### Paso 10 · Cadenas y puntos de venta (PDV)

*SQL Editor*: corre **en orden** `supabase/07_cadenas_pdv.sql` y después `07b_pdv.sql`, `07c_pdv.sql`, `07d_pdv.sql` y `07e_pdv.sql`.

- Carga las 390 cadenas y los 7,760 puntos de venta de `Cadenas_con_PDV.xlsx`.
- En el formulario, al elegir una cadena solo aparecen sus puntos de venta (con buscador).
- La base no deja guardar un PDV que no sea de la cadena elegida.
- Las cadenas que no vienen en el archivo se ocultan del formulario, sin borrarse.
- Para actualizar el catálogo: vuelve a generar estos archivos con el Excel nuevo y córrelos; los repetidos no se duplican.

### Paso 11 · La plaza es el punto de venta

*SQL Editor*: corre `supabase/08_plaza_es_pdv.sql` (después de los 07).

- En el formulario primero se elige la **Cadena** y luego su **Plaza** (solo las de esa cadena).
- Ya no se pide la plaza regional (Monterrey, Guadalajara…); los tickets viejos la conservan.
- La base no deja guardar un ticket sin plaza ni con una plaza de otra cadena.

### Paso 12 · Fase "Entregado"

*SQL Editor*: corre **solo** `supabase/09a_entregado_tipo.sql` y después `supabase/09b_entregado.sql`.

- **Entregado**: IC ya dio toda la información; el ejecutivo confirma cuando termina su proceso (pasa a **Completado**) o pide algo más (regresa a **En proceso**).
- El tiempo de respuesta de IC se mide hasta la entrega (`entregado_en`); el Dashboard muestra los días promedio.

## 4. Cambios del día a día

- **Agregar una plaza, cadena o categoría:** *Table Editor* → tabla correspondiente → *Insert row*.
  Para quitarla sin perder historial, pon `activa` en `false`.
- **Cambiar el tiempo compromiso de una categoría:** columna `sla_horas`.
- **Dar de baja a alguien:** `activo = false` en `perfiles` (ver `02_usuarios.sql`).
- **Cambiar el diseño:** la base está en `css/estilos.css` y el tema corporativo en `css/tema-m365.css`.
- **Elegir el estilo:** en `js/config.js`, `TEMA: "m365"` deja la app en azul y morado con el login de peluchera roja (la opción actual); `TEMA: "peluchera"` pone toda la app con el estilo colorido de Muñelocos.

## 5. Lo que sigue fuera, igual que en la versión anterior

Adjuntos, comentarios, PDF por ticket, exportar a Excel, métricas y PWA.
Los adjuntos encajan bien con Supabase Storage cuando toque.
