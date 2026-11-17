/*
 * Fuente de datos DEMO.
 * Misma interfaz que datos-supabase.js, pero todo vive en el localStorage
 * de este navegador. Sirve para ver la app funcionando sin base de datos.
 */
(function () {
  const LLAVE = "tickets-ic-demo-v9";
  const ESTATUS_TEXTO = { NUEVO: "Nuevo", EN_PROCESO: "En proceso", EN_ESPERA: "En espera", ENTREGADO: "Entregado", COMPLETADO: "Completado", CANCELADO: "Cancelado" };
  const LLAVE_SESION = "tickets-ic-demo-sesion";
  const CLAVE_DEMO = "Comer26";
  const H = 3600000;

  const USUARIOS = [
    { id: "u1", nombre: "David Castillo", correo: "david.castillo@alvaco.com.mx", rol: "ADMIN" },
    { id: "u2", nombre: "Marco García", correo: "marco.garcia@alvaco.com.mx", rol: "ADMIN" },
    { id: "u3", nombre: "Julio Chávez", correo: "julio.chavez@alvaco.com.mx", rol: "ADMIN" },
    { id: "u4", nombre: "Ximena Pérez", correo: "ximena.perez@alvaco.com.mx", rol: "SOLICITANTE" },
    { id: "u5", nombre: "Jorge Ortega", correo: "jorge.ortega@alvaco.com.mx", rol: "SOLICITANTE" },
    { id: "u6", nombre: "Leslie Cuéllar", correo: "leslie.cuellar@alvaco.com.mx", rol: "SOLICITANTE" },
    { id: "u7", nombre: "Liliana Rincón", correo: "liliana.rincon@alvaco.com.mx", rol: "SOLICITANTE" },
  ];

  const PLAZAS = ["CDMX Norte", "CDMX Sur", "Guadalajara", "Mérida", "Monterrey", "Puebla", "San Pedro Sula", "Tijuana"];
  // Cadenas del catálogo real (js/catalogo-pdv.js, tomado de Cadenas_con_PDV.xlsx)
  const CADENAS = Object.keys(window.CATALOGO_PDV || {}).length
    ? Object.keys(window.CATALOGO_PDV).sort((a, z) => a.localeCompare(z, "es"))
    : ["Calimax", "Chedraui", "HEB", "Soriana", "Tiendas Neto", "Walmart Mexico"];
  const CATEGORIAS = [
    ["Contratos nuevos", 48], ["Renovaciones de contratos", 48], ["Cambio de renta", 48],
    ["Solicitud de margen", 24], ["Margen comercial por punto de venta", 24], ["Margen comercial por cadena", 48],
    ["Análisis de ingreso", 48], ["Análisis por proyecto", 72], ["Análisis de locales", 72],
    ["Estatus actual de instalaciones", 24], ["Reporte nuevo", 72],
  ];

  // [categoría, plaza, cadena, prioridad, estatus, horas atrás, solicitante, asignado,
  //  contrato, margen, propósito, descripción, movimientos [estatus, horas atrás, autor, nota]]
  const TICKETS = [
    ["Reporte nuevo", "Monterrey", "HEB", "MEDIA", "COMPLETADO", 200, "u7", "u3", "", "No aplica",
      "Ranking semanal de equipos HEB",
      "Necesito un ranking semanal de los equipos instalados en HEB Monterrey ordenado por ingreso, con la variación contra la semana anterior, para la junta de los lunes.",
      [["EN_PROCESO", 180, "u3"], ["ENTREGADO", 130, "u3", "Reporte publicado en el portal de IC"], ["COMPLETADO", 110, "u7", "Ya lo estoy usando en la junta de los lunes, ¡gracias!"]]],
    ["Solicitud de margen", "Mérida", "Chedraui", "MEDIA", "COMPLETADO", 150, "u6", "u2", "CT-02974", "Renta fija",
      "Revisión de margen Chedraui Altabrisa",
      "El gerente de plaza quiere saber si la ubicación de Chedraui Altabrisa sigue siendo rentable con la renta fija actual después de la baja de ventas de septiembre.",
      [["EN_PROCESO", 140, "u2"], ["COMPLETADO", 120, "u2", "Margen enviado por correo: sigue arriba del mínimo"]]],
    ["Análisis de ingreso", "Tijuana", "Calimax", "BAJA", "ENTREGADO", 96, "u5", "u2", "", "No aplica",
      "Ingreso semanal de la plaza Tijuana",
      "Me cambiaron a la plaza Tijuana y necesito el ingreso por tienda de las últimas 8 semanas para arrancar el seguimiento semanal.",
      [["EN_PROCESO", 90, "u2"], ["ENTREGADO", 70, "u2", "Te mandé el ingreso por tienda de las últimas 8 semanas"]]],
    ["Estatus actual de instalaciones", "CDMX Sur", "Tiendas Neto", "ALTA", "CANCELADO", 70, "u5", "u2", "", "No aplica",
      "Estatus del equipo MN-0918",
      "El equipo MN-0918 se movió de CDMX Sur a CDMX Norte hace dos semanas. Necesito confirmar si ya quedó instalado y operando en la tienda nueva.",
      [["CANCELADO", 66, "u2", "Cancelado: el movimiento ya estaba en SIA, era un retraso de actualización"]]],
    ["Cambio de renta", "Mérida", "Walmart Mexico", "ALTA", "EN_ESPERA", 60, "u7", "u3", "CT-05107", "Renta a %",
      "Propuesta de renta variable para Aurrerá Caucel",
      "El arrendador acepta cambiar a renta variable si le mostramos el histórico. Pido el ingreso mensual de los 4 equipos desde enero y la simulación al 20% y al 25%.",
      [["EN_PROCESO", 50, "u3"], ["EN_ESPERA", 40, "u3", "Se pidió el contrato vigente firmado"]]],
    ["Reporte nuevo", "Tijuana", "Soriana", "ALTA", "NUEVO", 40, "u5", null, "", "No aplica",
      "Equipos sin venta en Tijuana",
      "Necesito la lista de equipos de Tijuana que llevan más de 4 días sin venta, con su último ingreso y el técnico asignado, para armar la ruta de esta semana.",
      []],
    ["Reporte nuevo", "CDMX Norte", "Chedraui", "MEDIA", "EN_PROCESO", 30, "u6", "u2", "", "No aplica",
      "Comparativo de ingreso por línea de producto",
      "Necesito un reporte mensual que compare el ingreso de pelucheras contra máquinas de destreza en las tiendas Chedraui de CDMX Norte, últimos 6 meses, para la propuesta de cambio de mix.",
      [["EN_PROCESO", 26, "u2"]]],
    ["Solicitud de margen", "San Pedro Sula", "Walmart Guatemala", "URGENTE", "EN_PROCESO", 30, "u6", "u1", "CT-06012", "Renta fija",
      "Negociación con nuevo socio en Honduras",
      "El socio de San Pedro Sula pide bajar la renta fija de L 9,500 a L 7,000. Necesito saber si con el ingreso promedio de los últimos 3 meses seguimos arriba del margen mínimo.",
      [["EN_PROCESO", 22, "u1"]]],
    ["Margen comercial por cadena", "CDMX Norte", "Walmart Mexico", "MEDIA", "EN_ESPERA", 26, "u6", "u2", "", "No aplica",
      "Margen de Bodega Aurrerá para la nueva gerente",
      "Entró una nueva gerente a CDMX Norte y necesita el margen comercial de Bodega Aurrerá de los últimos 3 meses para su junta de arranque.",
      [["EN_PROCESO", 24, "u2"], ["EN_ESPERA", 20, "u2", "Falta que confirme si quiere incluir los equipos en mantenimiento"]]],
    ["Contratos nuevos", "Puebla", "Fibra Uno", "MEDIA", "NUEVO", 20, "u4", null, "CT-05220", "Renta mixta",
      "Contrato nuevo en plaza Angelópolis",
      "Nos ofrecen un local independiente en Angelópolis para 2 pelucheras y 1 máquina de destreza con esquema mixto. Necesito la propuesta de contrato antes del lunes.",
      []],
    ["Cambio de renta", "Guadalajara", "Chedraui", "MEDIA", "EN_PROCESO", 12, "u4", "u3", "CT-03390", "Renta fija",
      "Aumento de renta anual en Chedraui Tlaquepaque",
      "Chedraui notificó un aumento de 8% en la renta. Pido revisar si conviene aceptarlo o proponer el cambio a renta variable.",
      [["EN_PROCESO", 6, "u3"]]],
    ["Margen comercial por punto de venta", "Guadalajara", "Soriana", "URGENTE", "NUEVO", 11, "u5", null, "", "No aplica",
      "Margen de Soriana Plaza Patria",
      "Necesito el margen comercial del punto Soriana Plaza Patria (equipo MC-2231) para decidir si se mantiene o se reubica. La junta es mañana.",
      []],
    ["Renovaciones de contratos", "Monterrey", "Soriana", "BAJA", "NUEVO", 5, "u7", null, "CT-06120", "Renta a %",
      "Renovación del contrato de Soriana Lincoln",
      "El contrato CT-06120 de Soriana Lincoln vence este mes. Quieren renovar con renta variable al 18%; necesito la propuesta para presentarla.",
      []],
    ["Solicitud de margen", "Monterrey", "Tiendas Neto", "ALTA", "NUEVO", 2, "u4", null, "CT-04821", "Renta fija",
      "Renovación de contrato con Neto Cumbres",
      "La tienda Neto Cumbres pide renovar el contrato de las 3 pelucheras. Necesito el margen actual con renta fija de $1,800 y cómo quedaría con 18% de renta variable. La junta es el jueves.",
      []],
  ];

  function leer(clave) {
    try { return JSON.parse(localStorage.getItem(clave) || "null"); } catch (e) { return null; }
  }
  function escribir(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) { /* sin almacenamiento: la demo vive en memoria */ }
  }
  function borrar(clave) {
    try { localStorage.removeItem(clave); } catch (e) { /* nada */ }
  }

  let memoria = null;
  let sesionMemoria = null;

  function sembrar() {
    const ahora = Date.now();
    const anio = new Date().getFullYear();
    const catId = (n) => "c" + (CATEGORIAS.findIndex((c) => c[0] === n) + 1);
    const plazaId = (n) => "p" + (PLAZAS.indexOf(n) + 1);
    const cadenaId = (n) => "k" + (CADENAS.indexOf(n) + 1);
    const plazaDeCadena = (cadena, ciudad) => {
      const lista = (window.CATALOGO_PDV || {})[cadena] || [];
      const sin = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return lista.find((n) => sin(n).includes(sin(ciudad).split(" ")[0])) || lista[0] || null;
    };
    const nombre = (id) => USUARIOS.find((u) => u.id === id).nombre;

    const tickets = TICKETS.map((t, i) => {
      const [cat, plaza, cadena, prioridad, estatus, horas, sol, asig, contrato, margen, proposito, descripcion, movs] = t;
      const creado = ahora - horas * H;
      const sla = CATEGORIAS.find((c) => c[0] === cat)[1];
      let previo = "NUEVO";
      const movimientos = [{ de: null, a: "NUEVO", autor: nombre(sol), nota: "Solicitud creada", creadoEn: new Date(creado).toISOString() }];
      movs.forEach(([a, h, autor, nota]) => {
        movimientos.push({ de: previo, a, autor: nombre(autor), nota: nota || null, creadoEn: new Date(ahora - h * H).toISOString() });
        previo = a;
      });
      const cierre = estatus === "COMPLETADO" || estatus === "CANCELADO" ? movimientos[movimientos.length - 1] : null;
      return {
        id: "t" + (i + 1),
        folio: `IC-${anio}-${String(i + 1).padStart(6, "0")}`,
        solicitanteId: sol, asignadoId: asig,
        plazaId: plazaId(plaza), cadenaId: cadenaId(cadena), categoriaId: catId(cat),
        // plaza = un punto de venta real de la cadena (de preferencia de esa ciudad)
        pdv: plazaDeCadena(cadena, plaza), pdvId: plazaDeCadena(cadena, plaza),
        folioContrato: contrato || null, margenPara: margen || null,
        prioridad, proposito, descripcion, estatus,
        ultimoEstatusNotificado: estatus,
        creadoEn: new Date(creado).toISOString(),
        venceEn: new Date(creado + sla * H).toISOString(),
        cerradoEn: cierre ? cierre.creadoEn : null,
        cerradoPor: cierre ? cierre.autor : null,
        movimientos,
      };
    });

    // Avisos de ejemplo: a quien solicitó, por cada movimiento; a IC, por cada solicitud nueva
    const avisos = [];
    const ic = USUARIOS.filter((u) => u.rol !== "SOLICITANTE");
    tickets.forEach((t) => {
      const cat = CATEGORIAS[Number(t.categoriaId.slice(1)) - 1][0];
      ic.forEach((u) => avisos.push({
        id: `a${avisos.length + 1}`, para: u.id, ticketId: t.id, folio: t.folio, estatus: "NUEVO",
        titulo: `Nueva solicitud ${t.folio}`, texto: `${nombre(t.solicitanteId)} · ${cat}`,
        leida: ahora - new Date(t.creadoEn).getTime() > 20 * H, creadoEn: t.creadoEn,
      }));
      t.movimientos.slice(1).forEach((m) => avisos.push({
        id: `a${avisos.length + 1}`, para: t.solicitanteId, ticketId: t.id, folio: t.folio, estatus: m.a,
        titulo: `Tu solicitud ${t.folio} ahora está ${ESTATUS_TEXTO[m.a]}`,
        texto: m.nota ? `${m.autor}: “${m.nota}”` : `La movió ${m.autor}`,
        leida: ahora - new Date(m.creadoEn).getTime() > 30 * H, creadoEn: m.creadoEn,
      }));
    });

    // Conversaciones de ejemplo (chat por ticket)
    const mensajes = [];
    const conversa = (cond, lineas) => {
      const t = tickets.find(cond);
      if (!t) return;
      lineas.forEach(([quien, horas, texto]) => mensajes.push({
        id: `m${mensajes.length + 1}`, ticketId: t.id, autorId: quien, autor: nombre(quien),
        texto, creadoEn: new Date(ahora - horas * H).toISOString(), leidoPor: [quien],
      }));
    };
    conversa((t) => t.estatus === "EN_ESPERA" && t.movimientos.some((m) => /contrato vigente/.test(m.nota || "")), [
      ["u3", 58, "Hola Liliana, ya estoy revisando el cambio a renta variable de Aurrerá Caucel."],
      ["u3", 57.5, "¿Me compartes el contrato vigente firmado? Sin él no puedo simular el 20% y 25%."],
      ["u7", 40, "Claro, se lo pido a la tienda. Me dicen que hoy en la tarde me lo mandan."],
      ["u7", 6, "¿Te sirve una foto del contrato mientras llega el escaneo?"],
    ]);
    conversa((t) => t.prioridad === "URGENTE" && t.estatus === "EN_PROCESO", [
      ["u6", 30, "David, la junta con el socio de Honduras se adelantó a mañana a las 10."],
      ["u1", 29, "Entendido Leslie, te lo dejo hoy antes de las 7 pm. ¿El ingreso lo quieres en lempiras o en pesos?"],
      ["u6", 28.5, "En lempiras por favor, con su equivalente en pesos al final."],
      ["u1", 2, "Ya casi queda, solo valido el margen mínimo con Finanzas. 👍"],
    ]);
    // lo leído: cada quien ya vio lo anterior a 24 h
    mensajes.forEach((m) => { if (ahora - new Date(m.creadoEn).getTime() > 24 * H) m.leidoPor = ["u1", "u2", "u3", "u4", "u5", "u6", "u7"]; });

    return {
      anio,
      avisos,
      mensajes,
      contador: tickets.length,
      usuarios: USUARIOS,
      plazas: PLAZAS.map((n, i) => ({ id: "p" + (i + 1), nombre: n })),
      cadenas: CADENAS.map((n, i) => ({ id: "k" + (i + 1), nombre: n })),
      categorias: CATEGORIAS.map(([n, sla], i) => ({ id: "c" + (i + 1), nombre: n, slaHoras: sla })),
      tickets,
    };
  }

  const EVENTO = "tickets-ic-aviso";
  function emitirAvisos(nuevos) {
    if (nuevos.length) window.dispatchEvent(new CustomEvent(EVENTO, { detail: nuevos }));
  }
  function agregarAviso(b, a) {
    const aviso = { id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`, leida: false, creadoEn: new Date().toISOString(), ...a };
    b.avisos.push(aviso);
    return aviso;
  }

  function bd() {
    if (!memoria) memoria = leer(LLAVE);
    if (!memoria) { memoria = sembrar(); guardar(); }
    return memoria;
  }
  function guardar() { escribir(LLAVE, memoria); }
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

  function usuarioActual() {
    const id = sesionMemoria || leer(LLAVE_SESION);
    return bd().usuarios.find((u) => u.id === id) || null;
  }
  const esIC = (u) => u && (u.rol === "ANALISTA" || u.rol === "ADMIN");

  window.IC_DEMO = {
    modo: "demo",
    usuariosDemo: USUARIOS.slice(0, 4),

    async sesion() {
      const u = usuarioActual();
      return u ? { ...u } : null;
    },

    async entrar(correo, password) {
      await pausa(350);
      const u = bd().usuarios.find((x) => x.correo.toLowerCase() === String(correo).trim().toLowerCase());
      if (!u || password !== CLAVE_DEMO) throw new Error("Ese correo y contraseña no coinciden.");
      sesionMemoria = u.id;
      escribir(LLAVE_SESION, u.id);
      return { ...u };
    },

    async entrarComo(id) {
      sesionMemoria = id;
      escribir(LLAVE_SESION, id);
    },

    async salir() {
      sesionMemoria = null;
      borrar(LLAVE_SESION);
    },

    async catalogos() {
      const b = bd();
      const orden = (a, z) => a.nombre.localeCompare(z.nombre, "es");
      return {
        plazas: [...b.plazas].sort(orden),
        cadenas: [...b.cadenas].sort(orden),
        categorias: [...b.categorias].sort(orden),
      };
    },

    /** Puntos de venta de una cadena (en la demo vienen de js/catalogo-pdv.js). */
    async puntosVenta(cadenaId) {
      const c = bd().cadenas.find((x) => x.id === cadenaId);
      const lista = (c && (window.CATALOGO_PDV || {})[c.nombre]) || [];
      return lista.map((n) => ({ id: n, nombre: n }));
    },

    async crearTicket(d) {
      await pausa(500);
      const u = usuarioActual();
      if (!u) throw new Error("Tu sesión expiró. Entra de nuevo.");
      const b = bd();
      const cat = b.categorias.find((c) => c.id === d.categoriaId);
      if (!cat) throw new Error("Esa categoría ya no existe");
      const anio = new Date().getFullYear();
      if (b.anio !== anio) { b.anio = anio; b.contador = 0; }
      b.contador += 1;
      const ahora = Date.now();
      const t = {
        id: "t" + ahora,
        folio: `IC-${anio}-${String(b.contador).padStart(6, "0")}`,
        solicitanteId: u.id, asignadoId: null,
        plazaId: d.plazaId, cadenaId: d.cadenaId, categoriaId: d.categoriaId,
        pdvId: d.pdvId || null, pdv: d.pdv || null,
        folioContrato: d.folioContrato || null, margenPara: d.margenPara || null,
        prioridad: d.prioridad, proposito: d.proposito, descripcion: d.descripcion,
        detalles: d.detalles || {},
        estatus: "NUEVO", ultimoEstatusNotificado: "NUEVO",
        creadoEn: new Date(ahora).toISOString(),
        venceEn: new Date(ahora + cat.slaHoras * H).toISOString(),
        cerradoEn: null, cerradoPor: null,
        movimientos: [{ de: null, a: "NUEVO", autor: u.nombre, nota: "Solicitud creada", creadoEn: new Date(ahora).toISOString() }],
      };
      b.tickets.push(t);
      const nuevos = b.usuarios.filter((x) => x.rol !== "SOLICITANTE").map((x) => agregarAviso(b, {
        para: x.id, ticketId: t.id, folio: t.folio, estatus: "NUEVO",
        titulo: `Nueva solicitud ${t.folio}`, texto: `${u.nombre} · ${cat.nombre}`,
      }));
      guardar();
      emitirAvisos(nuevos);
      return { folio: t.folio, correo: "simulado" };
    },

    async tickets() {
      await pausa(250);
      const u = usuarioActual();
      if (!u) return [];
      const b = bd();
      const nom = (lista, id) => (lista.find((x) => x.id === id) || {}).nombre || "—";
      return b.tickets
        .filter((t) => esIC(u) || t.solicitanteId === u.id)
        .sort((a, z) => z.creadoEn.localeCompare(a.creadoEn))
        .map((t) => ({
          id: t.id, folio: t.folio,
          plaza: t.pdv || nom(b.plazas, t.plazaId), cadena: nom(b.cadenas, t.cadenaId), categoria: nom(b.categorias, t.categoriaId),
          pdv: t.pdv || null,
          folioContrato: t.folioContrato, margenPara: t.margenPara, detalles: t.detalles || {},
          prioridad: t.prioridad, estatus: t.estatus, proposito: t.proposito, descripcion: t.descripcion,
          solicitante: nom(b.usuarios, t.solicitanteId),
          solicitanteCorreo: (b.usuarios.find((x) => x.id === t.solicitanteId) || {}).correo || "",
          asignado: t.asignadoId ? nom(b.usuarios, t.asignadoId) : null,
          asignadoId: t.asignadoId || null,
          creadoEn: t.creadoEn, venceEn: t.venceEn,
          movimientos: t.movimientos.map((m) => ({ a: m.a, autor: m.autor, nota: m.nota, creadoEn: m.creadoEn })),
        }));
    },

    async cambiarEstatus(id, nuevo, nota, opciones = {}) {
      await pausa(400);
      const u = usuarioActual();
      if (!u) throw new Error("Tu sesión expiró");
      memoria = null; // relee: otra persona de IC pudo moverlo hace un momento
      const b = bd();
      const t = b.tickets.find((x) => x.id === id);
      if (!t) throw new Error("Ese ticket ya no existe");
      const confirma = !esIC(u) && t.solicitanteId === u.id && t.estatus === "ENTREGADO" && ["COMPLETADO", "EN_PROCESO"].includes(nuevo);
      if (!esIC(u) && !confirma) throw new Error("Solo Inteligencia Comercial puede mover el estatus");
      // Candado para "Tomar": solo si sigue sin dueño
      if (opciones.tomar && (t.estatus !== "NUEVO" || (t.asignadoId && t.asignadoId !== u.id))) {
        const quien = (b.usuarios.find((x) => x.id === t.asignadoId) || {}).nombre;
        throw new Error(quien ? `${quien} ya lo tomó hace un momento` : "Alguien más ya lo movió; se actualizó la lista");
      }
      if (t.estatus === nuevo) return { sinCambio: true };
      const cerrando = nuevo === "COMPLETADO" || nuevo === "CANCELADO";
      const ahora = new Date().toISOString();
      const limpia = String(nota || "").trim().slice(0, 500) || null;
      t.movimientos.push({ de: t.estatus, a: nuevo, autor: u.nombre, nota: limpia, creadoEn: ahora });
      t.estatus = nuevo;
      t.cerradoEn = cerrando ? ahora : null;
      t.cerradoPor = cerrando ? u.nombre : null;
      if (esIC(u)) t.asignadoId = t.asignadoId || u.id;
      if (nuevo === "ENTREGADO" && !t.entregadoEn) t.entregadoEn = ahora;
      // Mismo candado anti-spam que en la Edge Function.
      const avisar = t.ultimoEstatusNotificado !== nuevo;
      t.ultimoEstatusNotificado = nuevo;
      let avisos;
      if (confirma) {
        // el ejecutivo confirma o pide algo más: avisa a quien lo atiende (o a todo IC)
        const para = t.asignadoId ? [t.asignadoId] : b.usuarios.filter((x) => esIC(x)).map((x) => x.id);
        avisos = para.map((id) => agregarAviso(b, {
          para: id, ticketId: t.id, folio: t.folio, estatus: nuevo,
          titulo: nuevo === "COMPLETADO" ? `✅ ${u.nombre.split(" ")[0]} confirmó y cerró ${t.folio}` : `↩ ${u.nombre.split(" ")[0]} necesita algo más en ${t.folio}`,
          texto: limpia ? `“${limpia}”` : (nuevo === "COMPLETADO" ? "Su proceso quedó completo" : "Regresó a En proceso"),
        }));
      } else {
        avisos = [agregarAviso(b, {
          para: t.solicitanteId, ticketId: t.id, folio: t.folio, estatus: nuevo,
          titulo: nuevo === "ENTREGADO" ? `📦 IC te entregó ${t.folio} · confírmalo al terminar tu proceso` : `Tu solicitud ${t.folio} ahora está ${ESTATUS_TEXTO[nuevo]}`,
          texto: limpia ? `${u.nombre}: “${limpia}”` : `La movió ${u.nombre}`,
        })];
      }
      guardar();
      emitirAvisos(avisos);
      return { avisado: avisar };
    },

    async avisos() {
      const u = usuarioActual();
      if (!u) return [];
      memoria = null; // relee por si otra pestaña cambió algo
      return bd().avisos.filter((a) => a.para === u.id)
        .sort((a, z) => z.creadoEn.localeCompare(a.creadoEn)).slice(0, 30).map((a) => ({ ...a }));
    },

    async marcarLeidos() {
      const u = usuarioActual();
      if (!u) return;
      memoria = null;
      bd().avisos.forEach((a) => { if (a.para === u.id) a.leida = true; });
      guardar();
    },

    /** Avisos al instante: en esta pestaña y en otras pestañas del mismo navegador. */
    suscribir(alLlegar) {
      let conocidos = null;
      const revisar = (lista) => {
        const u = usuarioActual();
        if (!u) return;
        lista.filter((a) => a.para === u.id && (!conocidos || !conocidos.has(a.id))).forEach((a) => {
          if (conocidos) conocidos.add(a.id);
          alLlegar({ ...a });
        });
      };
      const inicio = () => {
        const u = usuarioActual();
        conocidos = new Set(bd().avisos.filter((a) => u && a.para === u.id).map((a) => a.id));
      };
      inicio();
      const enEsta = (e) => revisar(e.detail);
      const enOtra = (e) => {
        if (e.key !== LLAVE) return;
        memoria = null;
        revisar(bd().avisos);
      };
      window.addEventListener(EVENTO, enEsta);
      window.addEventListener("storage", enOtra);
      return () => { window.removeEventListener(EVENTO, enEsta); window.removeEventListener("storage", enOtra); };
    },

    /** Quiénes forman el equipo de IC. */
    async equipo() {
      return bd().usuarios.filter((x) => esIC(x)).map((x) => ({ id: x.id, nombre: x.nombre }));
    },

    /** Pasar un ticket a otra persona de IC, con nota opcional. */
    async reasignar(id, paraId, nota) {
      await pausa(350);
      const u = usuarioActual();
      if (!u || !esIC(u)) throw new Error("Solo Inteligencia Comercial puede reasignar");
      memoria = null;
      const b = bd();
      const t = b.tickets.find((x) => x.id === id);
      const para = b.usuarios.find((x) => x.id === paraId);
      if (!t || !para) throw new Error("No se encontró el ticket o la persona");
      if (t.asignadoId === paraId) return { sinCambio: true };
      const limpia = String(nota || "").trim().slice(0, 500);
      t.asignadoId = paraId;
      t.movimientos.push({ de: t.estatus, a: t.estatus, autor: u.nombre, nota: `Reasignado a ${para.nombre}${limpia ? `: ${limpia}` : ""}`, creadoEn: new Date().toISOString() });
      const avisos = [];
      if (paraId !== u.id) avisos.push(agregarAviso(b, {
        para: paraId, ticketId: t.id, folio: t.folio, estatus: t.estatus,
        titulo: `${u.nombre.split(" ")[0]} te asignó ${t.folio}`, texto: limpia ? `“${limpia}”` : "Ya está en tu lista de Mías",
      }));
      guardar();
      emitirAvisos(avisos);
      return { ok: true };
    },

    // ------------------------------------------------------------ chat por ticket
    async mensajes(ticketId) {
      const u = usuarioActual();
      memoria = null;
      const b = bd();
      const t = b.tickets.find((x) => x.id === ticketId);
      if (!u || !t || (!esIC(u) && t.solicitanteId !== u.id)) return [];
      return (b.mensajes || []).filter((m) => m.ticketId === ticketId)
        .sort((a, z) => a.creadoEn.localeCompare(z.creadoEn))
        .map((m) => ({ ...m, mio: m.autorId === u.id, esIC: esIC(b.usuarios.find((x) => x.id === m.autorId)),
          // "visto" cuando alguien más del otro lado ya lo leyó
          visto: m.leidoPor.some((id) => id !== m.autorId) }));
    },

    async enviarMensaje(ticketId, texto) {
      const u = usuarioActual();
      if (!u) throw new Error("Tu sesión expiró");
      memoria = null;
      const b = bd();
      const t = b.tickets.find((x) => x.id === ticketId);
      if (!t || (!esIC(u) && t.solicitanteId !== u.id)) throw new Error("No puedes escribir en este ticket");
      const limpio = String(texto || "").trim().slice(0, 2000);
      if (!limpio) return null;
      b.mensajes = b.mensajes || [];
      const m = { id: `m${Date.now()}`, ticketId, autorId: u.id, autor: u.nombre, texto: limpio, creadoEn: new Date().toISOString(), leidoPor: [u.id] };
      b.mensajes.push(m);
      // avisa al otro lado: a quien solicitó, o a quien atiende (o a todo IC si nadie la ha tomado)
      const para = esIC(u)
        ? [t.solicitanteId, t.asignadoId].filter((id) => id && id !== u.id)
        : (t.asignadoId ? [t.asignadoId] : b.usuarios.filter((x) => esIC(x)).map((x) => x.id));
      const nuevos = [...new Set(para)].map((id) => agregarAviso(b, {
        para: id, ticketId: t.id, folio: t.folio, estatus: t.estatus,
        titulo: `💬 ${u.nombre.split(" ")[0]} te escribió · ${t.folio}`, texto: limpio.length > 90 ? `${limpio.slice(0, 90)}…` : limpio,
      }));
      guardar();
      emitirAvisos(nuevos);
      window.dispatchEvent(new CustomEvent("tickets-ic-chat", { detail: { ticketId } }));
      return { ...m, mio: true, esIC: esIC(u), visto: false };
    },

    async marcarChatLeido(ticketId) {
      const u = usuarioActual();
      if (!u) return;
      memoria = null;
      const b = bd();
      let cambio = false;
      (b.mensajes || []).forEach((m) => { if (m.ticketId === ticketId && !m.leidoPor.includes(u.id)) { m.leidoPor.push(u.id); cambio = true; } });
      if (cambio) guardar();
    },

    /** Mensajes sin leer por ticket para la persona en sesión: { ticketId: n }. */
    async chatNoLeidos() {
      const u = usuarioActual();
      if (!u) return {};
      memoria = null;
      const b = bd();
      const visibles = new Set(b.tickets.filter((t) => esIC(u) || t.solicitanteId === u.id).map((t) => t.id));
      const r = {};
      (b.mensajes || []).forEach((m) => { if (visibles.has(m.ticketId) && !m.leidoPor.includes(u.id)) r[m.ticketId] = (r[m.ticketId] || 0) + 1; });
      return r;
    },

    /** Mensajes nuevos al instante (esta pestaña y otras del mismo navegador). */
    suscribirChat(alLlegar) {
      const enEsta = (e) => alLlegar(e.detail && e.detail.ticketId);
      const enOtra = (e) => { if (e.key === LLAVE) { memoria = null; alLlegar(null); } };
      window.addEventListener("tickets-ic-chat", enEsta);
      window.addEventListener("storage", enOtra);
      return () => { window.removeEventListener("tickets-ic-chat", enEsta); window.removeEventListener("storage", enOtra); };
    },

    /** Cambios hechos por otra persona (otra pestaña) en tiempo real. */
    suscribirTickets(alCambiar) {
      const enOtra = (e) => { if (e.key === LLAVE) { memoria = null; alCambiar(); } };
      window.addEventListener("storage", enOtra);
      return () => window.removeEventListener("storage", enOtra);
    },

    async reiniciar() {
      memoria = sembrar();
      guardar();
    },
  };
})();
