/*
 * Configuración de Tickets IC.
 *
 * Mientras SUPABASE_URL esté vacío, la app corre en MODO DEMO:
 * datos de prueba guardados en el navegador y correos simulados.
 *
 * Para conectarla a la base real, pega aquí los dos valores de
 * Supabase → Project Settings → API:
 *   - Project URL         → SUPABASE_URL
 *   - Publishable key     → SUPABASE_ANON_KEY  (sb_publishable_…)
 *
 * La llave "publishable" es pública por diseño y puede vivir en el repo.
 * Lo que protege los datos son las reglas de seguridad (RLS) de la base.
 * NUNCA pongas aquí la llave "secret" (sb_secret_…) ni la "service_role".
 */
window.IC_CONFIG = {
  SUPABASE_URL: "https://jvggleyxmnccxpjwnlzh.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_PvsrAN7U6XBeZvd9298GDw_sDwTBVzp",

  // Apariencia:
  //   "m365"      → app en azul y morado corporativo, login con la peluchera roja de Muñelocos
  //   "peluchera" → toda la app con el estilo colorido de Muñelocos
  TEMA: "m365",

  // Cómo se arma el botón "Correo" del tablero:
  //   "pegar" → abre Outlook (nuevo o web) y deja el mensaje completo con la
  //             tarjeta listo para pegar con Ctrl + V en el cuerpo.
  //   "eml"   → descarga un borrador .eml que el Outlook clásico abre ya
  //             armado, listo para Enviar.
  CORREO: "pegar",
};

if (window.IC_CONFIG.TEMA === "m365") document.documentElement.classList.add("tema-m365");
