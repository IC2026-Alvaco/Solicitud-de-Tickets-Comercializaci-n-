/*
 * Fuente de datos REAL: Supabase.
 * Se activa sola cuando js/config.js tiene SUPABASE_URL y SUPABASE_ANON_KEY.
 *
 * Aquí no hay reglas de seguridad: todo lo que un usuario puede o no puede
 * hacer lo decide la base (políticas RLS, permisos por columna y triggers
 * de supabase/01_estructura.sql). Este archivo solo lee y escribe.
 */
(function () {
  let cliente = null;

  function sb() {
    if (cliente) return cliente;
    const cfg = window.IC_CONFIG || {};
    if (!window.supabase || !window.supabase.createClient) {
      throw new Error("No cargó la librería de Supabase (js/vendor/supabase.js).");
    }
    cliente = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return cliente;
  }

  function falla(error, texto) {
    console.error("[supabase]", error);
    throw new Error(texto || error.message || "Algo falló al hablar con la base de datos");
  }

  const CAMPOS_TICKET = `
    id, folio, folio_contrato, margen_para, prioridad, estatus, proposito, descripcion, asignado_id, detalles,
    creado_en, vence_en,
    plaza:plazas(nombre),
    cadena:cadenas(nombre),
    punto_venta:puntos_venta(nombre),
    categoria:categorias(nombre),
    solicitante:perfiles!tickets_solicitante_id_fkey(nombre, correo),
    asignado:perfiles!tickets_asignado_id_fkey(nombre),
    movimientos(a, autor, nota, creado_en)`;

  const aviso = (a) => ({
    id: String(a.id), ticketId: a.ticket_id ? String(a.ticket_id) : null, folio: a.folio,
    estatus: a.estatus, titulo: a.titulo, texto: a.texto, leida: a.leida, creadoEn: a.creado_en,
  });

  window.IC_SUPABASE = {
    modo: "supabase",

    async sesion() {
      const { data } = await sb().auth.getSession();
      const usuario = data && data.session && data.session.user;
      if (!usuario) return null;
      const { data: perfil, error } = await sb()
        .from("perfiles").select("id, nombre, correo, rol, activo").eq("id", usuario.id).single();
      if (error || !perfil || !perfil.activo) {
        await sb().auth.signOut();
        return null;
      }
      return perfil;
    },

    async entrar(correo, password) {
      const { error } = await sb().auth.signInWithPassword({ email: String(correo).trim(), password });
      if (error) throw new Error("Ese correo y contraseña no coinciden.");
      const perfil = await this.sesion();
      if (!perfil) throw new Error("Tu cuenta está inactiva. Pide acceso a Inteligencia Comercial.");
      return perfil;
    },

    async salir() {
      await sb().auth.signOut();
    },

    async catalogos() {
      const pedir = (tabla, campos = "id, nombre") =>
        sb().from(tabla).select(campos).eq("activa", true).order("nombre");
      const [p, c, k] = await Promise.all([pedir("plazas"), pedir("cadenas"), pedir("categorias", "id, nombre, sla_horas")]);
      const error = p.error || c.error || k.error;
      if (error) falla(error, "No se pudieron cargar los catálogos");
      const txt = (l) => l.map((x) => ({ id: String(x.id), nombre: x.nombre }));
      return {
        plazas: txt(p.data), cadenas: txt(c.data),
        categorias: k.data.map((x) => ({ id: String(x.id), nombre: x.nombre, slaHoras: x.sla_horas })),
      };
    },

    /** Puntos de venta de una cadena (07_cadenas_pdv.sql). Hay cadenas con más de 1,000. */
    async puntosVenta(cadenaId) {
      const { data, error } = await sb().from("puntos_venta").select("id, nombre")
        .eq("cadena_id", Number(cadenaId)).order("nombre").range(0, 4999);
      if (error) { console.error("[supabase] puntos de venta", error); return []; }
      return data.map((x) => ({ id: String(x.id), nombre: x.nombre }));
    },

    async crearTicket(d) {
      // Folio, solicitante, estatus, vencimiento e historial los pone la base (triggers).
      const { data, error } = await sb()
        .from("tickets")
        .insert({
          plaza_id: d.plazaId ? Number(d.plazaId) : null,   // la plaza ahora es el punto de venta
          cadena_id: Number(d.cadenaId),
          punto_venta_id: d.pdvId ? Number(d.pdvId) : null,
          categoria_id: Number(d.categoriaId),
          folio_contrato: d.folioContrato || null,
          margen_para: d.margenPara || null,
          prioridad: d.prioridad,
          proposito: d.proposito,
          descripcion: d.descripcion,
          detalles: d.detalles || {},
        })
        .select("folio")
        .single();
      if (error) falla(error, "No se pudo guardar la solicitud. Intenta de nuevo.");
      return { folio: data.folio, correo: "real" };
    },

    async tickets() {
      const { data, error } = await sb()
        .from("tickets").select(CAMPOS_TICKET)
        .order("creado_en", { ascending: false }).limit(200);
      if (error) falla(error, "No se pudieron cargar los tickets");
      return data.map((t) => ({
        id: String(t.id), folio: t.folio,
        plaza: t.punto_venta ? t.punto_venta.nombre : (t.detalles || {}).alcance === "Toda la cadena" ? "Toda la cadena" : t.plaza ? t.plaza.nombre : "—",
        cadena: t.cadena ? t.cadena.nombre : "—",
        pdv: t.punto_venta ? t.punto_venta.nombre : null,
        categoria: t.categoria ? t.categoria.nombre : "—",
        folioContrato: t.folio_contrato, margenPara: t.margen_para, detalles: t.detalles || {},
        prioridad: t.prioridad, estatus: t.estatus,
        proposito: t.proposito, descripcion: t.descripcion,
        solicitante: t.solicitante ? t.solicitante.nombre : "—",
        solicitanteCorreo: t.solicitante ? t.solicitante.correo || "" : "",
        asignado: t.asignado ? t.asignado.nombre : null,
        asignadoId: t.asignado_id || null,
        creadoEn: t.creado_en, venceEn: t.vence_en,
        movimientos: (t.movimientos || [])
          .map((m) => ({ a: m.a, autor: m.autor, nota: m.nota, creadoEn: m.creado_en }))
          .sort((a, z) => a.creadoEn.localeCompare(z.creadoEn)),
      }));
    },

    async avisos() {
      const { data, error } = await sb()
        .from("notificaciones").select("id, ticket_id, folio, estatus, titulo, texto, leida, creado_en")
        .order("creado_en", { ascending: false }).limit(30);
      if (error) { console.error("[supabase] avisos", error); return []; }
      return data.map(aviso);
    },

    async marcarLeidos() {
      const { error } = await sb().from("notificaciones").update({ leida: true }).eq("leida", false);
      if (error) console.error("[supabase] marcar leídos", error);
    },

    /** Avisos al instante con Supabase Realtime (las políticas RLS filtran lo de cada quien). */
    suscribir(alLlegar) {
      let canal = null;
      sb().auth.getSession().then(({ data }) => {
        const uid = data && data.session && data.session.user.id;
        if (!uid) return;
        canal = sb().channel(`avisos-${uid}`)
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificaciones", filter: `para=eq.${uid}` },
            (p) => alLlegar(aviso(p.new)))
          .subscribe();
      });
      return () => { if (canal) sb().removeChannel(canal); };
    },

    async equipo() {
      const { data, error } = await sb().from("perfiles").select("id, nombre")
        .in("rol", ["ANALISTA", "ADMIN"]).eq("activo", true).order("nombre");
      if (error) { console.error("[supabase] equipo", error); return []; }
      return data;
    },

    async reasignar(id, paraId, nota) {
      const { data, error } = await sb().from("tickets")
        .update({ asignado_id: paraId, nota_cambio: String(nota || "").trim().slice(0, 500) || null })
        .eq("id", Number(id)).select("id");
      if (error) falla(error, "No se pudo reasignar");
      if (!data || !data.length) throw new Error("Solo Inteligencia Comercial puede reasignar");
      return { ok: true };
    },

    // ------------------------------------------------------------ chat por ticket (06_chat.sql)
    async mensajes(ticketId) {
      const { data: ses } = await sb().auth.getSession();
      const uid = ses && ses.session && ses.session.user.id;
      const [m, l] = await Promise.all([
        sb().from("ticket_mensajes").select("id, ticket_id, autor_id, texto, creado_en, autor:perfiles!ticket_mensajes_autor_id_fkey(nombre, rol)")
          .eq("ticket_id", Number(ticketId)).order("creado_en"),
        sb().from("ticket_mensajes_leidos").select("perfil_id, leido_hasta").eq("ticket_id", Number(ticketId)),
      ]);
      if (m.error) { console.error("[supabase] mensajes", m.error); return []; }
      const lecturas = (l.data || []);
      return m.data.map((x) => ({
        id: String(x.id), ticketId: String(x.ticket_id), autorId: x.autor_id,
        autor: x.autor ? x.autor.nombre : (x.autor_id === uid ? "Tú" : "Inteligencia Comercial"),
        esIC: x.autor ? ["ANALISTA", "ADMIN"].includes(x.autor.rol) : x.autor_id !== uid, texto: x.texto, creadoEn: x.creado_en,
        mio: x.autor_id === uid,
        visto: lecturas.some((r) => r.perfil_id !== x.autor_id && new Date(r.leido_hasta) >= new Date(x.creado_en)),
      }));
    },

    async enviarMensaje(ticketId, texto) {
      const limpio = String(texto || "").trim().slice(0, 2000);
      if (!limpio) return null;
      const { error } = await sb().from("ticket_mensajes").insert({ ticket_id: Number(ticketId), texto: limpio });
      if (error) falla(error, "No se pudo enviar el mensaje");
      return { ok: true };
    },

    async marcarChatLeido(ticketId) {
      const { error } = await sb().rpc("chat_marcar_leido", { p_ticket: Number(ticketId) });
      if (error) console.error("[supabase] chat leído", error);
    },

    async chatNoLeidos() {
      const { data, error } = await sb().rpc("chat_no_leidos");
      if (error) { console.error("[supabase] chat no leídos", error); return {}; }
      return Object.fromEntries((data || []).map((r) => [String(r.ticket_id), r.n]));
    },

    suscribirChat(alLlegar) {
      const canal = sb().channel("chat-tickets")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ticket_mensajes" }, (p) => alLlegar(String(p.new.ticket_id)))
        .on("postgres_changes", { event: "*", schema: "public", table: "ticket_mensajes_leidos" }, (p) => alLlegar(String((p.new || p.old || {}).ticket_id || "")))
        .subscribe();
      return () => sb().removeChannel(canal);
    },

    /** Cambios de cualquier persona de IC al instante (Supabase Realtime). */
    suscribirTickets(alCambiar) {
      let t = null;
      const canal = sb().channel("tickets-ic")
        .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => {
          clearTimeout(t); t = setTimeout(alCambiar, 250);   // agrupa ráfagas de cambios
        })
        .subscribe();
      return () => sb().removeChannel(canal);
    },

    async cambiarEstatus(id, nuevo, nota, opciones = {}) {
      // La nota viaja al historial y al aviso de quien lo solicitó (triggers de 03_avisos.sql).
      let q = sb()
        .from("tickets")
        .update({ estatus: nuevo, nota_cambio: String(nota || "").trim().slice(0, 500) || null })
        .eq("id", Number(id));
      // "Tomar" solo funciona si sigue nuevo y sin dueño (además del candado en la base, 04_equipo.sql)
      if (opciones.tomar) q = q.eq("estatus", "NUEVO").is("asignado_id", null);
      const { data, error } = await q.select("id");
      if (error) falla(error, error.message && error.message.includes("ya lo tomó") ? error.message : "No se pudo mover el estatus");
      if (opciones.tomar && (!data || !data.length)) {
        const { data: t } = await sb().from("tickets")
          .select("asignado:perfiles!tickets_asignado_id_fkey(nombre)").eq("id", Number(id)).single();
        throw new Error(t && t.asignado ? `${t.asignado.nombre} ya lo tomó hace un momento` : "Alguien más ya lo movió; se actualizó la lista");
      }
      if (!data || !data.length) throw new Error("Solo Inteligencia Comercial puede mover el estatus");
      return { avisado: true };
    },
  };
})();
