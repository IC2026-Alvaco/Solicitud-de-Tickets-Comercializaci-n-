// =====================================================================
//  Edge Function "notificar" · Tickets IC
//
//  La dispara un Database Webhook de la tabla tickets (INSERT y UPDATE).
//    · INSERT  → correo al buzón de IC + acuse al solicitante.
//    · UPDATE  → si cambió el estatus, correo al solicitante.
//
//  Reglas que se conservan de la versión Next.js:
//    1. El ticket ya está guardado cuando esto corre. Si el correo falla,
//       no se pierde nada; el intento queda en log_correo.
//    2. Candado anti-spam: si ultimo_estatus_notificado ya es el estatus
//       actual, no se repite el correo.
//
//  Secretos (Edge Functions → Secrets):
//    WEBHOOK_SECRET    texto largo inventado; el mismo va en el header del webhook
//    RESEND_API_KEY    llave de resend.com
//    CORREO_REMITENTE  ej. "Tickets IC <tickets@tudominio.mx>"
//    CORREO_BUZON_IC   ej. "tickets.ic@alvaco.com.mx" (varios separados por coma)
//    APP_URL           ej. "https://ic2026-alvaco.github.io/tickets-ic/"
//  SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY ya vienen puestos por Supabase.
// =====================================================================

import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const SECRETO = Deno.env.get("WEBHOOK_SECRET") ?? "";
const RESEND = Deno.env.get("RESEND_API_KEY") ?? "";
const REMITENTE = Deno.env.get("CORREO_REMITENTE") ?? "Tickets IC <onboarding@resend.dev>";
const BUZON = (Deno.env.get("CORREO_BUZON_IC") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const APP_URL = Deno.env.get("APP_URL") ?? "";

const ESTATUS_TEXTO: Record<string, string> = {
  NUEVO: "Nuevo", EN_PROCESO: "En proceso", EN_ESPERA: "En espera",
  ENTREGADO: "Entregado", COMPLETADO: "Completado", CANCELADO: "Cancelado",
};
const ESTATUS_COLOR: Record<string, string> = {
  NUEVO: "#29ABE2", EN_PROCESO: "#FFC62E", EN_ESPERA: "#F58220",
  ENTREGADO: "#2BA3A3", COMPLETADO: "#2FA84F", CANCELADO: "#E5322D",
};
const PRIORIDAD_TEXTO: Record<string, string> = {
  BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente",
};

const responder = (texto: string, status = 200) => new Response(texto, { status });

Deno.serve(async (req) => {
  if (!SECRETO || req.headers.get("x-webhook-secret") !== SECRETO) {
    return responder("no autorizado", 401);
  }

  const p = await req.json();
  if (p.table !== "tickets" || !p.record) return responder("ignorado");

  const nuevo = p.record;
  const viejo = p.old_record;

  if (p.type === "UPDATE") {
    if (viejo && viejo.estatus === nuevo.estatus) return responder("sin cambio de estatus");
    if (nuevo.ultimo_estatus_notificado === nuevo.estatus) return responder("ya avisado");
  } else if (p.type !== "INSERT") {
    return responder("ignorado");
  }

  const { data: t, error } = await sb
    .from("tickets")
    .select(`id, folio, prioridad, proposito, descripcion, estatus,
      plaza:plazas(nombre), punto_venta:puntos_venta(nombre), cadena:cadenas(nombre), categoria:categorias(nombre),
      solicitante:perfiles!tickets_solicitante_id_fkey(nombre, correo)`)
    .eq("id", nuevo.id)
    .single();
  if (error || !t) return responder("ticket no encontrado", 404);

  const datos = {
    folio: t.folio,
    categoria: (t.categoria as any)?.nombre ?? "—",
    // la plaza es el punto de venta de la cadena (07/08); los tickets viejos conservan su plaza
    plaza: (t.punto_venta as any)?.nombre ?? (t.plaza as any)?.nombre ?? "—",
    cadena: (t.cadena as any)?.nombre ?? "—",
    prioridad: PRIORIDAD_TEXTO[t.prioridad] ?? t.prioridad,
    solicitante: (t.solicitante as any)?.nombre ?? "—",
    proposito: t.proposito,
    descripcion: t.descripcion,
  };
  const correoSolicitante = (t.solicitante as any)?.correo as string | undefined;
  const url = APP_URL ? `${APP_URL.replace(/\/?$/, "/")}?folio=${encodeURIComponent(t.folio)}#tablero` : "";

  if (p.type === "INSERT") {
    const aIC = correoTicketCreado(datos, url);
    await enviar(BUZON, aIC.asunto, aIC.html, "ticket-creado", t.id);
    if (correoSolicitante) {
      const acuse = correoAcuse(datos, url);
      await enviar([correoSolicitante], acuse.asunto, acuse.html, "acuse", t.id);
    }
  } else {
    const { data: ultimo } = await sb
      .from("movimientos").select("autor").eq("ticket_id", t.id)
      .order("creado_en", { ascending: false }).limit(1).maybeSingle();
    const c = correoCambioEstatus(
      datos, ESTATUS_TEXTO[t.estatus], ESTATUS_COLOR[t.estatus],
      ultimo?.autor ?? "Inteligencia Comercial", url, nuevo.nota_cambio ?? "",
    );
    if (correoSolicitante) await enviar([correoSolicitante], c.asunto, c.html, "cambio-estatus", t.id);
  }

  // Se marca como avisado. Esta escritura dispara el webhook otra vez,
  // pero sale en "sin cambio de estatus" porque el estatus no se movió.
  await sb.from("tickets").update({ ultimo_estatus_notificado: t.estatus }).eq("id", t.id);

  return responder("ok");
});

// ---------------------------------------------------------------- envío
async function enviar(para: string[], asunto: string, html: string, plantilla: string, ticketId: number) {
  const destinos = para.filter(Boolean);
  if (!destinos.length) return;

  let exito = false;
  let error: string | null = null;
  try {
    if (!RESEND) throw new Error("Falta el secreto RESEND_API_KEY");
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: REMITENTE, to: destinos, subject: asunto, html }),
    });
    if (!r.ok) throw new Error(`Resend respondió ${r.status}: ${await r.text()}`);
    exito = true;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.error("[correo] falló:", error);
  }

  await sb.from("log_correo").insert({
    ticket_id: ticketId, para: destinos.join(", "), asunto, plantilla, exito, error,
  });
}

// ---------------------------------------------------------------- plantillas
type Datos = {
  folio: string; categoria: string; plaza: string; cadena: string;
  prioridad: string; solicitante: string; proposito: string; descripcion: string;
};

const MARINO = "#0D1B3E";
const GRIS = "#5C6788";

function esc(v: unknown) {
  return String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function envoltura(titulo: string, color: string, tinta: string, cuerpo: string, url: string) {
  const boton = url
    ? `<p style="margin:22px 0 0"><a href="${esc(url)}" style="display:inline-block;background:${MARINO};color:#fff;text-decoration:none;padding:11px 20px;border-radius:9px;font-weight:700">Abrir en Tickets IC</a></p>`
    : "";
  return `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:24px;background:#EBEFF7;font-family:Segoe UI,Arial,sans-serif;color:${MARINO}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;margin:0 auto;background:#fff;border:2px solid ${MARINO};border-radius:14px;overflow:hidden">
    <tr><td style="background:${color};padding:18px 24px">
      <div style="font-size:22px;font-weight:800;color:${tinta};letter-spacing:-.5px">${esc(titulo)}</div>
    </td></tr>
    <tr><td style="padding:22px 24px">${cuerpo}${boton}</td></tr>
    <tr><td style="padding:14px 24px;background:#EBEFF7;font-size:12px;color:${GRIS}">
      Tickets Inteligencia Comercial · ALVACO. Este correo se envía solo, no hace falta responderlo.
    </td></tr>
  </table></body></html>`;
}

function fila(etiqueta: string, valor: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${GRIS};width:150px">${esc(etiqueta)}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:700">${esc(valor)}</td>
  </tr>`;
}

function correoTicketCreado(t: Datos, url: string) {
  const cuerpo = `
    <p style="margin:0 0 6px;font-size:15px"><b>${esc(t.solicitante)}</b> levantó una solicitud nueva.</p>
    <p style="margin:0 0 16px;font-size:15px;color:${GRIS}">${esc(t.proposito)}</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${fila("Folio", t.folio)}${fila("Categoría", t.categoria)}${fila("Plaza", t.plaza)}
      ${fila("Cadena", t.cadena)}${fila("Prioridad", t.prioridad)}
    </table>
    <div style="margin-top:16px;padding:13px 15px;background:#EBEFF7;border-radius:10px;font-size:14px;line-height:1.55;white-space:pre-wrap">${esc(t.descripcion)}</div>`;
  return {
    asunto: `[${t.folio}] ${t.categoria} · ${t.plaza}`,
    html: envoltura("Solicitud nueva", "#29ABE2", "#fff", cuerpo, url),
  };
}

function correoAcuse(t: Datos, url: string) {
  const cuerpo = `
    <p style="margin:0 0 16px;font-size:15px">Recibimos tu solicitud. Inteligencia Comercial ya la tiene en su tablero.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${fila("Folio", t.folio)}${fila("Categoría", t.categoria)}${fila("Prioridad", t.prioridad)}
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:${GRIS}">Te avisamos por este medio cada vez que cambie de estatus.</p>`;
  return {
    asunto: `Recibimos tu solicitud ${t.folio}`,
    html: envoltura("Acuse de recibo", "#2FA84F", "#fff", cuerpo, url),
  };
}

function correoCambioEstatus(t: Datos, estatus: string, color: string, autor: string, url: string, nota = "") {
  const notaHtml = nota.trim()
    ? `<div style="margin-top:16px;padding:13px 15px;background:#F3EEFC;border-left:4px solid #7B61C4;border-radius:8px;font-size:14px;line-height:1.5"><b>Nota de ${esc(autor)}:</b><br>${esc(nota.trim())}</div>`
    : "";
  const cuerpo = `
    <p style="margin:0 0 16px;font-size:15px">Tu solicitud <b>${esc(t.folio)}</b> pasó a <b>${esc(estatus)}</b>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${fila("Categoría", t.categoria)}${fila("Plaza", t.plaza)}${fila("Movió", autor)}
    </table>${notaHtml}`;
  return {
    asunto: `[${t.folio}] ahora está en ${estatus}`,
    html: envoltura(estatus, color, color === "#FFC62E" ? MARINO : "#fff", cuerpo, url),
  };
}
