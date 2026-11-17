/*
 * Tickets Inteligencia Comercial · interfaz.
 * Port directo de los componentes de Next.js (FormSolicitud.tsx y Tablero.tsx)
 * a JavaScript sin framework. Mismas clases de CSS, mismo diseño.
 *
 * Rutas: #login · #nueva · #tablero
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- fuente de datos
  const cfg = window.IC_CONFIG || {};
  const conSupabase = Boolean(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY);
  const D = conSupabase ? window.IC_SUPABASE : window.IC_DEMO;

  // ---------------------------------------------------------------- etiquetas
  // ENTREGADO: IC ya dio toda la información; falta que el ejecutivo confirme que completó su proceso.
  const ESTATUS_TEXTO = { NUEVO: "Nuevo", EN_PROCESO: "En proceso", EN_ESPERA: "En espera", ENTREGADO: "Entregado", COMPLETADO: "Completado", CANCELADO: "Cancelado" };
  const ESTATUS_COLOR = { NUEVO: "var(--cielo)", EN_PROCESO: "var(--amarillo)", EN_ESPERA: "var(--naranja)", ENTREGADO: "#2BA3A3", COMPLETADO: "var(--verde)", CANCELADO: "var(--rojo)" };
  const ESTATUS_TINTA = { NUEVO: "#fff", EN_PROCESO: "#0D1B3E", EN_ESPERA: "#fff", ENTREGADO: "#fff", COMPLETADO: "#fff", CANCELADO: "#fff" };
  const ESTATUS_OSO = {
    NUEVO: "marca/oso-saluda.png", EN_PROCESO: "marca/oso-obra.png", EN_ESPERA: "marca/oso-alto.png",
    ENTREGADO: "marca/otto.png", COMPLETADO: "marca/oso-trofeo.png", CANCELADO: "marca/oso-alto.png",
  };
  const IMG = {
    saluda: "marca/oso-saluda.png", alto: "marca/oso-alto.png", semaforo: "marca/semaforo.png",
    garra: "marca/garra.png", otto: "marca/otto.png", munelocos: "marca/munelocos.png", maquina: "marca/maquina.png",
  };
  // Máquina animada: la garrita juega, la palanca se mueve y se prenden las luces.
  // Al tocarla, la garra vuelve a empezar su jugada.
  const MAQUINA_ANIM = `
    <div class="maq-anim" title="¡Toca la máquina!">
      <img src="marca/maquina.png" alt="Peluchera Muñelocos Classic">
      <i class="ma-letrero"></i>
      <i class="ma-vidrio"></i>
      <i class="ma-tubo izq"></i><i class="ma-tubo der"></i>
      <i class="ma-boton b1"></i><i class="ma-boton b2"></i>
      <i class="ma-ficha f1"></i><i class="ma-ficha f2"></i>
      <i class="ma-ventana"></i>
      <span class="mini-garra"><svg viewBox="0 250 120 210"><line x1="60" y1="250" x2="60" y2="360" stroke="#0D1B3E" stroke-width="8"/><rect x="30" y="350" width="60" height="30" rx="7" fill="#FFC62E" stroke="#0D1B3E" stroke-width="8"/><g class="mg-pinza izq"><path d="M40 378 C 16 394, 12 422, 28 448" fill="none" stroke="#0D1B3E" stroke-width="22" stroke-linecap="round"/><path d="M40 378 C 16 394, 12 422, 28 448" fill="none" stroke="#E8EDF5" stroke-width="10" stroke-linecap="round"/></g><g class="mg-pinza der"><path d="M80 378 C 104 394, 108 422, 92 448" fill="none" stroke="#0D1B3E" stroke-width="22" stroke-linecap="round"/><path d="M80 378 C 104 394, 108 422, 92 448" fill="none" stroke="#E8EDF5" stroke-width="10" stroke-linecap="round"/></g></svg></span>
    </div>`;

  // Oso del semáforo en capas: cuerpo, ojos que parpadean y mano con el pulgar.
  // Las tres luces se prenden según los tiempos; al tocarlo hace la prueba de luces.
  const semaforoAnim = (luz, titulo) => `
    <button type="button" class="sem-anim" data-luz="${luz}" title="${esc(titulo)}" aria-label="Semáforo: ${esc(titulo)}">
      <img class="sa-cuerpo" src="marca/semaforo-cuerpo.png" alt="">
      <img class="sa-ojos" src="marca/semaforo-ojos.png" alt="">
      <img class="sa-mano" src="marca/semaforo-mano.png" alt="">
      <i class="foco rojo"></i><i class="foco ambar"></i><i class="foco verde"></i>
    </button>`;

  const PRIORIDAD_TEXTO = { BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente" };
  // Semáforo de prioridad: azul baja, ámbar media, naranja rojizo alta, rojo urgente
  const PRIORIDAD_COLOR = { BAJA: "var(--p-baja)", MEDIA: "var(--p-media)", ALTA: "var(--p-alta)", URGENTE: "var(--p-urgente)" };
  const SEMAFORO = ["URGENTE", "ALTA", "MEDIA", "BAJA"]; // de arriba hacia abajo
  const ESTATUS_ORDEN = ["NUEVO", "EN_PROCESO", "EN_ESPERA", "ENTREGADO", "COMPLETADO", "CANCELADO"];
  const PRIOS = ["BAJA", "MEDIA", "ALTA", "URGENTE"];
  const ABIERTOS = ["NUEVO", "EN_PROCESO", "EN_ESPERA"];
  const POR_PAGINA = 8;

  // ---------------------------------------------------------------- utilidades
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = (v) => String(v == null ? "" : v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const iniciales = (n) => String(n || "").split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const esIC = (u) => u && (u.rol === "ANALISTA" || u.rol === "ADMIN");

  function haceCuanto(iso) {
    const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (min < 1) return "hace un momento";
    if (min < 60) return `hace ${min} min`;
    const hrs = Math.floor(min / 60);
    if (hrs < 24) return `hace ${hrs} h`;
    const dias = Math.floor(hrs / 24);
    return dias === 1 ? "ayer" : `hace ${dias} días`;
  }

  let temporizador = null;
  function avisar(titulo, sub) {
    $("#flota-t").textContent = titulo;
    $("#flota-s").textContent = sub || "";
    $("#flota").classList.add("visible");
    clearTimeout(temporizador);
    temporizador = setTimeout(() => $("#flota").classList.remove("visible"), 4400);
  }

  // ---------------------------------------------------------------- rutas
  let yo = null;

  async function ruta() {
    try {
      yo = await D.sesion();
    } catch (e) {
      yo = null;
      console.error(e);
    }
    if (!yo) { mostrarLogin(); return; }

    const pedida = location.hash.replace("#", "");
    let vista = ["nueva", "tablero", "dashboard"].includes(pedida) ? pedida : esIC(yo) ? "tablero" : "nueva";
    if (vista === "dashboard" && !esIC(yo)) vista = "tablero";
    if (pedida !== vista) history.replaceState(null, "", "#" + vista);
    mostrarApp(vista);
  }

  function ir(vista) {
    if (location.hash === "#" + vista) ruta();
    else location.hash = vista;
  }

  function limpiarHash() {
    history.replaceState(null, "", location.pathname + location.search);
  }

  window.addEventListener("hashchange", ruta);

  // ---------------------------------------------------------------- login
  const EF = window.IC_EFECTOS || { quieto: true, confeti() {}, contar(n, de, a) { if (n) n.textContent = a; }, async garra() {} };
  const OTTO = window.IC_OTTO || { iniciar() {}, detener() {}, async error() {}, async exito() {} };

  /** El login (vitrina + máquina) se escala completo para caber en cualquier pantalla. */
  function ajustarLogin() {
    const login = $("#vista-login");
    const escena = $("#vista-login .escena");
    if (!login || login.hidden || !escena) return;
    escena.style.transform = "";
    // en celular se deja con su acomodo normal (apilado, con desplazamiento)
    if (window.innerWidth < 900) { login.classList.remove("ajustado"); return; }
    login.classList.add("ajustado");
    // caja real de todo lo que se ve (la máquina y su logo sobresalen de la escena)
    const base = escena.getBoundingClientRect();
    let t = Infinity, l = Infinity, bt = -Infinity, r = -Infinity;
    [".vitrina", ".maq", ".maq > *", ".maq-marquesina *"].forEach((sel) => $$(sel, escena).forEach((el) => {
      const x = el.getBoundingClientRect();
      if (!x.width || !x.height || getComputedStyle(el).position === "fixed") return;
      t = Math.min(t, x.top); l = Math.min(l, x.left); bt = Math.max(bt, x.bottom); r = Math.max(r, x.right);
    }));
    if (!isFinite(t)) { t = base.top; l = base.left; bt = base.bottom; r = base.right; }
    const w = r - l, h = bt - t;
    const W = window.innerWidth, H = window.innerHeight;
    const k = Math.min(1.15, (W - 40) / w, (H - 24) / h);
    // centra esa caja en la pantalla
    const tx = (W - w * k) / 2 - base.left - k * (l - base.left);
    const ty = (H - h * k) / 2 - base.top - k * (t - base.top);
    escena.style.transformOrigin = "0 0";
    escena.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px) scale(${k.toFixed(4)})`;
  }
  window.addEventListener("resize", ajustarLogin);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustarLogin);

  function mostrarLogin() {
    const yaVisible = !$("#vista-login").hidden;
    $("#vista-app").hidden = true;
    $("#vista-login").hidden = false;
    requestAnimationFrame(ajustarLogin);
    if (location.hash !== "#login") history.replaceState(null, "", "#login");
    $("#login-error").hidden = true;

    if (D.modo === "demo") {
      $("#login-demo").hidden = false;
      $("#demo-accesos").innerHTML = D.usuariosDemo
        .filter((u) => u.id !== "u3")
        .map((u) => `<button type="button" data-id="${esc(u.id)}">${esc(u.nombre.split(" ")[0])}<small>${esc(rolTexto(u.rol))}</small></button>`)
        .join("");
    }
    if (!yaVisible) OTTO.iniciar();
    if (window.matchMedia("(min-width: 881px)").matches) setTimeout(() => $("#correo").focus(), 30);
  }

  function rolTexto(rol) {
    return rol === "ADMIN" ? "Admin IC" : rol === "ANALISTA" ? "Analista IC" : "Solicitante";
  }

  async function entrar() {
    const boton = $("#btn-entrar");
    const error = $("#login-error");
    error.hidden = true;
    boton.disabled = true;
    boton.textContent = "Entrando…";
    try {
      const perfil = await D.entrar($("#correo").value, $("#password").value);
      $("#password").blur();
      await OTTO.exito(perfil && perfil.nombre);
      $("#password").value = "";
      limpiarHash();
      await ruta();
    } catch (e) {
      error.textContent = e.message;
      error.hidden = false;
      OTTO.error(e.message);
    } finally {
      boton.disabled = false;
      boton.textContent = "Entrar";
    }
  }

  $("#btn-entrar").addEventListener("click", entrar);
  ["#correo", "#password"].forEach((s) =>
    $(s).addEventListener("keydown", (e) => { if (e.key === "Enter") entrar(); }));
  $("#demo-accesos").addEventListener("click", async (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    await D.entrarComo(b.dataset.id);
    const u = D.usuariosDemo.find((x) => x.id === b.dataset.id);
    await OTTO.exito(u && u.nombre);
    limpiarHash();
    ruta();
  });

  // ---------------------------------------------------------------- avisos (campana y navegador)
  const AV = { lista: [], quitar: null, activo: false, abierto: false };
  const ICONO_ESTATUS = {
    NUEVO: '<path d="M12 5v14M5 12h14"/>',
    EN_PROCESO: '<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="9"/>',
    EN_ESPERA: '<path d="M10 8v8M14 8v8"/><circle cx="12" cy="12" r="9"/>',
    COMPLETADO: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    CANCELADO: '<path d="M7 7l10 10M17 7L7 17"/>',
  };
  const iconoAviso = (e) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${ICONO_ESTATUS[e] || ICONO_ESTATUS.NUEVO}</svg>`;

  function pintarCampana() {
    const n = AV.lista.filter((a) => !a.leida).length;
    const globo = $("#campana-n");
    globo.hidden = n === 0;
    globo.textContent = n > 9 ? "9+" : String(n);
    $("#btn-campana").setAttribute("aria-label", n ? `Novedades: ${n} sin leer` : "Novedades");
    $("#avisos-lista").innerHTML = AV.lista.length === 0
      ? `<div class="avisos-vacio">${MAQUINA_ANIM}<p>Aún no hay novedades. Aquí verás cada movimiento de tus solicitudes.</p></div>`
      : AV.lista.map((a) => `
        <button type="button" class="aviso${a.leida ? "" : " nuevo"}" data-folio="${esc(a.folio || "")}" data-chat="${String(a.titulo || "").startsWith("💬") ? "1" : ""}" style="--c:${ESTATUS_COLOR[a.estatus] || "var(--cielo)"}">
          <span class="aviso-ico">${iconoAviso(a.estatus)}</span>
          <span class="aviso-txt"><b>${esc(a.titulo)}</b>${a.texto ? `<small>${esc(a.texto)}</small>` : ""}<em>${haceCuanto(a.creadoEn)}</em></span>
        </button>`).join("");
    pintarBotonNavegador();
  }

  function pintarBotonNavegador() {
    const b = $("#avisos-nav");
    if (!("Notification" in window)) { b.textContent = "Este navegador no permite avisos de Windows"; b.disabled = true; return; }
    const p = Notification.permission;
    b.disabled = p !== "default";
    b.classList.toggle("ok", p === "granted");
    b.textContent = p === "granted" ? "✓ Avisos de Windows activados" : p === "denied" ? "Avisos de Windows bloqueados en el navegador" : "Activar avisos de Windows";
  }

  function avisoNavegador(a) {
    try {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const n = new Notification(a.titulo, { body: a.texto || "", tag: `ic-${a.id}` });
      n.onclick = () => { window.focus(); abrirAviso(a.folio); n.close(); };
    } catch (e) { /* algunos navegadores lo bloquean dentro de marcos */ }
  }

  function llegaAviso(a) {
    AV.lista = [a, ...AV.lista.filter((x) => x.id !== a.id)].slice(0, 30);
    pintarCampana();
    const c = $("#btn-campana");
    if (!EF.quieto) { c.classList.remove("suena"); void c.offsetWidth; c.classList.add("suena"); }
    avisar(a.titulo, a.texto || "");
    avisoNavegador(a);
  }

  async function iniciarAvisos() {
    if (AV.activo || !D.avisos) return;
    AV.activo = true;
    try { AV.lista = await D.avisos(); } catch (e) { AV.lista = []; }
    pintarCampana();
    const n = AV.lista.filter((a) => !a.leida).length;
    if (n) {
      setTimeout(() => {
        avisar(`Tienes ${n} ${n === 1 ? "novedad" : "novedades"}`, "Revísalas en la campana");
        const c = $("#btn-campana");
        if (!EF.quieto) { c.classList.remove("suena"); void c.offsetWidth; c.classList.add("suena"); }
      }, 900);
    }
    AV.quitar = D.suscribir ? D.suscribir(llegaAviso) : null;
  }

  function detenerAvisos() {
    if (AV.quitar) AV.quitar();
    AV.quitar = null;
    AV.activo = false;
    AV.lista = [];
    cerrarAvisos();
  }

  function abrirAvisos() {
    AV.abierto = true;
    $("#avisos-panel").hidden = false;
    $("#btn-campana").setAttribute("aria-expanded", "true");
    pintarCampana();
    // al abrir se dan por vistos; los puntitos se quedan hasta cerrar
    if (AV.lista.some((a) => !a.leida)) {
      D.marcarLeidos();
      AV.lista.forEach((a) => { a.leida = true; });
      $("#campana-n").hidden = true;
    }
  }
  function cerrarAvisos() {
    AV.abierto = false;
    $("#avisos-panel").hidden = true;
    $("#btn-campana").setAttribute("aria-expanded", "false");
  }
  function abrirAviso(folio, chat = false) {
    cerrarAvisos();
    if (!folio) return;
    if (chat) tablero.pestana = "chat";
    tablero.folioPedido = folio;
    tablero.selId = null;
    ir("tablero");
  }

  $("#btn-campana").addEventListener("click", (e) => {
    e.stopPropagation();
    if (AV.abierto) cerrarAvisos(); else abrirAvisos();
  });
  $("#avisos-lista").addEventListener("click", (e) => {
    const b = e.target.closest(".aviso");
    if (b) abrirAviso(b.dataset.folio, b.dataset.chat === "1");
  });
  $("#avisos-leer").addEventListener("click", () => {
    D.marcarLeidos();
    AV.lista.forEach((a) => { a.leida = true; });
    pintarCampana();
  });
  $("#avisos-nav").addEventListener("click", async () => {
    if (!("Notification" in window)) return;
    try {
      const r = await Notification.requestPermission();
      pintarBotonNavegador();
      if (r === "granted") avisoNavegador({ id: "prueba", titulo: "¡Listo! Así se verán tus avisos", texto: "Te avisaremos cuando cambie una solicitud." });
    } catch (e) { pintarBotonNavegador(); }
  });
  document.addEventListener("click", (e) => {
    if (AV.abierto && !e.target.closest("#avisos")) cerrarAvisos();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && AV.abierto) cerrarAvisos(); });

  // ---------------------------------------------------------------- salir con Otto
  const dlgSalir = {
    fondo: $("#dlg-salir"),
    titulo: $("#dlg-titulo"),
    txt: $("#dlg-txt"),
    quedar: $("#dlg-quedar"),
    confirmar: $("#dlg-confirmar"),
    escribiendo: null,
    abierto: false,
  };
  function escribirDlg(texto) {
    clearInterval(dlgSalir.escribiendo);
    if (EF.quieto) { dlgSalir.txt.textContent = texto; return; }
    dlgSalir.txt.textContent = "";
    let i = 0;
    dlgSalir.escribiendo = setInterval(() => {
      i += 1;
      dlgSalir.txt.textContent = texto.slice(0, i);
      if (i >= texto.length) clearInterval(dlgSalir.escribiendo);
    }, 22);
  }
  function abrirSalir() {
    const f = dlgSalir.fondo;
    dlgSalir.abierto = true;
    f.hidden = false;
    f.classList.remove("cierra", "me-quedo", "me-voy");
    void f.offsetWidth;
    f.classList.add("abre");
    dlgSalir.quedar.disabled = false;
    dlgSalir.confirmar.disabled = false;
    dlgSalir.titulo.textContent = "¿Ya te vas?";
    dlgSalir.txt.textContent = "";
    setTimeout(() => escribirDlg("¿Confirmas que deseas salir de la aplicación Tickets Inteligencia Comercial?"), EF.quieto ? 0 : 450);
    setTimeout(() => dlgSalir.quedar.focus(), 60);
  }
  function cerrarSalir() {
    const f = dlgSalir.fondo;
    if (!dlgSalir.abierto) return;
    dlgSalir.abierto = false;
    clearInterval(dlgSalir.escribiendo);
    f.classList.add("cierra");
    setTimeout(() => { f.hidden = true; f.classList.remove("abre", "cierra", "me-quedo", "me-voy"); }, EF.quieto ? 0 : 260);
    $("#btn-salir").focus();
  }
  function quedarse() {
    if (!dlgSalir.abierto || dlgSalir.quedar.disabled) return;
    dlgSalir.quedar.disabled = true;
    dlgSalir.confirmar.disabled = true;
    dlgSalir.fondo.classList.add("me-quedo");
    dlgSalir.titulo.textContent = "¡Qué gusto!";
    escribirDlg("Sigo aquí contigo.");
    setTimeout(cerrarSalir, EF.quieto ? 0 : 1100);
  }
  async function confirmarSalida() {
    if (!dlgSalir.abierto || dlgSalir.confirmar.disabled) return;
    dlgSalir.quedar.disabled = true;
    dlgSalir.confirmar.disabled = true;
    dlgSalir.fondo.classList.add("me-voy");
    const nombre = yo && yo.nombre ? yo.nombre.split(" ")[0] : "";
    dlgSalir.titulo.textContent = nombre ? `¡Hasta pronto, ${nombre}!` : "¡Hasta pronto!";
    escribirDlg("Aquí te espero para tu próxima solicitud.");
    await new Promise((r) => setTimeout(r, EF.quieto ? 0 : 1500));
    dlgSalir.abierto = true;
    cerrarSalir();
    detenerAvisos();
    quitarOttoAyuda();
    await D.salir();
    yo = null;
    catalogos = null;
    mostrarLogin();
  }
  $("#btn-salir").addEventListener("click", abrirSalir);
  dlgSalir.quedar.addEventListener("click", quedarse);
  dlgSalir.confirmar.addEventListener("click", confirmarSalida);
  dlgSalir.fondo.addEventListener("click", (e) => { if (e.target === dlgSalir.fondo) quedarse(); });
  document.addEventListener("keydown", (e) => {
    if (!dlgSalir.abierto) return;
    if (e.key === "Escape") { e.preventDefault(); quedarse(); }
    if (e.key === "Tab") {
      // el foco se queda dentro del cuadro
      const bs = [dlgSalir.quedar, dlgSalir.confirmar];
      const i = bs.indexOf(document.activeElement);
      e.preventDefault();
      bs[(i + (e.shiftKey ? -1 : 1) + bs.length) % bs.length].focus();
    }
  });

  $("#btn-reiniciar").addEventListener("click", async () => {
    if (!D.reiniciar) return;
    await D.reiniciar();
    tablero.selId = null;
    avisar("Datos de demo reiniciados", "Volvieron los tickets de prueba");
    ruta();
  });

  // ---------------------------------------------------------------- marco de la app
  // En celular el detalle se abre como hoja que entra desde la derecha
  const esMovil = () => window.matchMedia("(max-width: 760px)").matches;
  function abrirHoja() {
    const t = $(".tablero");
    if (!t) return;
    t.classList.add("ver-detalle");
    document.body.classList.add("hoja-abierta");
    const det = $("#t-detalle");
    if (det) det.scrollTop = 0;
  }
  function cerrarHoja() {
    const t = $(".tablero");
    if (t) t.classList.remove("ver-detalle");
    document.body.classList.remove("hoja-abierta");
  }
  document.addEventListener("click", (e) => {
    if (tablero.pop && !e.target.closest(".pop-ancla") && $("#t-detalle")) { tablero.pop = null; pintarDetalle(); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && tablero.pop) { tablero.pop = null; pintarDetalle(); return; }
    if (e.key !== "Escape" || $("#dlg-salir").classList.contains("abre")) return;
    cerrarHoja();
    if ($("#db") && Object.keys(dash.filtros).length) { dash.filtros = {}; pintarDashboard(false); }
  });
  document.addEventListener("click", (e) => {
    const m = e.target.closest(".maq-anim, .maq-oso-anim");
    if (!m || EF.quieto || !m.getAnimations) return;
    m.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = 0; });
    m.classList.remove("toque"); void m.offsetWidth; m.classList.add("toque");
  });
  window.matchMedia("(max-width: 760px)").addEventListener("change", (e) => { if (!e.matches) cerrarHoja(); });

  let vistaActual = "nueva";
  async function actualizarTodo() {
    const b = $("#btn-actualizar");
    if (b.classList.contains("gira")) return;
    b.classList.add("gira");
    try {
      if (vistaActual === "dashboard") { dash.tickets = await D.tickets(); dash.actualizado = Date.now(); pintarDashboard(false); }
      else if (vistaActual === "tablero") { tablero.tickets = await D.tickets(); pintarTodo(); }
      else { catalogos = await D.catalogos(); }
      if (D.avisos) { AV.lista = await D.avisos(); pintarCampana(); }
      avisar("Datos actualizados", "Ya tienes lo más reciente");
    } catch (e) {
      avisar("No se pudo actualizar", e.message);
    } finally {
      setTimeout(() => b.classList.remove("gira"), 400);
    }
  }
  $("#btn-actualizar").addEventListener("click", actualizarTodo);

  function mostrarApp(vista) {
    vistaActual = vista;
    OTTO.detener();
    if (vista !== "nueva") quitarOttoAyuda();
    if (vista !== "tablero" && tablero.quitarRT) { tablero.quitarRT(); tablero.quitarRT = null; }
    if (vista !== "tablero" && tablero.quitarChat) { tablero.quitarChat(); tablero.quitarChat = null; }
    if (typeof dash !== "undefined") clearInterval(dash.timer);
    cerrarHoja();
    $("#vista-login").hidden = true;
    $("#vista-app").hidden = false;
    $("#cinta-demo").hidden = D.modo !== "demo";
    $("#yo-nombre").textContent = yo.nombre;
    $("#yo-rol").textContent = rolTexto(yo.rol);
    $("#yo-cara").textContent = iniciales(yo.nombre);

    const tabs = [["nueva", "Nueva solicitud"], ["tablero", esIC(yo) ? "Tablero" : "Mis solicitudes"]];
    if (esIC(yo)) tabs.push(["dashboard", "Dashboard"]);
    $("#tabs").innerHTML = tabs
      .map(([id, txt]) => `<button type="button" role="tab" data-vista="${id}" aria-selected="${vista === id}">${txt}</button>`)
      .join("");

    document.body.classList.add("vista-fija");
    document.body.classList.toggle("es-ic", esIC(yo));
    iniciarAvisos();
    if (vista === "tablero") vistaTablero();
    else if (vista === "dashboard") vistaDashboard();
    else vistaNueva();
  }

  $("#tabs").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-vista]");
    if (b && b.getAttribute("aria-selected") !== "true") ir(b.dataset.vista);
  });

  function cargandoVista() {
    // Sin pantalla de carga: el contenido aparece directo en cuanto llegan los datos.
    $("#contenido").innerHTML = "";
  }

  function errorVista(texto) {
    $("#contenido").innerHTML =
      `<div class="cargando-vista"><img src="marca/oso-alto.png" alt="">${esc(texto)}</div>`;
  }

  // ================================================================ NUEVA SOLICITUD
  let catalogos = null;
  let form = null;

  // ---------- íconos de línea (estilo Microsoft) ----------
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONO = {
    pin: svg('<path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>'),
    tienda: svg('<path d="M4 9l1.5-4h13L20 9"/><path d="M4 9h16v1.5a2.7 2.7 0 0 1-5.3 0 2.7 2.7 0 0 1-5.4 0A2.7 2.7 0 0 1 4 10.5z"/><path d="M5.5 13v7h13v-7"/><path d="M10 20v-4h4v4"/>'),
    documento: svg('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M9 13h6M9 17h4"/>'),
    porcentaje: svg('<circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="17" r="2.5"/><path d="M19 5L5 19"/>'),
    ubicacion: svg('<path d="M12 21s-6-5.6-6-11a6 6 0 1 1 12 0c0 5.4-6 11-6 11z"/><path d="M12 7.5v5M9.5 10h5"/>'),
    moneda: svg('<circle cx="12" cy="12" r="9"/><path d="M14.8 9.4c-.5-.9-1.5-1.4-2.8-1.4-1.6 0-2.8.8-2.8 2 0 2.7 5.6 1.3 5.6 4 0 1.2-1.2 2-2.8 2-1.3 0-2.4-.6-2.9-1.5M12 6.5V8M12 16v1.5"/>'),
    reporte: svg('<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8.5 16.5v-3M12 16.5v-7M15.5 16.5v-5"/>'),
    lapiz: svg('<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14 7l3 3"/>'),
    llave: svg('<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>'),
    etiqueta: svg('<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'),
    correo: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'),
    reloj: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
    ticket: svg('<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/><path d="M9 6.5v2M9 11v2M9 15.5v2"/>'),
    palomita: svg('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  };
  // Íconos de línea para los tipos nuevos
  const icoL = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ICONO_TIPO = {
    contratoNuevo: icoL('<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 12v6M9 15h6"/>'),
    renovacion: icoL('<path d="M20 11a8 8 0 0 0-14.6-4.5L4 8"/><path d="M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.6 4.5L20 16"/><path d="M20 20v-4h-4"/>'),
    ingreso: icoL('<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>'),
    proyecto: icoL('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M8 14h8"/>'),
    local: icoL('<path d="M3 21h18"/><path d="M5 21V9l7-5 7 5v12"/><path d="M10 21v-6h4v6"/>'),
    instalacion: icoL('<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4z"/>'),
  };
  function iconoCategoria(nombre) {
    const n = String(nombre).toLowerCase();
    if (n.includes("punto de venta")) return ICONO.pin;
    if (n.includes("margen") && n.includes("producto")) return icoL('<path d="M21 8l-9-5-9 5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>');
    if (n.includes("margen") && n.includes("cadena")) return ICONO.tienda;
    if (n.includes("margen")) return ICONO.porcentaje;
    if (n.includes("contratos nuevos") || n.includes("contrato nuevo")) return ICONO_TIPO.contratoNuevo;
    if (n.includes("renovaci")) return ICONO_TIPO.renovacion;
    if (n.includes("renta")) return ICONO.moneda;
    if (n.includes("ingreso")) return ICONO_TIPO.ingreso;
    if (n.includes("proyecto")) return ICONO_TIPO.proyecto;
    if (n.includes("local")) return ICONO_TIPO.local;
    if (n.includes("instalaci")) return ICONO_TIPO.instalacion;
    if (n.includes("reporte")) return ICONO.reporte;
    if (n.includes("ubicaci")) return ICONO.ubicacion;
    return ICONO.etiqueta;
  }

  /*
   * Guía por tipo de solicitud: qué se le pregunta al ejecutivo, con ejemplos.
   * Pensado para que cualquiera de Comercialización sepa qué escribir.
   *   esquema: pide el esquema de renta · contrato: el folio de contrato es obligatorio
   *   campos: datos específicos de ese tipo (van a "detalles" del ticket)
   */
  const PERIODOS_OPC = ["Último mes", "Últimos 3 meses", "Últimos 6 meses", "Año en curso", "Año anterior"];
  const CAMPO_PERIODO = { k: "periodo", t: "Periodo a revisar", tipo: "opciones", ops: PERIODOS_OPC, req: true };
  const GUIA_CAT = {
    "Contratos nuevos": {
      grupo: "Contratos y renta", esquema: true,
      ayuda: "Para un punto nuevo que quieren firmar: condiciones, renta y equipos.",
      campos: [{ k: "ubicacion", t: "Tienda o ubicación", tipo: "texto", req: true, ph: "Ej. Soriana Lincoln" }],
      para: "Ej. Contrato nuevo en Soriana Lincoln",
      desc: "Ej. Nos ofrecen el local para 3 pelucheras con renta variable. Necesito la propuesta de contrato para el viernes.",
    },
    "Renovaciones de contratos": {
      grupo: "Contratos y renta", esquema: true,
      ayuda: "Para un contrato que está por vencer y se quiere renovar.",
      campos: [{ k: "vence", t: "¿Cuándo vence?", tipo: "fecha" }],
      para: "Ej. Renovación del contrato de Soriana Lincoln",
      desc: "Ej. El contrato vence este mes y quieren renovar con 18% variable. Necesito la propuesta para presentarla el jueves.",
    },
    "Cambio de renta": {
      grupo: "Contratos y renta", esquema: true,
      ayuda: "Cuando la tienda pide subir, bajar o cambiar el tipo de renta.",
      campos: [],
      para: "Ej. Aumento de renta en Chedraui Tlaquepaque",
      desc: "Ej. Chedraui notificó un aumento de 8%. Pido revisar si conviene aceptarlo o proponer renta variable. Respuesta antes del lunes.",
    },
    "Solicitud de margen": {
      grupo: "Márgenes", esquema: true,
      ayuda: "Margen de una negociación puntual, con el esquema de renta que se quiere evaluar.",
      campos: [],
      para: "Ej. Margen para renegociar con Tiendas Neto",
      desc: "Ej. Necesito el margen actual y cómo quedaría con renta variable al 15%. La junta es el jueves.",
    },
    "Margen comercial por producto": {
      grupo: "Márgenes", alcance: true,
      ayuda: "Margen de uno o varios productos, en una sola plaza o en toda la cadena.",
      campos: [{ k: "alcance", t: "¿Qué abarca?", tipo: "opciones", ops: ["Una plaza", "Toda la cadena"], req: true },
               { k: "productos", t: "Producto(s)", tipo: "texto", req: true, ph: "Ej. Peluchera Muñelocos Classic, Destreza" }, CAMPO_PERIODO],
      para: "Ej. Margen de pelucheras en Chedraui",
      desc: "Ej. Quiero comparar el margen de las pelucheras contra las de destreza para decidir qué equipos mover.",
    },
    "Margen comercial por punto de venta": {
      grupo: "Márgenes",
      ayuda: "Margen de la plaza que elegiste en Información general, para decidir si se mantiene, crece o se reubica.",
      pdv: true,
      campos: [CAMPO_PERIODO],
      para: "Ej. Margen de Soriana Plaza Patria",
      desc: "Ej. Quiero saber si el punto deja margen suficiente para mantenerlo o si conviene reubicar los equipos.",
    },
    "Margen comercial por cadena": {
      grupo: "Márgenes",
      ayuda: "Margen de toda una cadena (la que elegiste en Información general).",
      campos: [CAMPO_PERIODO],
      para: "Ej. Margen de Bodega Aurrerá en la plaza",
      desc: "Ej. Necesito el margen de la cadena para la junta con su comprador. Si se puede, separado por tienda.",
    },
    "Análisis de ingreso": {
      grupo: "Análisis",
      ayuda: "Cómo va el ingreso, al nivel que necesites.",
      campos: [{ k: "nivel", t: "¿A qué nivel?", tipo: "opciones", ops: ["Por equipo", "Por tienda", "Por plaza", "Por cadena"], req: true }, CAMPO_PERIODO],
      para: "Ej. Ingreso por tienda de la plaza Tijuana",
      desc: "Ej. Quiero ver qué tiendas bajaron contra el mes anterior para enfocar las visitas de la semana.",
    },
    "Análisis por proyecto": {
      grupo: "Análisis",
      ayuda: "Resultados de un proyecto: ingreso, equipos instalados y avance contra la meta.",
      campos: [{ k: "proyecto", t: "Nombre del proyecto", tipo: "texto", req: true, ph: "Ej. Expansión Neto Bajío 2026" }, CAMPO_PERIODO],
      para: "Ej. Resultados del proyecto Neto Bajío",
      desc: "Ej. Necesito el avance del proyecto contra la meta y qué tiendas van abajo, para el comité del mes.",
    },
    "Análisis de locales": {
      grupo: "Análisis",
      ayuda: "Para evaluar un local: si conviene abrir uno nuevo o cómo va uno que ya opera.",
      campos: [{ k: "local", t: "Local o ubicación", tipo: "texto", req: true, ph: "Ej. Local 14, Plaza Sendero Escobedo" },
               { k: "tipoLocal", t: "El local es…", tipo: "opciones", ops: ["Nuevo (propuesto)", "Actual (ya operando)"], req: true }],
      para: "Ej. Evaluar local en Plaza Sendero Escobedo",
      desc: "Ej. Nos ofrecen el local con renta de $6,000. Quiero saber si conviene comparando con locales parecidos de la plaza.",
    },
    "Estatus actual de instalaciones": {
      grupo: "Operación y reportes",
      ayuda: "Para saber en qué va una instalación o un proyecto de instalación.",
      campos: [{ k: "alcance", t: "¿De qué tienda o proyecto?", tipo: "texto", req: true, ph: "Ej. Soriana Lincoln o proyecto Neto Bajío" }],
      para: "Ej. Estatus de instalación en Soriana Lincoln",
      desc: "Ej. La tienda pregunta cuándo quedan instalados los equipos. Necesito fecha estimada y qué falta.",
    },
    "Reporte nuevo": {
      grupo: "Operación y reportes",
      ayuda: "Un reporte que hoy no existe. Cuéntanos qué datos y para qué lo usas.",
      campos: [{ k: "frecuencia", t: "¿Cada cuándo lo ocupas?", tipo: "opciones", ops: ["Una sola vez", "Semanal", "Mensual"], req: true }],
      para: "Ej. Ranking semanal de equipos por cadena",
      desc: "Ej. Necesito un ranking de equipos por ingreso con la variación contra la semana anterior, para la junta de los lunes.",
    },
  };
  const GRUPOS_CAT = ["Contratos y renta", "Márgenes", "Análisis", "Operación y reportes"];

  // Ejemplo de "¿Qué pasó?" por tipo (el de "¿Qué necesitas?" es el campo desc de la guía)
  const PASO_EJ = {
    "Contratos nuevos": "Ej. Soriana Lincoln nos ofrece espacio para 3 pelucheras a partir del próximo mes.",
    "Renovaciones de contratos": "Ej. El contrato de Soriana Lincoln vence el 30 de noviembre y la tienda quiere renovar.",
    "Cambio de renta": "Ej. Chedraui Tlaquepaque nos notificó un aumento de 8% en la renta.",
    "Solicitud de margen": "Ej. Tiendas Neto quiere renegociar la renta de sus tiendas en la plaza.",
  };

  /*
   * Esquema de renta: qué datos pide cada uno.
   *   Renta fija  → equipos (modelo y cantidad), renta fija actual y nueva sin IVA (MXN/USD), % de mantenimiento si aplica
   *   Renta a %   → equipos (modelo y código), % de renta actual y nuevo
   *   Renta mixta → equipos (modelo y código), renta fija actual y nueva sin IVA y % de renta vigente y nuevo
   *   Al final se muestra el cálculo: diferencia en dinero y en %, y el mantenimiento.
   */
  const ESQUEMAS = ["Renta fija", "Renta a %", "Renta mixta"];
  const claveEsquema = (m) => (m === "Renta fija" ? "fija" : m === "Renta a %" ? "pct" : m === "Renta mixta" ? "mixta" : "");
  const rentaVacia = () => ({
    equipos: [{ modelo: "", codigo: "", cantidad: "1" }],
    fijaActual: "", monedaActual: "MXN", fijaNueva: "", monedaNueva: "MXN",
    pctActual: "", pctNuevo: "", pctMant: "",
  });
  /** ¿Este tipo tiene renta "actual"? (un contrato nuevo solo tiene la propuesta) */
  const tieneActual = (cat) => cat !== "Contratos nuevos";
  const numero = (v) => { const n = Number(String(v || "").replace(/[^0-9.]/g, "")); return Number.isFinite(n) && String(v || "").trim() !== "" ? n : null; };
  const dinero = (v, mon) => { const n = numero(v); return n === null ? "—" : `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${mon || "MXN"} sin IVA`; };
  const pct = (v) => { const n = numero(v); return n === null ? "—" : `${n}%`; };

  /** Revisa los datos de renta; regresa el primer problema o null. */
  function problemaRenta(r, esquemaTxt, catNombre) {
    const e = claveEsquema(esquemaTxt);
    if (!e || !r) return null;
    const conCodigo = e !== "fija";
    const eqs = (r.equipos || []).filter((q) => q.modelo || q.codigo);
    if (!eqs.length) return { campo: "renta-equipos", msg: "Agrega al menos un equipo (su modelo)" };
    const malo = eqs.find((q) => !String(q.modelo).trim() || (conCodigo && !String(q.codigo).trim()));
    if (malo) return { campo: "renta-equipos", msg: conCodigo ? "Cada equipo necesita modelo y código" : "Cada equipo necesita su modelo" };
    const actual = tieneActual(catNombre);
    if (e !== "pct") {
      if (actual && numero(r.fijaActual) === null) return { campo: "renta-fija", msg: "Escribe la renta fija actual (total sin IVA)" };
      if (numero(r.fijaNueva) === null) return { campo: "renta-fija", msg: actual ? "Escribe la renta fija nueva (total sin IVA)" : "Escribe la renta fija propuesta (total sin IVA)" };
    }
    if (e !== "fija") {
      if (actual && numero(r.pctActual) === null) return { campo: "renta-pct", msg: "Escribe el % de renta vigente" };
      if (numero(r.pctNuevo) === null) return { campo: "renta-pct", msg: actual ? "Escribe el % de renta nuevo" : "Escribe el % de renta propuesto" };
    }
    return null;
  }

  /** Solo lo que aplica al esquema elegido, listo para guardarse. */
  function rentaParaGuardar(r, esquemaTxt, catNombre) {
    const e = claveEsquema(esquemaTxt);
    if (!e || !r) return null;
    const out = {
      esquema: esquemaTxt,
      equipos: (r.equipos || []).filter((q) => q.modelo || q.codigo).map((q) => ({
        modelo: String(q.modelo).trim(),
        ...(e !== "fija" ? { codigo: String(q.codigo).trim() } : { cantidad: Math.max(1, numero(q.cantidad) || 1), ...(String(q.codigo).trim() ? { codigo: String(q.codigo).trim() } : {}) }),
      })),
    };
    const actual = tieneActual(catNombre);
    if (e !== "pct") {
      if (actual) out.fijaActual = { monto: numero(r.fijaActual), moneda: r.monedaActual || "MXN" };
      out.fijaNueva = { monto: numero(r.fijaNueva), moneda: r.monedaNueva || "MXN" };
    }
    if (e !== "fija") {
      if (actual) out.pctActual = numero(r.pctActual);
      out.pctNuevo = numero(r.pctNuevo);
    }
    if (e === "fija" && numero(r.pctMant) !== null) out.pctMantenimiento = numero(r.pctMant);
    out.totalEquipos = out.equipos.reduce((a, q) => a + (q.cantidad || 1), 0);
    return out;
  }

  /**
   * Cálculo de la renta: diferencia en dinero y en %, puntos de % y mantenimiento.
   * Recibe montos ya como números: { fijaActual, monedaActual, fijaNueva, monedaNueva, pctActual, pctNuevo, pctMant }.
   */
  function calculoRenta(c, esquema) {
    const e = claveEsquema(esquema);
    const lin = [];
    const fmt = (n, mon) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${mon}`;
    const flecha = (dif) => (dif > 0 ? '<b class="rc-sube">▲ sube</b>' : dif < 0 ? '<b class="rc-baja">▼ baja</b>' : '<b class="rc-igual">= igual</b>');
    if (e !== "pct" && c.fijaNueva !== null) {
      if (c.fijaActual === null || c.fijaActual === undefined) {
        lin.push(`<div class="rc-fila"><span>Renta fija propuesta</span><b>${fmt(c.fijaNueva, c.monedaNueva)}</b></div>`);
      } else if (c.monedaActual !== c.monedaNueva) {
        lin.push(`<div class="rc-fila rc-aviso"><span>Renta fija</span><b>No se puede comparar: una está en ${c.monedaActual} y otra en ${c.monedaNueva}</b></div>`);
      } else {
        const dif = c.fijaNueva - c.fijaActual;
        const pc = c.fijaActual ? (dif / c.fijaActual) * 100 : null;
        lin.push(`<div class="rc-fila"><span>Renta fija</span><b>${fmt(c.fijaActual, c.monedaActual)} → ${fmt(c.fijaNueva, c.monedaNueva)}</b></div>`);
        lin.push(`<div class="rc-fila rc-dif"><span>Diferencia</span>${flecha(dif)}<b>${dif >= 0 ? "+" : "−"}${fmt(Math.abs(dif), c.monedaNueva)}${pc === null ? "" : ` (${dif >= 0 ? "+" : "−"}${Math.abs(pc).toFixed(1)}%)`}</b></div>`);
      }
      if (e === "fija" && c.pctMant !== null && c.pctMant !== undefined) {
        const mN = c.fijaNueva * c.pctMant / 100;
        const actualOk = c.fijaActual !== null && c.fijaActual !== undefined && c.monedaActual === c.monedaNueva;
        const mA = actualOk ? c.fijaActual * c.pctMant / 100 : null;
        lin.push(`<div class="rc-fila"><span>Mantenimiento (${c.pctMant}% de la renta)</span><b>${mA !== null ? `${fmt(mA, c.monedaActual)} → ` : ""}${fmt(mN, c.monedaNueva)}</b></div>`);
        lin.push(`<div class="rc-fila rc-total"><span>Total renta + mantenimiento</span><b>${mA !== null ? `${fmt(c.fijaActual + mA, c.monedaActual)} → ` : ""}${fmt(c.fijaNueva + mN, c.monedaNueva)}</b></div>`);
      }
    }
    if (e !== "fija" && c.pctNuevo !== null && c.pctNuevo !== undefined) {
      if (c.pctActual === null || c.pctActual === undefined) {
        lin.push(`<div class="rc-fila"><span>% de renta propuesto</span><b>${c.pctNuevo}%</b></div>`);
      } else {
        const pts = c.pctNuevo - c.pctActual;
        const rel = c.pctActual ? (pts / c.pctActual) * 100 : null;
        lin.push(`<div class="rc-fila"><span>% de renta</span><b>${c.pctActual}% → ${c.pctNuevo}%</b></div>`);
        lin.push(`<div class="rc-fila rc-dif"><span>Diferencia</span>${flecha(pts)}<b>${pts >= 0 ? "+" : "−"}${Math.abs(pts).toFixed(2).replace(/\.?0+$/, "")} puntos${rel === null ? "" : ` (${pts >= 0 ? "+" : "−"}${Math.abs(rel).toFixed(1)}%)`}</b></div>`);
      }
      if (c.pctNuevo > 25) lin.push(`<div class="rc-fila rc-aviso"><span>Atención</span><b>La renta a % nueva pasa del 25%</b></div>`);
    }
    return lin.length ? `<div class="rc"><span class="rc-t">${ICONO_CALC}Cálculo</span>${lin.join("")}</div>` : "";
  }
  const ICONO_CALC = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h8"/></svg>';
  /** Toma lo capturado en el formulario (textos) y lo pasa a números para el cálculo. */
  const calculoDesdeForm = (r, catNombre) => ({
    fijaActual: tieneActual(catNombre) ? numero(r.fijaActual) : undefined, monedaActual: r.monedaActual || "MXN",
    fijaNueva: numero(r.fijaNueva), monedaNueva: r.monedaNueva || "MXN",
    pctActual: tieneActual(catNombre) ? numero(r.pctActual) : undefined, pctNuevo: numero(r.pctNuevo), pctMant: numero(r.pctMant),
  });
  const calculoDesdeGuardado = (r) => ({
    fijaActual: r.fijaActual ? r.fijaActual.monto : undefined, monedaActual: r.fijaActual ? r.fijaActual.moneda : "MXN",
    fijaNueva: r.fijaNueva ? r.fijaNueva.monto : null, monedaNueva: r.fijaNueva ? r.fijaNueva.moneda : "MXN",
    pctActual: r.pctActual, pctNuevo: r.pctNuevo, pctMant: r.pctMantenimiento,
  });

  /** Cómo se ve la renta guardada en el detalle del ticket. */
  function htmlRentaDetalle(r) {
    if (!r || !r.equipos) return "";
    const e = claveEsquema(r.esquema);
    const actual = r.fijaActual !== undefined || r.pctActual !== undefined;
    return `
      <div class="rd">
        <div class="rd-equipos">
          <b>Equipos · ${r.totalEquipos || r.equipos.length} en total</b>
          <table><thead><tr><th>Modelo</th><th>Código</th>${e === "fija" ? "<th>Cant.</th>" : ""}</tr></thead>
          <tbody>${r.equipos.map((q) => `<tr><td>${esc(q.producto ? `${q.producto} · ${q.modelo}` : q.modelo)}</td><td>${esc(q.codigo || "—")}</td>${e === "fija" ? `<td>${q.cantidad || 1}</td>` : ""}</tr>`).join("")}</tbody></table>
        </div>
        <table class="rd-comp"><thead><tr><th>${esc(r.esquema)}</th>${actual ? "<th>Actual</th>" : ""}<th>${actual ? "Nueva" : "Propuesta"}</th></tr></thead><tbody>
          ${r.fijaNueva ? `<tr><td>Renta fija total</td>${actual ? `<td>${dinero(r.fijaActual && r.fijaActual.monto, r.fijaActual && r.fijaActual.moneda)}</td>` : ""}<td><b>${dinero(r.fijaNueva.monto, r.fijaNueva.moneda)}</b></td></tr>` : ""}
          ${r.pctNuevo !== undefined ? `<tr><td>% de renta</td>${actual ? `<td>${pct(r.pctActual)}</td>` : ""}<td><b>${pct(r.pctNuevo)}</b></td></tr>` : ""}
          ${r.pctMantenimiento !== undefined ? `<tr><td>% de mantenimiento</td><td colspan="${actual ? 2 : 1}">${pct(r.pctMantenimiento)}</td></tr>` : ""}
        </tbody></table>
        ${calculoRenta(calculoDesdeGuardado(r), r.esquema)}
      </div>`;
  }
  const fechaLarga = (iso) => (/^\d{4}-\d{2}-\d{2}$/.test(iso || "") ? new Date(`${iso}T12:00:00`).toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "");
  const ICONO_CAL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>';
  // la fecha de solicitud se mantiene al minuto mientras se llena el formulario
  setInterval(() => { const fc = document.getElementById("f-compromiso"); if (fc) fc.innerHTML = `${ICONO_CAL}<span><b>${esc(fechaSolicitudTxt())}</b></span>`; const v = document.getElementById("vivo-fecha"); if (v && fc) v.textContent = fechaSolicitudTxt(true); }, 30000);
  /** Fecha y hora de hoy, como se registra la solicitud. */
  function fechaSolicitudTxt(corta = false) {
    const t = new Date().toLocaleString("es-MX", corta
      ? { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }
      : { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const hoyISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
  const DET_ESPECIALES = ["paraCuando", "motivoFecha", "renta"];
  const guiaDe = (nombre) => GUIA_CAT[nombre] || { grupo: "Operación y reportes", campos: [] };
  /** Nombre visible de un dato específico guardado en "detalles". */
  const etiquetaDetalle = (cat, k) => ((guiaDe(cat).campos || []).find((c) => c.k === k) || { t: k }).t;
  const textoSla = (h) => (!h ? "" : h < 24 ? `Respuesta en ${h} h` : h === 24 ? "Respuesta en 24 h" : `Respuesta en ${Math.round(h / 24)} días`);
  const llevaMargen = (nombre) => Boolean(guiaDe(nombre).esquema);
  // tiempos de respuesta: cuentan desde que la solicitud le llega a IC
  function fechaCompromiso(horas) {
    if (!horas) return "—";
    const f = new Date(Date.now() + horas * 3600000);
    const hoy = new Date();
    const dia = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const dif = Math.round((dia(f) - dia(hoy)) / 86400000);
    const hora = f.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
    if (dif === 0) return `Hoy, ${hora}`;
    if (dif === 1) return `Mañana, ${hora}`;
    const fecha = f.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "short" });
    return `${fecha.charAt(0).toUpperCase()}${fecha.slice(1)}, ${hora}`;
  }

  /**
   * Lista con buscador (para cadenas y puntos de venta, que son cientos).
   * Escribe para filtrar, flechas para moverte, Enter para elegir, Esc para cerrar.
   */
  function montarCombo({ input, lista, opciones, elegido, alElegir }) {
    let visibles = [], activo = -1;
    const nombreDe = () => { const o = opciones().find((x) => x.id === elegido()); return o ? o.nombre : ""; };
    const pintar = () => {
      const q = sinAcentosTxt(input.value.trim());
      const todas = opciones();
      const filtradas = q && input.value !== nombreDe() ? todas.filter((o) => sinAcentosTxt(o.nombre).includes(q)) : todas;
      visibles = filtradas.slice(0, 80);
      activo = Math.min(Math.max(activo, 0), visibles.length - 1);
      lista.innerHTML = visibles.length
        ? visibles.map((o, i) => `<li role="option" data-i="${i}" class="${i === activo ? "act" : ""}${o.id === elegido() ? " sel" : ""}" aria-selected="${o.id === elegido()}">${esc(o.nombre)}</li>`).join("")
          + (filtradas.length > visibles.length ? `<li class="mas">… y ${filtradas.length - visibles.length} más. Escribe para afinar la búsqueda.</li>` : "")
        : `<li class="mas">No hay coincidencias</li>`;
      lista.hidden = false;
      input.setAttribute("aria-expanded", "true");
      const a = $("li.act", lista); if (a) a.scrollIntoView({ block: "nearest" });
    };
    const cerrar = () => { lista.hidden = true; input.setAttribute("aria-expanded", "false"); };
    const elegir = (o) => { input.value = o ? o.nombre : ""; cerrar(); alElegir(o || null); };
    input.addEventListener("focus", () => { if (!input.disabled) { input.select(); activo = -1; pintar(); } });
    input.addEventListener("input", () => { activo = 0; pintar(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); if (lista.hidden) pintar(); activo = Math.min(activo + 1, visibles.length - 1); pintar(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activo = Math.max(activo - 1, 0); pintar(); }
      else if (e.key === "Enter") { if (!lista.hidden && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); } }
      else if (e.key === "Escape") { cerrar(); input.value = nombreDe(); }
    });
    lista.addEventListener("mousedown", (e) => {
      const li = e.target.closest("li[data-i]");
      if (li) { e.preventDefault(); elegir(visibles[Number(li.dataset.i)]); }
    });
    input.addEventListener("blur", () => setTimeout(() => {
      cerrar();
      if (!input.value.trim()) { if (elegido()) alElegir(null); return; }
      // si escribió algo que no es una opción, regresa a lo elegido (o acepta la coincidencia exacta)
      const exacta = opciones().find((o) => sinAcentosTxt(o.nombre) === sinAcentosTxt(input.value.trim()));
      if (exacta && exacta.id !== elegido()) elegir(exacta); else input.value = nombreDe();
    }, 120));
  }
  /** ¿La solicitud abarca toda la cadena? (entonces no se elige plaza) */
  const esTodaCadena = (d, cat) => Boolean(cat && guiaDe(cat.nombre).alcance && (d.detalles || {}).alcance === "Toda la cadena");
  const sinAcentosTxt = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const PDV_CACHE = {};

  /** Revisión campo por campo; regresa el primer problema y dónde está. */
  function validarCampos(d, categorias) {
    const cat = categorias.find((c) => c.id === d.categoriaId);
    if (!d.cadenaId) return { campo: "cadenaId", msg: "Elige la cadena" };
    if (!d.pdvId && !esTodaCadena(d, cat)) return { campo: "pdvId", msg: "Elige la plaza de la cadena" };
    if (!d.prioridad) return { campo: "prioridad", msg: "Elige la prioridad en el semáforo" };
    if (!cat) return { campo: "categoriaId", msg: "Elige el tipo de solicitud" };
    if (llevaMargen(cat.nombre) && !d.margenPara) return { campo: "margenPara", msg: "Elige el esquema de renta" };
    const guia = guiaDe(cat.nombre);
    const falta = (guia.campos || []).find((c) => c.req && !String((d.detalles || {})[c.k] || "").trim());
    if (falta) return { campo: `det-${falta.k}`, msg: `Completa: ${falta.t}` };
    if (llevaMargen(cat.nombre)) { const pr = problemaRenta(d.renta, d.margenPara, cat.nombre); if (pr) return pr; }
    if ((d.quePaso || "").trim().length < 10) return { campo: "quePaso", msg: "Cuéntanos qué pasó (mínimo 10 caracteres)" };
    if ((d.queNecesitas || "").trim().length < 10) return { campo: "queNecesitas", msg: "Cuéntanos qué necesitas (mínimo 10 caracteres)" };
    const t = `${d.quePaso} ${d.queNecesitas}`.trim();
    if (t.length > 4000) return { campo: "descripcion", msg: "La descripción es demasiado larga" };
    return null;
  }

  async function vistaNueva() {
    if (!catalogos) {
      cargandoVista();
      try { catalogos = await D.catalogos(); }
      catch (e) { errorVista(e.message); return; }
    }
    if (!form) {
      form = {
        plazaId: "", cadenaId: "", pdvId: "", pdv: "", categoriaId: "",
        folioContrato: "", margenPara: "", prioridad: "MEDIA",
        proposito: "", descripcion: "", detalles: {},
        quePaso: "", queNecesitas: "", paraCuando: "", motivoFecha: "", renta: rentaVacia(),
      };
    }
    form.enviado = null;
    pintarNueva();
  }

  const opciones = (lista, sel, vacio) =>
    `<option value="" disabled hidden${sel ? "" : " selected"}>${esc(vacio)}</option>` +
    lista.map((o) => `<option value="${esc(o.id)}"${o.id === sel ? " selected" : ""}>${esc(o.nombre)}</option>`).join("");
  const nombreDe = (lista, id) => (lista.find((o) => o.id === id) || {}).nombre || "—";

  const MAQUINA_OSO = `
    <div class="maq-oso-anim" title="¡Tócalo!">
      <img class="mo-maq" src="marca/maquina-oso-maq.png" alt="Oso jugando en una peluchera">
      <i class="mo-letrero"></i>
      <span class="mo-focos"><i></i><i></i><i></i><i></i><i></i><i></i></span>
      <i class="mo-tubo izq"></i><i class="mo-tubo der"></i>
      <i class="mo-vidrio"></i>
      <span class="mo-garra"><svg viewBox="0 250 120 210"><line x1="60" y1="250" x2="60" y2="360" stroke="#555" stroke-width="10"/><rect x="30" y="350" width="60" height="30" rx="7" fill="#d9dee8" stroke="#555" stroke-width="8"/><path d="M40 378 C 16 394, 12 422, 28 448" fill="none" stroke="#666" stroke-width="16" stroke-linecap="round"/><path d="M80 378 C 104 394, 108 422, 92 448" fill="none" stroke="#666" stroke-width="16" stroke-linecap="round"/></svg></span>
      <i class="mo-led"></i>
      <img class="mo-cuerpo" src="marca/maquina-oso-cuerpo.png" alt="">
      <img class="mo-brazo" src="marca/maquina-oso-brazo.png" alt="">
    </div>`;

  // ---------- hoja fija: el formulario se diseña a 1280 × 640 y se escala completo ----------
  const LIENZO = { ancho: 1280, alto: 640, minimo: 0.55, maximo: 2.2 };
  /** La barra de arriba crece con la pantalla (en TV o monitor grande no se ve diminuta). */
  /**
   * Tamaño de letra según la pantalla: la laptop (≈1440 px) es el tamaño normal y en pantallas
   * más grandes crece poquito (monitor ≈ 1.08×, 2K ≈ 1.2×, TV 4K ≈ 1.4×), para que no se vea ni
   * diminuta ni gigante.
   */
  const escalaUI = (w) => Math.min(1.5, Math.max(0.95, 1 + (w - 1440) / 6000));
  function ajustarBarra() {
    const z = window.innerWidth < 900 ? 1 : Math.max(1, escalaUI(window.innerWidth));
    document.documentElement.style.setProperty("--zoom-ui", z.toFixed(3));
  }
  ajustarBarra();
  window.addEventListener("resize", ajustarBarra);

  function ajustarLienzo() {
    ajustarBarra();
    const esc = $("#escenario");
    const lz = $("#lienzo");
    if (!esc || !lz) return;
    if (window.innerWidth < 900) {
      // en celular se acomoda en una sola columna para que se pueda leer
      esc.classList.remove("fijo");
      lz.style.transform = "";
      lz.style.left = "";
      esc.style.height = "";
      lz.style.width = "";
      lz.style.height = "";
      return;
    }
    esc.classList.add("fijo");
    // cada vista puede pedir su propio tamaño de diseño (el dashboard es más alto)
    const H = Number(lz.dataset.alto) || LIENZO.alto;
    const arriba = esc.getBoundingClientRect().top + window.scrollY;
    const altoDisp = window.innerHeight - arriba - 14;
    const anchoDisp = esc.clientWidth;
    let W = Number(lz.dataset.ancho) || LIENZO.ancho;
    let s;
    if (lz.dataset.adaptable === "1") {
      // "adaptable": la letra se mantiene legible en cualquier pantalla (laptop, monitor o TV).
      // La escala sale del ancho de la pantalla (1440 px = tamaño normal) y el diseño se estira
      // para llenar todo el espacio en lugar de encoger la letra.
      const deseada = escalaUI(anchoDisp);
      s = Math.max(0.82, Math.min(deseada, altoDisp / H));   // H es el alto mínimo que necesita el diseño
      W = Math.round(anchoDisp / s);
      const Hfin = Math.max(H, Math.floor(altoDisp / s));
      lz.style.width = `${W}px`;
      lz.style.height = `${Hfin}px`;
      lz.style.transform = `scale(${s})`;
      lz.style.left = "0px";
      esc.style.height = `${Hfin * s}px`;
      return;
    }
    lz.style.width = `${W}px`;
    lz.style.height = `${H}px`;
    s = Math.max(LIENZO.minimo, Math.min(anchoDisp / W, altoDisp / H, Math.max(1, escalaUI(anchoDisp) * 1.08)));
    lz.style.transform = `scale(${s})`;
    lz.style.left = `${Math.max(0, (anchoDisp - W * s) / 2)}px`;
    esc.style.height = `${H * s}px`;
  }
  window.addEventListener("resize", ajustarLienzo);

  // ================================================================ OTTO, AYUDA PARA LLENAR LA SOLICITUD
  // Asistente guiado (sin IA): explica cada campo, lo señala en pantalla y revisa qué falta.
  const AYUDA = {
    plaza: { sel: '[data-cmp="pdvId"]', foco: "#f-pdv", titulo: "Plaza",
      txt: "Primero elige la <b>cadena</b>; aquí aparecen <b>solo sus plazas</b>. Escribe parte del nombre (ej. <i>Matamoros</i> o <i>Sendero</i>) para encontrarla rápido." },
    cadena: { sel: '[data-cmp="cadenaId"]', foco: "#f-cadena", titulo: "Cadena",
      txt: "La <b>cadena</b> es el cliente donde está el equipo: Tiendas Neto, Soriana, Chedraui, Walmart… <b>Escribe parte del nombre</b> y elígela de la lista." },
    prioridad: { sel: '.bloq[data-paso="2"]', titulo: "Prioridad",
      txt: "Toca un foco del semáforo:<br>🔴 <b>Urgente</b>: detiene la operación o la junta es hoy.<br>🟠 <b>Alta</b>: se necesita en 1 o 2 días.<br>🟡 <b>Media</b>: ritmo normal.<br>🔵 <b>Baja</b>: puede esperar." },
    tipo: { sel: '.bloq[data-paso="3"]', titulo: "Tipo de solicitud",
      txt: "Están agrupados para que encuentres el tuyo rápido:<br><b>Contratos y renta</b>: contratos nuevos, renovaciones y cambios de renta.<br><b>Márgenes</b>: de una negociación, de un punto de venta o de toda la cadena.<br><b>Análisis</b>: de ingreso, de un proyecto o de un local.<br><b>Operación y reportes</b>: estatus de instalaciones o un reporte nuevo.<br>Al elegir uno, te pregunto solo los datos que ocupa ese tipo." },
    renta: { sel: "#renta-extra", titulo: "Renta y equipos",
      txt: "Al elegir el esquema te pido:<br>• <b>Renta fija</b>: equipos (modelo y cuántos), renta fija actual y nueva <b>total sin IVA</b> en MXN o USD, y el % de mantenimiento si aplica.<br>• <b>Renta a %</b>: equipos con su <b>código</b>, % de renta actual y nuevo.<br>• <b>Renta mixta</b>: equipos con código, renta fija actual y nueva sin IVA, y % vigente y nuevo." },
    descripcion: { sel: '[data-cmp="quePaso"]', foco: "#f-paso", titulo: "Detalle",
      txt: "Son dos partes cortas: <b>¿Qué pasó?</b> y <b>¿Qué necesitas?</b>. Escribe como se lo contarías a alguien de IC por teléfono. La fecha compromiso la pone el sistema." },
    para: { sel: '[data-cmp="paraCuando"]', titulo: "Fecha de solicitud",
      txt: "La <b>fecha de solicitud</b> la registra el sistema solo, con el día y la hora en que envías. No hay que elegir ninguna fecha." },
    enviar: { sel: ".repisa-envio", titulo: "Enviar",
      txt: "Cuando los 4 pasos tengan palomita, presiona <b>Enviar</b>. Te llega tu folio por correo y un aviso cada vez que cambie." },
  };
  const RECORRIDO = ["cadena", "plaza", "prioridad", "tipo", "renta", "descripcion", "para", "enviar"];
  const ICO_OA = {
    recorrido: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    falta: '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>',
    tipo: '<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    prioridad: '<rect x="8" y="2" width="8" height="20" rx="3"/><circle cx="12" cy="7" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="17" r="1.5"/>',
    descripcion: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13 7l4 4"/>',
    cadena: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9h18"/><path d="M9 20v-6h6v6"/>',
    seguimiento: '<path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  };
  const icoOA = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICO_OA[k] || ""}</svg>`;
  const PREGUNTAS = [
    { v: "recorrido", t: "Recorrido guiado", sub: "Te llevo paso a paso", grande: true },
    { v: "falta", t: "¿Qué me falta?", sub: "Reviso tu solicitud", grande: true },
    { v: "tipo", t: "¿Qué tipo de solicitud elijo?" },
    { v: "prioridad", t: "¿Qué prioridad le pongo?" },
    { v: "descripcion", t: "¿Qué escribo en la descripción?" },
    { v: "cadena", t: "¿Qué es la cadena?" },
    { v: "seguimiento", t: "¿Dónde veo mis solicitudes?" },
  ];
  const OA = { paso: -1, vistos: new Set() };

  // Palabras que Otto reconoce para saber de qué campo le hablan
  const INTENCIONES = [
    ["falta", ["falta", "faltan", "me falta", "completo", "no me deja", "no puedo enviar", "no se envia", "error", "en rojo", "que me hace falta"]],
    ["cadena", ["cadena", "cadenas", "cliente", "neto", "soriana", "chedraui", "walmart", "aurrera", "bodega", "heb", "calimax", "casa ley", "farmacias"]],
    ["plaza", ["plaza", "plazas", "punto de venta", "puntos de venta", "pdv", "tienda", "sucursal", "sendero", "ciudad"]],
    ["renta", ["equipo", "equipos", "modelo", "codigo", "producto", "iva", "usd", "mxn", "dolares", "pesos", "mantenimiento", "renta fija", "renta a", "porcentaje", "mixta"]],
    ["prioridad", ["prioridad", "urgente", "urgencia", "semaforo", "rapido", "importante", "foco", "alta", "baja", "media"]],
    ["tipo", ["tipo", "categoria", "margen", "renta", "reporte", "esquema", "fija", "variable", "mixto", "que elijo", "cual escojo", "escoger",
      "renovacion", "renovar", "contrato nuevo", "contratos nuevos", "punto de venta", "ingreso", "proyecto", "local", "locales", "instalacion", "instalaciones", "analisis"]],
    ["para", ["para cuando", "fecha", "cuando", "plazo", "dia", "junta", "entrega"]],
    ["descripcion", ["descripcion", "detalle", "explicar", "explico", "describir", "contar", "que escribo", "texto", "escribir"]],
    ["enviar", ["enviar", "envio", "mandar", "mando", "terminar", "boton"]],
    ["seguimiento", ["seguimiento", "mis solicitudes", "como va", "estatus", "donde veo", "campana", "avance"]],
    ["recorrido", ["recorrido", "paso a paso", "como lleno", "como se llena", "todo", "guia", "ayudame", "no se como", "explicame", "ensename"]],
  ];
  const sinAcentos = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  function entender(texto) {
    const t = sinAcentos(texto);
    if (/^(hola|buen[oa]s|que tal|hey)\b/.test(t) && t.split(/\s+/).length <= 3) return "saludo";
    if (/gracias|perfecto|listo|ok\b|vale\b/.test(t) && t.split(/\s+/).length <= 4) return "gracias";
    let mejor = null, puntos = 0;
    INTENCIONES.forEach(([clave, palabras]) => {
      const p = palabras.reduce((a, w) => a + (t.includes(w) ? w.length : 0), 0);
      if (p > puntos) { puntos = p; mejor = clave; }
    });
    return mejor;
  }

  function preguntaLibre(texto) {
    tuDices(texto);
    const clave = entender(texto);
    const nombre = yo ? yo.nombre.split(" ")[0] : "";
    if (clave === "saludo") { ottoHabla(`¡Hola${nombre ? `, ${esc(nombre)}` : ""}! 👋 Dime qué campo no sabes llenar y te lo señalo.`, [["recorrido", "🧭 Hazme el recorrido"], ["falta", "✅ ¿Qué me falta?"]]); return; }
    if (clave === "gracias") { ottoHabla("¡Con gusto! 🐻 Aquí sigo por si necesitas algo más."); return; }
    if (!clave) {
      ottoHabla("Mmm… no te entendí bien 🤔 ¿Es sobre alguno de estos?",
        [["plaza", "Plaza"], ["cadena", "Cadena"], ["contrato", "Contrato"], ["prioridad", "Prioridad"], ["tipo", "Tipo"], ["para", "¿Para qué?"], ["descripcion", "Descripción"], ["recorrido", "🧭 Recorrido"]]);
      return;
    }
    if (AYUDA[clave]) {
      senalar(clave, true);
      ottoHabla(`¡Claro! Lo llenas <b>aquí</b>, te lo estoy iluminando 👉✨<br>${AYUDA[clave].txt}`, [["falta", "¿Qué me falta?"], ["menu", "Otras preguntas"]]);
      return;
    }
    responder(clave);
  }

  function senalar(clave, enfocar = false) {
    $$(".otto-foco").forEach((x) => x.classList.remove("otto-foco"));
    const info = AYUDA[clave];
    const el = info && $(info.sel);
    if (!el) return;
    void el.offsetWidth;
    el.classList.add("otto-foco");
    // deja el cursor listo en el campo para que empiece a llenarlo
    if (enfocar && info.foco && $(info.foco)) {
      OA.silencio = Date.now();   // Otto ya lo explicó: que no lo repita al recibir el cursor
      OA.vistos.add(clave);
      setTimeout(() => $(info.foco).focus({ preventScroll: true }), 400);
    }
    el.setAttribute("data-otto", info.titulo);
    try { el.scrollIntoView({ behavior: EF.quieto ? "auto" : "smooth", block: "nearest" }); } catch (e) { /* sin scroll */ }
    clearTimeout(OA.quitar);
    OA.quitar = setTimeout(() => el.classList.remove("otto-foco"), 6500);
  }

  function ottoHabla(html, opciones = []) {
    const lista = $("#oa-msgs");
    if (!lista) return;
    const escribe = document.createElement("div");
    escribe.className = "oa-msg otto escribiendo";
    escribe.innerHTML = "<i></i><i></i><i></i>";
    lista.appendChild(escribe);
    lista.scrollTop = lista.scrollHeight;
    const oso = $("#oa-oso");
    if (oso && !EF.quieto) { oso.classList.remove("habla"); void oso.offsetWidth; oso.classList.add("habla"); }
    setTimeout(() => {
      escribe.classList.remove("escribiendo");
      escribe.innerHTML = html;
      if (opciones.length) {
        const ops = opciones.map((o) => (Array.isArray(o) ? { v: o[0], t: o[1] } : o));
        const grandes = ops.filter((o) => o.grande);
        // la lista con íconos solo en el menú principal; lo demás, como pastillas
        const lista2 = grandes.length ? ops.filter((o) => !o.grande) : [];
        const pastillas = grandes.length ? [] : ops;
        const fila = document.createElement("div");
        fila.className = "oa-acciones";
        const titulo = (o) => `title="${esc(o.t)} · toca otra vez para quitarlo"`;
        fila.innerHTML = `
          ${grandes.length ? `<div class="oa-grandes">${grandes.map((o) => `
            <button type="button" class="oa-op grande" data-oa="${o.v}" ${titulo(o)}>
              <span class="oa-ico">${icoOA(o.v)}</span><b>${o.t}</b><small>${o.sub || ""}</small><i class="oa-x" aria-hidden="true">✕</i>
            </button>`).join("")}</div>` : ""}
          ${lista2.length ? `${grandes.length ? `<span class="oa-sub">Preguntas frecuentes</span>` : ""}<div class="oa-lista">${lista2.map((o) => `
            <button type="button" class="oa-op fila" data-oa="${o.v}" ${titulo(o)}>
              <span class="oa-ico">${icoOA(o.v)}</span><span class="oa-txt">${o.t}</span><i class="oa-flecha" aria-hidden="true">›</i><i class="oa-x" aria-hidden="true">✕</i>
            </button>`).join("")}</div>` : ""}
          ${pastillas.length ? `<div class="oa-pastillas">${pastillas.map((o) => `
            <button type="button" class="oa-op pastilla${["sig", "fin"].includes(o.v) ? " pri" : ""}" data-oa="${o.v}" ${titulo(o)}>${ICO_OA[o.v] ? icoOA(o.v) : ""}${o.t}<i class="oa-x" aria-hidden="true">✕</i></button>`).join("")}</div>` : ""}`;
        escribe.appendChild(fila);
      }
      lista.scrollTop = lista.scrollHeight;
    }, EF.quieto ? 0 : 550);
  }

  function tuDices(texto) {
    const lista = $("#oa-msgs");
    if (!lista) return;
    const m = document.createElement("div");
    m.className = "oa-msg tu";
    m.textContent = texto;
    lista.appendChild(m);
    lista.scrollTop = lista.scrollHeight;
  }

  function pasoRecorrido(i) {
    OA.paso = i;
    const clave = RECORRIDO[i];
    const info = AYUDA[clave];
    senalar(clave);
    const ops = [];
    if (i > 0) ops.push(["ant", "‹ Anterior"]);
    ops.push(i < RECORRIDO.length - 1 ? ["sig", "Siguiente ›"] : ["fin", "¡Listo!"]);
    if (i < RECORRIDO.length - 1) ops.push(["fin", "Salir"]);
    ottoHabla(`<span class="oa-paso">Paso ${i + 1} de ${RECORRIDO.length} · ${info.titulo}</span>${info.txt}`, ops);
  }

  function queFalta() {
    const d = form;
    const cat = catalogos && catalogos.categorias.find((c) => c.id === d.categoriaId);
    const faltan = [];
    if (!d.pdvId && !esTodaCadena(d, cat)) faltan.push("plaza");
    if (!d.cadenaId) faltan.push("cadena");
    if (!cat) faltan.push("tipo");
    else if (llevaMargen(cat.nombre) && !d.margenPara) faltan.push("tipo");
    else if ((guiaDe(cat.nombre).campos || []).some((c) => c.req && !String((d.detalles || {})[c.k] || "").trim())) faltan.push("tipo");
    if (cat && llevaMargen(cat.nombre) && d.margenPara && problemaRenta(d.renta, d.margenPara, cat.nombre)) faltan.push("renta");
    if ((d.quePaso || "").trim().length < 10 || (d.queNecesitas || "").trim().length < 10) faltan.push("descripcion");
    if (!faltan.length) {
      senalar("enviar");
      ottoHabla("¡Todo está completo! 🎉 Ya puedes presionar <b>Enviar</b>.", [["menu", "Ver más preguntas"]]);
      return;
    }
    senalar(faltan[0]);
    const nombres = { plaza: "la plaza", cadena: "la cadena", tipo: "el tipo de solicitud y los datos que te pide (recuadro morado)", renta: "los equipos y la renta (actual y nueva, sin IVA)", pdv: "el punto de venta (obligatorio para este tipo)", para: "la fecha de ¿para cuándo lo necesitas?", descripcion: "¿qué pasó? y ¿qué necesitas? (mínimo 10 letras cada uno)" };
    ottoHabla(`Te falta ${faltan.length === 1 ? "esto" : "esto"}:<br>${faltan.map((f) => `• ${nombres[f]}`).join("<br>")}<br>Te marqué el primero en amarillo.`,
      [[`ir:${faltan[0]}`, "¿Cómo lo lleno?"], ["menu", "Otras preguntas"]]);
  }

  function responder(v, texto) {
    if (texto) tuDices(texto);
    if (v === "recorrido") { pasoRecorrido(0); return; }
    if (v === "sig") { pasoRecorrido(Math.min(RECORRIDO.length - 1, OA.paso + 1)); return; }
    if (v === "ant") { pasoRecorrido(Math.max(0, OA.paso - 1)); return; }
    if (v === "fin") { OA.paso = -1; $$(".otto-foco").forEach((x) => x.classList.remove("otto-foco")); ottoHabla("¡Perfecto! Si te atoras, aquí sigo. 🐻", [["menu", "Ver preguntas"]]); return; }
    if (v === "falta") { queFalta(); return; }
    if (v === "menu") { ottoHabla("¿En qué te ayudo?", PREGUNTAS); return; }
    if (v === "seguimiento") {
      if (esIC(yo)) {
        // IC no tiene la pestaña "Mis solicitudes": lo que pide aparece en el Tablero
        ottoHabla("Como eres de <b>Inteligencia Comercial</b>, las solicitudes que levantas aparecen en la pestaña <b>Tablero</b>, en el filtro <b>“Las que pedí”</b>. Te llevo directo. 🔎<br>Y en la <b>campana</b> 🔔 te avisamos cada cambio.",
          [["ir-mias", "Ver las que yo levanté"], ["menu", "Otras preguntas"]]);
      } else {
        ottoHabla("Arriba, en la pestaña <b>Mis solicitudes</b>, ves cómo va cada una: quién la atiende, su avance y el historial. Y en la <b>campana</b> 🔔 te avisamos cada cambio.",
          [["ir-mias", "Ir a Mis solicitudes"], ["menu", "Otras preguntas"]]);
      }
      return;
    }
    if (v === "ir-mias") {
      tablero.filtro = null;
      tablero.vista = esIC(yo) ? "pedi" : "todas";   // IC: solo las que levantó, no las que atiende
      tablero.busca = "";
      tablero.pagina = 0;
      ir("tablero");
      return;
    }
    const clave = v.startsWith("ir:") ? v.slice(3) : v;
    if (AYUDA[clave]) {
      senalar(clave, true);
      ottoHabla(AYUDA[clave].txt, [["falta", "¿Qué me falta?"], ["menu", "Otras preguntas"]]);
    }
  }

  function abrirAyuda(abrir = true) {
    const w = $("#otto-ayuda");
    if (!w) return;
    w.classList.toggle("abierto", abrir);
    $("#oa-boton").setAttribute("aria-expanded", String(abrir));
    const globo = $("#oa-globo"); if (globo) globo.remove();
    if (abrir) setTimeout(() => { const c = $("#oa-texto"); if (c) c.focus(); }, 300);
    if (abrir && !$("#oa-msgs").children.length) {
      const nombre = yo ? yo.nombre.split(" ")[0] : "";
      ottoHabla(`¡Hola${nombre ? `, ${esc(nombre)}` : ""}! Soy <b>Otto</b> 🐻 y yo te puedo ayudar.<br>Escríbeme abajo qué no sabes llenar, por ejemplo <i>“no sé dónde pongo la cadena”</i>, y te lo ilumino en la pantalla. O elige una opción:`, PREGUNTAS);
    }
  }

  /** Crea a Otto en la esquina (solo en Nueva solicitud). */
  function ottoAyuda() {
    if ($("#otto-ayuda")) return;
    const w = document.createElement("div");
    w.id = "otto-ayuda";
    w.className = "otto-ayuda";
    w.innerHTML = `
      <section class="oa-panel" role="dialog" aria-label="Ayuda de Otto">
        <header>
          <span class="oa-cara"><img src="marca/otto.png" alt=""></span>
          <div><b>Otto · Ayuda</b><small><i class="oa-luz"></i>Te guío para llenar tu solicitud</small></div>
          <button type="button" class="oa-cerrar" aria-label="Cerrar ayuda">×</button>
        </header>
        <div class="oa-msgs" id="oa-msgs" aria-live="polite"></div>
        <form class="oa-escribe" id="oa-escribe" autocomplete="off">
          <input type="text" id="oa-texto" maxlength="160" placeholder="Pregúntale a Otto… ej. ¿dónde pongo la cadena?" aria-label="Escríbele a Otto">
          <button type="submit" aria-label="Enviar pregunta">➤</button>
        </form>
      </section>
      <button type="button" class="oa-boton" id="oa-boton" aria-expanded="false" aria-label="Abrir la ayuda de Otto">
        <span class="oa-oso" id="oa-oso">
          <img src="marca/otto-cuerpo.png" alt="">
          <img class="oa-ojos" src="marca/otto-ojos.png" alt="">
          <img class="oa-mano" src="marca/otto-mano.png" alt="">
        </span>
        <span class="oa-signo">?</span>
      </button>`;
    document.body.appendChild(w);

    // Otto saluda cada vez que se entra a Nueva solicitud
    setTimeout(() => {
      if (!$("#otto-ayuda") || w.classList.contains("abierto")) return;
      const nombre = yo ? yo.nombre.split(" ")[0] : "";
      const g = document.createElement("button");
      g.type = "button"; g.id = "oa-globo"; g.className = "oa-globo";
      g.innerHTML = `<b>¡Hola${nombre ? `, ${esc(nombre)}` : ""}! 👋</b><span>Yo te puedo ayudar a llenar tu solicitud</span>`;
      g.addEventListener("click", () => abrirAyuda(true));
      w.appendChild(g);
      const oso = $("#oa-oso");
      if (oso && !EF.quieto) { oso.classList.add("saluda-largo"); setTimeout(() => oso.classList.remove("saluda-largo"), 2600); }
      setTimeout(() => { g.classList.add("sale"); setTimeout(() => g.remove(), 300); }, 9000);
    }, 1200);

    $("#oa-boton").addEventListener("click", () => abrirAyuda(!w.classList.contains("abierto")));
    $("#oa-escribe").addEventListener("submit", (e) => {
      e.preventDefault();
      const caja = $("#oa-texto");
      const texto = caja.value.trim();
      if (!texto) return;
      caja.value = "";
      OA.paso = -1;
      preguntaLibre(texto);
    });
    w.querySelector(".oa-cerrar").addEventListener("click", () => abrirAyuda(false));
    $("#oa-msgs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-oa]");
      if (!b) return;
      const fila = b.closest(".oa-acciones");
      const msg = b.closest(".oa-msg");
      const lista = $("#oa-msgs");
      // regresa la conversación a este mensaje (borra lo que vino después)
      const rebobinar = () => { while (msg.nextSibling) lista.removeChild(msg.nextSibling); };
      if (b.classList.contains("elegido")) {
        b.classList.remove("elegido");
        fila.classList.remove("con-eleccion");
        rebobinar();
        OA.paso = -1;
        $$(".otto-foco").forEach((x) => x.classList.remove("otto-foco"));
        return;
      }
      fila.querySelectorAll(".elegido").forEach((x) => x.classList.remove("elegido"));
      rebobinar();
      b.classList.add("elegido");
      fila.classList.add("con-eleccion");
      const texto = (b.querySelector("b, .oa-txt") || b).textContent.replace("✕", "").trim();
      responder(b.dataset.oa, ["sig", "ant"].includes(b.dataset.oa) ? "" : texto);
    });
    // si la ayuda está abierta, Otto comenta el campo donde estás (una vez por campo)
    $("#contenido").addEventListener("focusin", (e) => {
      if (!w.classList.contains("abierto") || OA.paso >= 0 || Date.now() - (OA.silencio || 0) < 1500) return;
      const mapa = { "f-cadena": "cadena", "f-pdv": "plaza", "f-paso": "descripcion" };
      const clave = mapa[e.target.id];
      if (!clave || OA.vistos.has(clave)) return;
      OA.vistos.add(clave);
      ottoHabla(`📍 Estás en <b>${AYUDA[clave].titulo}</b>. ${AYUDA[clave].txt}`);
    });
  }

  function quitarOttoAyuda() {
    const w = $("#otto-ayuda");
    if (w) w.remove();
    $$(".otto-foco").forEach((x) => x.classList.remove("otto-foco"));
    OA.paso = -1;
    OA.vistos.clear();
  }

  function pintarNueva() {
    const { plazas, cadenas, categorias } = catalogos;
    const d = form;
    const margenes = ESQUEMAS;
    if (!d.renta) d.renta = rentaVacia();
    const catSel = categorias.find((c) => c.id === d.categoriaId);
    const conMargen = catSel && llevaMargen(catSel.nombre);

    // Columna derecha: lo que se va a registrar y el tip de la máquina
    const resumen = `
      <aside class="lateral">
        <p class="rot">Así se va a registrar</p>
        <div class="vivo arcade">
          <!-- ranura de la máquina de donde sale el boleto -->
          <div class="tk-maquina" aria-hidden="true"><i class="tk-led"></i><span class="tk-ranura"></span><i class="tk-led"></i></div>
          <div class="tk imprimiendo" id="vivo-tk">
            <div class="tk-marco">
              <div class="tk-num"><span id="vivo-serie">IC-2026-······</span></div>
              <div class="tk-cab"><b>Ticket IC</b></div>
              <div class="tk-sub">IC · Muñelocos</div>
              <div class="tk-folio" id="vivo-cima">
                <span class="tk-ico" id="vivo-ico"></span>
                <div>
                  <span class="n" id="vivo-folio"></span>
                  <span class="s" id="vivo-cat"></span>
                </div>
              </div>
              <div class="tk-datos">
                <div class="ren"><span>Solicita</span><i></i><b>${esc(yo ? yo.nombre : "—")}</b></div>
                <div class="ren"><span>Plaza</span><i></i><b id="vivo-plaza"></b></div>
                <div class="ren"><span>Cadena</span><i></i><b id="vivo-cadena"></b></div>
                <div class="ren" id="vivo-esquema-ren" hidden><span>Esquema</span><i></i><b id="vivo-esquema"></b></div>
                <div class="ren"><span>Prioridad</span><i></i><b id="vivo-prio"></b></div>
              </div>
              <div class="tk-pasos" title="Pasos completos del formulario">
                <span>Pasos</span>
                <span class="tk-estrellas" id="vivo-estrellas"><i>★</i><i>★</i><i>★</i><i>★</i></span>
              </div>
              <div class="tk-resp">
                <small>Fecha de solicitud</small>
                <b id="vivo-fecha">—</b>
              </div>
              <div class="tk-barras" aria-hidden="true"><i></i></div>
            </div>
          </div>
        </div>
        ${d.enviado ? "" : `
            <div class="repisa-envio arcade-repisa">
              <div class="marcador" aria-live="polite">
                <div class="mc-top"><span class="mc-player">Proceso</span><span class="mc-score" id="mc-score">0/4</span></div>
                <div class="mc-barra" id="mc-barra" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
                <small class="mc-txt" id="re-estado">Pasos completos: 0 de 4</small>
              </div>
              <div class="boton-arcade">
                <span class="ba-leyenda" id="ba-leyenda"></span>
                <span class="ba-aro"><button class="ba-boton" id="btn-enviar" type="button"><span>Enviar</span></button></span>
              </div>
            </div>`}
      </aside>`;
    // Nueva solicitud usa una hoja un poco más alta: hay más tipos y datos por tipo
    const escenario = (interior) => `<div class="escenario" id="escenario"><div class="lienzo" id="lienzo" data-ancho="1280" data-alto="700">${interior}</div></div>`;

    if (d.enviado) {
      $("#contenido").innerHTML = escenario(`
        <div class="ns ns-enviada">
          <section class="hoja ns-listo">
            <div class="hoja-cuerpo" id="hoja-cuerpo">
              <div class="listo">
                <img class="otto" src="marca/otto.png" alt="">
                <div class="estampa">Enviada</div>
                <h2>Solicitud ${esc(d.enviado)}</h2>
                <p>Ya está en el tablero de Inteligencia Comercial y el correo salió al
                   buzón del equipo. Te avisamos cuando alguien la tome.</p>
                <button class="acc g" id="btn-otra" type="button">Levantar otra</button>
              </div>
            </div>
          </section>
          ${resumen}
        </div>`);
      $("#btn-otra").addEventListener("click", () => {
        // empieza de cero: todos los campos vuelven a como al entrar
        Object.assign(d, {
          enviado: null, plazaId: "", cadenaId: "", pdvId: "", pdv: "", categoriaId: "",
          folioContrato: "", margenPara: "", prioridad: "MEDIA", prioridadTocada: false,
          proposito: "", descripcion: "", detalles: {},
          quePaso: "", queNecesitas: "", paraCuando: "", motivoFecha: "", renta: rentaVacia(),
        });
        pintarNueva();
      });
      pintarVivo();
      ajustarLienzo();
      return;
    }

    const paso = (n, titulo) => `<h3><span class="paso"><b>${n}</b>${ICONO.palomita}</span>${titulo}</h3>`;

    $("#contenido").innerHTML = escenario(`
      <div class="ns" id="hoja-cuerpo">
        <!-- Izquierda: datos de la ubicación y prioridad -->
        <section class="hoja ns-izq">
          <div class="hoja-cima">
            <div>
              <h2>Nueva solicitud</h2>
              <p>IC recibe el aviso al enviarla.</p>
            </div>
            <span class="hoja-ico">${ICONO.ticket}</span>
          </div>
          <div class="ns-cuerpo">
            <div class="bloq" data-paso="1">
              ${paso(1, "Información general")}
              <div class="g3">
                <div class="cmp" data-cmp="cadenaId">
                  <label for="f-cadena">Cadena</label>
                  <div class="con-ico combo"><span class="ico">${ICONO.tienda}</span>
                    <input class="in" id="f-cadena" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="l-cadena" autocomplete="off"
                      value="${esc(nombreDe(cadenas, d.cadenaId) === "—" ? "" : nombreDe(cadenas, d.cadenaId))}" placeholder="Busca la cadena (${cadenas.length})">
                    <ul class="combo-lista" id="l-cadena" role="listbox" hidden></ul></div>
                </div>
                <div class="cmp" data-cmp="pdvId">
                  <label for="f-pdv">Plaza</label>
                  <div class="con-ico combo"><span class="ico">${ICONO.pin}</span>
                    <input class="in" id="f-pdv" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="l-pdv" autocomplete="off"
                      value="${esc(d.pdv || "")}" placeholder="Primero elige la cadena" ${d.cadenaId ? "" : "disabled"}>
                    <ul class="combo-lista" id="l-pdv" role="listbox" hidden></ul></div>
                </div>
              </div>
            </div>

            <div class="bloq" data-paso="2" data-cmp="prioridad">
              ${paso(2, "Prioridad")}
              <p class="prio-pista" id="prio-pista">${d.prioridadTocada ? "Prioridad confirmada" : "Media por defecto · toca un foco para confirmar"}</p>
              <div class="sp" role="group" aria-label="Prioridad" id="f-prio" data-nivel="${d.prioridad}">
                <div class="sp-caja" aria-hidden="true"><i class="sp-tornillo t1"></i><i class="sp-tornillo t2"></i></div>
                ${SEMAFORO.map((p) => `
                  <button type="button" class="sp-fila" data-prio="${p}" style="--l:${PRIORIDAD_COLOR[p]}" aria-pressed="${d.prioridad === p}" title="Toca otra vez para quitarla">
                    <span class="sp-foco" aria-hidden="true"><i class="sp-onda"></i></span>
                    <span class="sp-nombre">${PRIORIDAD_TEXTO[p]}</span>
                  </button>`).join("")}
                <div class="sp-poste" aria-hidden="true"></div>
                <div class="sp-otto" aria-hidden="true">
                  <img src="marca/otto-cuerpo.png" alt="">
                  <img class="sp-otto-ojos" src="marca/otto-ojos.png" alt="">
                  <img class="sp-otto-mano" src="marca/otto-mano.png" alt="">
                </div>
              </div>
            </div>

          </div>
        </section>

        <!-- Centro: qué necesitas y el detalle -->
        <section class="hoja ns-centro">
          <div class="ns-cuerpo">
            <div class="bloq" data-paso="3">
              ${paso(3, "Tipo de solicitud")}
              <div class="cmp" data-cmp="categoriaId">
                <div class="cats grupos" role="radiogroup" aria-label="Tipo de solicitud" id="f-cat">
                  ${GRUPOS_CAT.map((g) => {
                    const delGrupo = categorias.filter((c) => guiaDe(c.nombre).grupo === g || (g === GRUPOS_CAT[GRUPOS_CAT.length - 1] && !GRUPOS_CAT.includes(guiaDe(c.nombre).grupo)));
                    if (!delGrupo.length) return "";
                    return `<div class="cat-grupo"><span class="cat-gt">${g}</span>${delGrupo.map((c) => `
                      <button type="button" role="radio" aria-checked="${c.id === d.categoriaId}" data-cat="${esc(c.id)}" title="${esc(guiaDe(c.nombre).ayuda || c.nombre)} · Toca otra vez para quitarlo">
                        <span class="cat-ico">${iconoCategoria(c.nombre)}</span>
                        <span class="cat-txt"><b>${esc(c.nombre)}</b></span>
                      </button>`).join("")}</div>`;
                  }).join("")}
                </div>
              </div>
              <div class="cat-extra" id="cat-extra"></div>
              <div class="cmp margen-cmp" data-cmp="margenPara"${conMargen ? "" : " hidden"}>
                <label id="lb-margen">Esquema de renta</label>
                <div class="chips" role="radiogroup" aria-labelledby="lb-margen" id="f-margen">
                  ${margenes.map((m) => `<button type="button" role="radio" aria-checked="${m === d.margenPara}" data-margen="${m}">${m}</button>`).join("")}
                </div>
              </div>
              <div class="renta-extra" id="renta-extra" hidden></div>
            </div>

            <div class="bloq" data-paso="4">
              ${paso(4, "Detalle")}
              <div class="desc-partes">
                <div class="cmp" data-cmp="quePaso">
                  <label for="f-paso"><span class="dp-n">1</span>¿Qué pasó?</label>
                  <textarea class="in" id="f-paso" data-campo="quePaso" rows="2" maxlength="1500" placeholder="Ej. La tienda nos avisó que…">${esc(d.quePaso)}</textarea>
                </div>
                <div class="cmp" data-cmp="queNecesitas">
                  <label for="f-necesitas"><span class="dp-n">2</span>¿Qué necesitas?</label>
                  <textarea class="in" id="f-necesitas" data-campo="queNecesitas" rows="2" maxlength="1500" placeholder="Ej. Necesito el margen actual y cómo quedaría con renta a %.">${esc(d.queNecesitas)}</textarea>
                </div>
                <div class="cmp dp-cuando" data-cmp="paraCuando">
                  <label><span class="dp-n">3</span>Fecha de solicitud</label>
                  <div class="dp-fija lista" id="f-compromiso">${ICONO_CAL}<span><b>${esc(fechaSolicitudTxt())}</b></span></div>
                  <small class="dp-nota">Se registra automáticamente con la fecha y hora en que envías la solicitud.</small>
                </div>
              </div>
            </div>

            <div class="error-campo" id="f-error" hidden></div>
          </div>
        </section>

        ${resumen}
      </div>`);

    /** Pinta la ayuda y los datos específicos del tipo elegido, y cambia los ejemplos. */
    function pintarExtra(animar = true) {
      const caja = $("#cat-extra");
      if (!caja) return;
      const cat = categorias.find((c) => c.id === d.categoriaId);
      const para = $("#f-paso"), desc = $("#f-necesitas");
      if (!cat) {
        caja.innerHTML = "";
        caja.hidden = true;
        if (para) para.placeholder = "Ej. La tienda nos avisó que…";
        if (desc) desc.placeholder = "Ej. Necesito el margen actual y cómo quedaría con renta a %.";

        pintarRenta();
        return;
      }
      const g = guiaDe(cat.nombre);
      const val = (k) => esc((d.detalles || {})[k] || "");
      caja.hidden = false;
      caja.innerHTML = `
        <p class="ce-ayuda"><span class="ce-ico">${iconoCategoria(cat.nombre)}</span><span><b>${esc(cat.nombre)}:</b> ${esc(g.ayuda || "")}</span></p>
        ${(g.campos || []).length ? `<div class="ce-campos">${g.campos.map((c) => `
          <div class="cmp ce-campo${c.tipo === "opciones" ? " ancho" : ""}" data-cmp="det-${c.k}">
            <label${c.tipo === "opciones" ? "" : ` for="det-${c.k}"`}>${esc(c.t)} ${c.req ? "" : '<span class="opc">(opcional)</span>'}</label>
            ${c.tipo === "opciones"
              ? `<div class="chips mini" role="radiogroup" aria-label="${esc(c.t)}">${c.ops.map((o) => `<button type="button" role="radio" data-det="${c.k}" data-opc="${esc(o)}" aria-checked="${(d.detalles || {})[c.k] === o}">${esc(o)}</button>`).join("")}</div>`
              : `<input class="in" id="det-${c.k}" data-det="${c.k}" type="${c.tipo === "numero" ? "number" : c.tipo === "fecha" ? "date" : "text"}" ${c.tipo === "numero" ? 'min="1" max="99"' : 'maxlength="80"'} value="${val(c.k)}" placeholder="${esc(c.ph || "")}">`}
          </div>`).join("")}</div>` : ""}`;
      if (animar && !EF.quieto) { caja.classList.remove("aparece"); void caja.offsetWidth; caja.classList.add("aparece"); }
      if (para) para.placeholder = PASO_EJ[cat.nombre] || "Ej. La tienda nos avisó que…";
      if (desc) desc.placeholder = g.desc || desc.placeholder;
      pintarRenta();
    }

    /** Datos de la renta según el esquema: equipos y comparativo actual vs. nueva. */
    function pintarRenta() {
      const caja = $("#renta-extra");
      if (!caja) return;
      const cat = categorias.find((c) => c.id === d.categoriaId);
      const e = cat && llevaMargen(cat.nombre) ? claveEsquema(d.margenPara) : "";
      if (!e) { caja.hidden = true; caja.innerHTML = ""; return; }
      const r = d.renta || (d.renta = rentaVacia());
      const actual = tieneActual(cat.nombre);
      const conCodigo = e !== "fija";
      const fila = (q, i) => `
        <tr>
          <td><input class="in" data-eq-i="${i}" data-eq-k="modelo" maxlength="60" value="${esc(q.modelo)}" placeholder="Ej. Peluchera Muñelocos Classic"></td>
          <td><input class="in" data-eq-i="${i}" data-eq-k="codigo" maxlength="30" value="${esc(q.codigo)}" placeholder="${conCodigo ? "Ej. MN-0918" : "Opcional"}"></td>
          ${conCodigo ? "" : `<td class="rx-cant"><input class="in" type="number" min="1" max="99" data-eq-i="${i}" data-eq-k="cantidad" value="${esc(q.cantidad || "1")}"></td>`}
          <td class="rx-quitar">${r.equipos.length > 1 ? `<button type="button" data-eq-quitar="${i}" aria-label="Quitar equipo">✕</button>` : ""}</td>
        </tr>`;
      const total = conCodigo ? r.equipos.filter((q) => q.modelo || q.codigo).length
        : r.equipos.reduce((a, q) => a + (q.modelo ? Math.max(1, numero(q.cantidad) || 1) : 0), 0);
      const moneda = (lado) => `<span class="rx-moneda" role="radiogroup" aria-label="Moneda">${["MXN", "USD"].map((m) => `<button type="button" data-moneda="${m}" data-lado="${lado}" aria-checked="${(r[`moneda${lado}`] || "MXN") === m}">${m}</button>`).join("")}</span>`;
      const montoFijo = (lado) => `<div class="rx-monto"><span>$</span><input class="in" inputmode="decimal" data-r="fija${lado}" value="${esc(r[`fija${lado}`])}" placeholder="0.00">${moneda(lado)}</div>`;
      const porcentaje = (k) => `<div class="rx-pct"><input class="in" inputmode="decimal" data-r="${k}" value="${esc(r[k])}" placeholder="0"><span>%</span></div>`;
      caja.hidden = false;
      caja.innerHTML = `
        <div class="rx-sec" data-cmp="renta-equipos">
          <div class="rx-t"><b>Equipos</b><small>${conCodigo ? "Modelo y código de cada equipo" : "Modelo y cuántos son"}</small><span class="rx-total">${total} ${total === 1 ? "equipo" : "equipos"}</span></div>
          <table class="rx-equipos"><thead><tr><th>Modelo</th><th>Código${conCodigo ? "" : " (opc.)"}</th>${conCodigo ? "" : "<th>Cant.</th>"}<th></th></tr></thead>
            <tbody>${r.equipos.map(fila).join("")}</tbody></table>
          <button type="button" class="rx-agregar" data-eq-add>+ Agregar equipo</button>
        </div>
        <div class="rx-sec" data-cmp="${e === "pct" ? "renta-pct" : "renta-fija"}">
          <div class="rx-t"><b>${esc(d.margenPara)}</b><small>Montos totales sin IVA</small></div>
          <table class="rx-comp">
            <thead><tr><th></th>${actual ? "<th>Actual</th>" : ""}<th>${actual ? "Nueva" : "Propuesta"}</th></tr></thead>
            <tbody>
              ${e !== "pct" ? `<tr data-cmp="renta-fija"><td>Renta fija total sin IVA</td>${actual ? `<td>${montoFijo("Actual")}</td>` : ""}<td>${montoFijo("Nueva")}</td></tr>` : ""}
              ${e !== "fija" ? `<tr data-cmp="renta-pct"><td>${e === "mixta" ? "% de renta" : "% de renta"}</td>${actual ? `<td>${porcentaje("pctActual")}</td>` : ""}<td>${porcentaje("pctNuevo")}</td></tr>` : ""}
              ${e === "fija" ? `<tr><td>% de mantenimiento <span class="opc">(si aplica)</span></td><td colspan="${actual ? 2 : 1}">${porcentaje("pctMant")}</td></tr>` : ""}
            </tbody>
          </table>
          <div id="rx-calculo">${calculoRenta(calculoDesdeForm(r, cat.nombre), d.margenPara) || '<p class="rc-vacio">Escribe los montos y aquí aparece el cálculo.</p>'}</div>
        </div>`;
    }

    const cuerpo = $("#hoja-cuerpo");
    const limpiarError = (campo) => {
      const c = $(`[data-cmp="${campo}"]`, cuerpo);
      if (!c) return;
      c.classList.remove("con-error");
      const m = $(".msg-error", c);
      if (m) m.remove();
    };

    $$("[data-campo]", cuerpo).forEach((el) => {
      const evento = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evento, () => { d[el.dataset.campo] = el.value; limpiarError(el.dataset.campo); pintarVivo(); });
    });
    $("#f-cat").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-cat]");
      if (!b) return;
      // tocar otra vez el tipo elegido lo quita
      d.categoriaId = d.categoriaId === b.dataset.cat ? "" : b.dataset.cat;
      d.detalles = {};
      d.renta = rentaVacia();
      pintarExtra();
      cargarPdv();
      $$("#f-cat button").forEach((x) => x.setAttribute("aria-checked", String(x.dataset.cat === d.categoriaId)));
      const cat = categorias.find((c) => c.id === d.categoriaId);
      const caja = $(".margen-cmp", cuerpo);
      const aplica = cat && llevaMargen(cat.nombre);
      if (aplica && caja.hidden) { caja.hidden = false; caja.classList.remove("aparece"); void caja.offsetWidth; caja.classList.add("aparece"); }
      if (!aplica) { caja.hidden = true; d.margenPara = ""; $$("#f-margen button").forEach((x) => x.setAttribute("aria-checked", "false")); limpiarError("margenPara"); }
      limpiarError("categoriaId");
      pintarVivo();
    });
    $("#f-margen").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-margen]");
      if (!b) return;
      // tocar otra vez el esquema elegido lo quita
      d.margenPara = d.margenPara === b.dataset.margen ? "" : b.dataset.margen;
      $$("#f-margen button").forEach((x) => x.setAttribute("aria-checked", String(x.dataset.margen === d.margenPara)));
      pintarRenta();
      limpiarError("margenPara");
      pintarVivo();
    });
    const elegirPrioridad = (p, alternar = false) => {
      // tocar otra vez la prioridad ya confirmada la quita (el semáforo queda apagado)
      const quitar = Boolean(alternar && d.prioridadTocada && d.prioridad === p);
      d.prioridad = quitar ? "" : p;
      d.prioridadTocada = !quitar;
      p = d.prioridad;
      const pista = $("#prio-pista");
      if (pista) {
        pista.textContent = quitar ? "Sin prioridad · toca un foco para elegirla" : "Prioridad confirmada";
        pista.classList.toggle("ok", !quitar);
        pista.classList.toggle("falta", quitar);
      }
      if (!quitar) { const caja = $('[data-cmp="prioridad"]'); if (caja) { caja.classList.remove("con-error"); const m = $(".msg-error", caja); if (m) m.remove(); } }
      const grupo = $("#f-prio");
      $$("#f-prio button[data-prio]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.prio === p)));
      grupo.dataset.nivel = p;
      if (!EF.quieto) { grupo.classList.remove("reacciona"); void grupo.offsetWidth; grupo.classList.add("reacciona"); }
      pintarVivo();
    };
    $("#f-prio").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-prio]");
      if (b) elegirPrioridad(b.dataset.prio, true);
    });
    $("#f-prio").addEventListener("keydown", (e) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const i = SEMAFORO.indexOf(d.prioridad);
      const j = i < 0 ? 0 : Math.max(0, Math.min(SEMAFORO.length - 1, i + (e.key === "ArrowDown" ? 1 : -1)));
      elegirPrioridad(SEMAFORO[j]);
      $(`#f-prio button[data-prio="${SEMAFORO[j]}"]`).focus();
    });
    $("#btn-enviar").addEventListener("click", enviar);
    // cadena → puntos de venta de esa cadena
    const inPdv = $("#f-pdv");
    async function cargarPdv() {
      if (esTodaCadena(d, categorias.find((c) => c.id === d.categoriaId))) {
        d.pdvId = ""; d.pdv = ""; inPdv.value = ""; inPdv.disabled = true;
        inPdv.placeholder = "Toda la cadena (todas sus plazas)";
        limpiarError("pdvId");
        return;
      }
      if (!d.cadenaId) { inPdv.disabled = true; inPdv.placeholder = "Primero elige la cadena"; return; }
      inPdv.disabled = true; inPdv.placeholder = "Cargando plazas…";
      if (!PDV_CACHE[d.cadenaId]) PDV_CACHE[d.cadenaId] = await D.puntosVenta(d.cadenaId);
      const n = PDV_CACHE[d.cadenaId].length;
      inPdv.disabled = n === 0;
      inPdv.placeholder = n ? `Busca entre ${n.toLocaleString("es-MX")} plazas de la cadena` : "Esta cadena no tiene plazas registradas";
    }
    montarCombo({
      input: $("#f-cadena"), lista: $("#l-cadena"), opciones: () => cadenas, elegido: () => d.cadenaId,
      alElegir: (o) => {
        const nueva = o ? o.id : "";
        if (nueva !== d.cadenaId) { d.pdvId = ""; d.pdv = ""; inPdv.value = ""; }
        d.cadenaId = nueva;
        limpiarError("cadenaId"); limpiarError("pdvId");
        cargarPdv(); pintarVivo();
        if (o && !inPdv.disabled) setTimeout(() => inPdv.focus(), 50);
      },
    });
    montarCombo({
      input: inPdv, lista: $("#l-pdv"), opciones: () => PDV_CACHE[d.cadenaId] || [], elegido: () => d.pdvId,
      alElegir: (o) => { d.pdvId = o ? o.id : ""; d.pdv = o ? o.nombre : ""; limpiarError("pdvId"); pintarVivo(); },
    });
    cargarPdv();
    // datos específicos del tipo de solicitud
    $("#cat-extra").addEventListener("input", (e) => {
      const el = e.target.closest("[data-det]");
      if (!el) return;
      d.detalles = { ...(d.detalles || {}), [el.dataset.det]: el.value };
      limpiarError(`det-${el.dataset.det}`);
      pintarVivo();
    });
    $("#cat-extra").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-opc]");
      if (!b) return;
      const k = b.dataset.det;
      const v = (d.detalles || {})[k] === b.dataset.opc ? "" : b.dataset.opc;   // tocar otra vez lo quita
      d.detalles = { ...(d.detalles || {}), [k]: v };
      $$(`#cat-extra button[data-det="${k}"]`).forEach((x) => x.setAttribute("aria-checked", String(x.dataset.opc === v)));
      limpiarError(`det-${k}`);
      if (k === "alcance") cargarPdv();
      pintarVivo();
    });
    /** Repinta solo el cálculo (sin perder el campo donde se está escribiendo). */
    function actualizarCalculo() {
      const caja = $("#rx-calculo");
      const cat = categorias.find((c) => c.id === d.categoriaId);
      if (caja && cat) caja.innerHTML = calculoRenta(calculoDesdeForm(d.renta, cat.nombre), d.margenPara) || '<p class="rc-vacio">Escribe los montos y aquí aparece el cálculo.</p>';
    }
    $("#renta-extra").addEventListener("input", (e) => {
      const r = d.renta;
      const el = e.target;
      if (el.dataset.eqI !== undefined) {
        r.equipos[Number(el.dataset.eqI)][el.dataset.eqK] = el.value;
        const tot = $(".rx-total");
        if (tot) {
          const conCodigo = claveEsquema(d.margenPara) !== "fija";
          const n = conCodigo ? r.equipos.filter((q) => q.modelo || q.codigo).length
            : r.equipos.reduce((a, q) => a + (q.modelo ? Math.max(1, numero(q.cantidad) || 1) : 0), 0);
          tot.textContent = `${n} ${n === 1 ? "equipo" : "equipos"}`;
        }
        limpiarError("renta-equipos");
      } else if (el.dataset.r) {
        r[el.dataset.r] = el.value;
        limpiarError("renta-fija"); limpiarError("renta-pct");
      }
      actualizarCalculo();
      pintarVivo();
    });
    $("#renta-extra").addEventListener("click", (e) => {
      const r = d.renta;
      const add = e.target.closest("[data-eq-add]");
      const quitar = e.target.closest("[data-eq-quitar]");
      const mon = e.target.closest("[data-moneda]");
      if (add) { r.equipos.push({ modelo: "", codigo: "", cantidad: "1" }); pintarRenta(); const ins = $$('#renta-extra [data-eq-k="modelo"]'); if (ins.length) ins[ins.length - 1].focus(); pintarVivo(); }
      if (quitar) { r.equipos.splice(Number(quitar.dataset.eqQuitar), 1); pintarRenta(); pintarVivo(); }
      if (mon) { r[`moneda${mon.dataset.lado}`] = mon.dataset.moneda; $$(`#renta-extra [data-lado="${mon.dataset.lado}"]`).forEach((x) => x.setAttribute("aria-checked", String(x === mon))); actualizarCalculo(); }
    });
    pintarExtra(false);
    ottoAyuda();
    pintarVivo();
    ajustarLienzo();
  }

  function pintarVivo() {
    const { plazas, cadenas, categorias } = catalogos;
    const d = form;
    const cat = categorias.find((c) => c.id === d.categoriaId);
    const tarjeta = $(".vivo");
    if (tarjeta && !EF.quieto && tarjeta.dataset.listo) {
      tarjeta.classList.remove("late"); void tarjeta.offsetWidth; tarjeta.classList.add("late");
    }
    if (tarjeta) tarjeta.dataset.listo = tarjeta.dataset.listo ? "2" : "1";
    const tkImp = $("#vivo-tk.imprimiendo");
    if (tkImp && !tkImp.dataset.t) { tkImp.dataset.t = "1"; setTimeout(() => tkImp.classList.remove("imprimiendo"), 1300); }
    // escribe un dato y, si cambió, lo hace destellar como recién impreso
    const poner = (id, txt) => {
      const el = $(id);
      if (!el || el.textContent === txt) return;
      el.textContent = txt;
      if (!EF.quieto && tarjeta && tarjeta.dataset.listo === "2") { el.classList.remove("tk-nuevo"); void el.offsetWidth; el.classList.add("tk-nuevo"); }
    };
    $("#vivo-cima").style.setProperty("--c", PRIORIDAD_COLOR[d.prioridad]);
    $("#vivo-ico").innerHTML = cat ? iconoCategoria(cat.nombre) : ICONO.ticket;
    poner("#vivo-folio", d.enviado || "Folio al enviar");
    poner("#vivo-cat", cat ? cat.nombre : "Elige el tipo de solicitud");
    poner("#vivo-plaza", d.pdv || (esTodaCadena(d, cat) ? "Toda la cadena" : "—"));
    poner("#vivo-cadena", nombreDe(cadenas, d.cadenaId));
    poner("#vivo-prio", PRIORIDAD_TEXTO[d.prioridad] || "—");
    // fecha fija: el momento en que se levanta la solicitud (se refresca cada minuto mientras se llena)
    poner("#vivo-fecha", fechaSolicitudTxt(true));
    const fc = $("#f-compromiso");
    if (fc) fc.innerHTML = `${ICONO_CAL}<span><b>${esc(fechaSolicitudTxt())}</b></span>`;
    [["cadenaId", d.cadenaId], ["pdvId", d.pdvId || (esTodaCadena(d, cat) ? "toda" : "")],
      ["quePaso", (d.quePaso || "").trim().length >= 10 ? "si" : ""], ["queNecesitas", (d.queNecesitas || "").trim().length >= 10 ? "si" : ""]]
      .forEach(([c, v]) => { const caja = $(`[data-cmp="${c}"]`); if (caja) caja.classList.toggle("lleno", Boolean(v)); });
    const prioEl = $("#vivo-prio"); if (prioEl) { prioEl.style.setProperty("--c", PRIORIDAD_COLOR[d.prioridad] || "transparent"); prioEl.classList.toggle("vacio", !d.prioridad); }
    const serie = $("#vivo-serie"); if (serie) serie.textContent = d.enviado || "IC-2026-······";
    const filaEsquema = $("#vivo-esquema-ren");
    if (filaEsquema) {
      const aplica = cat && llevaMargen(cat.nombre);
      filaEsquema.hidden = !aplica;
      $("#vivo-esquema").textContent = d.margenPara || "—";
    }

    // pasos completos y contadores
    const cuerpo = $("#hoja-cuerpo");
    if (!cuerpo || d.enviado) return;
    const pasos = [
      Boolean(d.cadenaId && (d.pdvId || esTodaCadena(d, cat))),
      Boolean(d.prioridad && d.prioridadTocada),
      Boolean(cat && (!llevaMargen(cat.nombre) || d.margenPara)
        && (guiaDe(cat.nombre).campos || []).every((c) => !c.req || String((d.detalles || {})[c.k] || "").trim())
        && (!llevaMargen(cat.nombre) || !problemaRenta(d.renta, d.margenPara, cat.nombre))),
      (d.quePaso || "").trim().length >= 10 && (d.queNecesitas || "").trim().length >= 10,
    ];
    pasos.forEach((ok, i) => {
      const b = $(`[data-paso="${i + 1}"]`, cuerpo);
      if (b) b.classList.toggle("hecho", ok);
    });
    const listos = pasos.filter(Boolean).length;
    const estrellas = $("#vivo-estrellas");
    if (estrellas) {
      $$("i", estrellas).forEach((st, i) => st.classList.toggle("on", i < listos));
      const tk = $("#vivo-tk");
      if (tk) {
        const completo = listos === pasos.length;
        if (completo && !tk.classList.contains("completo") && !EF.quieto) { tk.classList.add("premio"); setTimeout(() => tk.classList.remove("premio"), 1200); }
        tk.classList.toggle("completo", completo);
      }
    }
    const completo = listos === pasos.length;
    const estado = $("#re-estado");
    if (estado) {
      estado.textContent = completo ? "¡Todo listo! Llega directo al tablero de IC" : `Pasos completos: ${listos} de ${pasos.length}`;
      estado.classList.toggle("ok", completo);
    }
    const score = $("#mc-score");
    if (score && score.textContent !== `${listos}/${pasos.length}`) {
      score.textContent = `${listos}/${pasos.length}`;
      if (!EF.quieto) { score.classList.remove("sube"); void score.offsetWidth; score.classList.add("sube"); }
    }
    $$("#mc-barra i").forEach((seg, i) => seg.classList.toggle("on", i < listos));
    const barra = $("#mc-barra"); if (barra) barra.classList.toggle("llena", completo);
    const leyenda = $("#ba-leyenda");
    if (leyenda) { leyenda.textContent = completo ? "¡Listo para jugar!" : ""; leyenda.classList.toggle("lista", completo); }
    const btn = $("#btn-enviar"); if (btn) btn.classList.toggle("listo", completo);
    const cuenta = (id, n, max) => { const e = $(id); if (e) { e.textContent = `${n}/${max}`; e.classList.toggle("cerca", n > max * 0.9); } };
    void cuenta;
  }

  async function enviar() {
    const d = form;
    const error = $("#f-error");
    error.hidden = true;
    const problema = validarCampos(d, catalogos.categorias);
    if (problema) {
      const caja = $(`[data-cmp="${problema.campo}"]`);
      if (caja) {
        caja.classList.add("con-error");
        if (!$(".msg-error", caja)) caja.insertAdjacentHTML("beforeend", `<small class="msg-error">${esc(problema.msg)}</small>`);
        if (!$("#escenario.fijo")) caja.scrollIntoView({ behavior: EF.quieto ? "auto" : "smooth", block: "center" });
        const foco = $("input, select, textarea, button", caja);
        if (foco) setTimeout(() => foco.focus({ preventScroll: true }), 300);
        if (!EF.quieto) { caja.classList.remove("sacude"); void caja.offsetWidth; caja.classList.add("sacude"); }
      } else {
        error.textContent = problema.msg; error.hidden = false;
      }
      return;
    }

    const cuerpo = $("#hoja-cuerpo");
    const boton = $("#btn-enviar");
    cuerpo.classList.add("cargando");
    boton.innerHTML = "<span>Enviando…</span>";
    boton.disabled = true;
    boton.classList.add("presionado");
    try {
      const cat = catalogos.categorias.find((c) => c.id === d.categoriaId);
      const necesito = d.queNecesitas.trim();
      const primera = necesito.split(/\n|(?<=\.)\s/)[0].trim();
      const proposito = (primera.length >= 5 ? primera : necesito).slice(0, 157) + ((primera.length >= 5 ? primera : necesito).length > 157 ? "…" : "");
      const renta = llevaMargen(cat && cat.nombre) ? rentaParaGuardar(d.renta, d.margenPara, cat.nombre) : null;
      const datos = {
        ...d,
        folioContrato: "",
        margenPara: llevaMargen(cat && cat.nombre) ? d.margenPara : "No aplica",
        detalles: {
          ...Object.fromEntries((guiaDe(cat && cat.nombre).campos || [])
            .map((c) => [c.k, String((d.detalles || {})[c.k] || "").trim()]).filter(([, v]) => v)),
          ...(renta ? { renta } : {}),
        },
        proposito,
        descripcion: `Qué pasó: ${d.quePaso.trim()}\n\nQué necesito: ${necesito}`.slice(0, 4000),
      };
      const r = await D.crearTicket(datos);
      // el ticket recibe su folio real y la garra se lo lleva como premio
      const serie = $("#vivo-serie"); if (serie) serie.textContent = r.folio;
      const folioTk = $("#vivo-folio"); if (folioTk) folioTk.textContent = r.folio;
      await EF.llevarse($("#vivo-tk"));
      d.enviado = r.folio;
      pintarNueva();
      const sello = $(".estampa");
      if (sello) {
        const rs = sello.getBoundingClientRect();
        setTimeout(() => EF.confeti(rs.left + rs.width / 2, rs.top + rs.height / 2, { cantidad: 70, escala: 0.9 }), 200);
      }
      avisar(
        r.correo === "simulado" ? "Correo simulado (modo demo)" : "Correo enviado",
        "Al buzón de IC y tu acuse",
      );
    } catch (e) {
      cuerpo.classList.remove("cargando");
      boton.disabled = false;
      boton.classList.remove("presionado");
      boton.innerHTML = "<span>Enviar</span>";
      error.textContent = e.message;
      error.hidden = false;
    }
  }

  // ================================================================ DASHBOARD (solo IC)
  const dash = { periodo: "todo", tickets: [], filtros: {} };

  // Filtros cruzados: cada gráfica filtra a todas las demás (como en Power BI)
  const claveDia = (f) => { const d = new Date(f); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function estadoTiempo(t) {
    if (!ABIERTOS.includes(t.estatus)) return "cerrada";
    const ahora = Date.now();
    const v = t.venceEn ? new Date(t.venceEn).getTime() : null;
    if (v && v < ahora) return "fuera";
    if (v && t.estatus !== "EN_ESPERA" && v - ahora < 6 * 3600000) return "por-vencer";
    return "en-tiempo";
  }
  const DIM = {
    estatus: (t) => t.estatus,
    tiempo: estadoTiempo,
    plaza: (t) => t.plaza,
    cadena: (t) => t.cadena,
    categoria: (t) => t.categoria,
    prioridad: (t) => t.prioridad,
    asignado: (t) => t.asignado || "Sin asignar",
    solicitante: (t) => t.solicitante,
    dia: (t) => claveDia(t.creadoEn),
  };
  const NOMBRE_DIM = {
    estatus: "Estatus", tiempo: "Tiempo", plaza: "Plaza", cadena: "Cadena", categoria: "Tipo",
    prioridad: "Prioridad", asignado: "Atiende", solicitante: "Solicitó", dia: "Día",
  };
  const TEXTO_TIEMPO = { "en-tiempo": "En tiempo", "por-vencer": "Por vencer", fuera: "Fuera de tiempo" };
  function textoFiltro(dim, v) {
    if (dim === "estatus") return ESTATUS_TEXTO[v];
    if (dim === "prioridad") return PRIORIDAD_TEXTO[v];
    if (dim === "tiempo") return TEXTO_TIEMPO[v];
    if (dim === "edad") return { "0-1": "Hoy o ayer", "2-3": "2 a 3 días", "4-7": "4 a 7 días", "8+": "Más de 7 días" }[v] || v;
    if (dim === "dia") { const [a, m, d] = v.split("-").map(Number); return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short" }); }
    return v;
  }
  /** Aplica todos los filtros menos el de la dimensión indicada (así cada gráfica muestra sus opciones). */
  const filtrarDash = (lista, excepto) =>
    lista.filter((t) => Object.entries(dash.filtros).every(([d, v]) => d === excepto || DIM[d](t) === v));
  const PERIODOS = [["todo", "Todo"], ["30", "30 días"], ["7", "7 días"]];

  /** Cuenta por una llave y regresa [{nombre, n}] ordenado de mayor a menor. */
  function contarPor(lista, llave) {
    const m = new Map();
    lista.forEach((t) => { const k = llave(t) || "—"; m.set(k, (m.get(k) || 0) + 1); });
    return [...m.entries()].map(([nombre, n]) => ({ nombre, n })).sort((a, z) => z.n - a.n || a.nombre.localeCompare(z.nombre, "es"));
  }

  /** Lista de barras horizontales; si trae "busca", al tocarla abre el tablero filtrado. */
  function barrasDash(items, { color, total, dim, icono }) {
    const max = Math.max(1, ...items.map((i) => i.n));
    if (!items.length) return `<p class="db-vacio">Sin datos en este periodo</p>`;
    return items.map((i) => {
      const pct = total ? Math.round((i.n / total) * 100) : 0;
      const c = typeof color === "function" ? color(i) : color;
      const etiqueta = `${i.n} ${i.n === 1 ? "solicitud" : "solicitudes"} · ${pct}%`;
      const contenido = `
          ${icono ? `<span class="db-ico" style="--c:${c}">${icono(i)}</span>` : ""}
          <span class="db-nombre">${esc(i.texto || i.nombre)}</span>
          <span class="db-barra"><i style="--p:${(i.n / max) * 100};--c:${c}"></i></span>
          <b class="db-n">${i.n}<small>${pct}%</small></b>`;
      return dim
        ? `<button type="button" class="db-fila" data-dim="${dim}" data-val="${esc(i.nombre)}" title="${etiqueta} · Toca para filtrar">${contenido}</button>`
        : `<div class="db-fila" title="${etiqueta}">${contenido}</div>`;
    }).join("");
  }

  function donaAbiertas(enTiempo, porVencer, fuera) {
    const total = enTiempo + porVencer + fuera;
    const seg = [[enTiempo, "var(--verde)", "en-tiempo"], [porVencer, "var(--p-media)", "por-vencer"], [fuera, "var(--rojo)", "fuera"]];
    let acumulado = 0;
    const visibles = seg.filter(([n]) => n > 0).length;
    const arcos = total ? seg.filter(([n]) => n > 0).map(([n, c, v]) => {
      const largo = (n / total) * 100;
      const trazo = visibles > 1 ? Math.max(0.5, largo - 1.8) : largo;
      const arco = `<circle class="db-arco" data-dim="tiempo" data-val="${v}" r="15.915" cx="21" cy="21" fill="none" stroke="${c}" stroke-width="6"
        stroke-dasharray="${trazo} ${100 - trazo}" stroke-dashoffset="${25 - acumulado}" style="--largo:${trazo}"></circle>`;
      acumulado += largo;
      return arco;
    }).join("") : "";
    return `
      <svg viewBox="0 0 42 42" class="db-dona" role="img" aria-label="${total} abiertas: ${enTiempo} en tiempo, ${porVencer} por vencer, ${fuera} fuera de tiempo">
        <circle r="15.915" cx="21" cy="21" fill="none" stroke="var(--raya)" stroke-width="6"></circle>
        ${arcos}
        <text x="21" y="20.5" class="db-dona-n">${total}</text>
        <text x="21" y="26.5" class="db-dona-t">abiertas</text>
      </svg>`;
  }

  async function vistaDashboard() {
    cargandoVista();
    try { dash.tickets = await D.tickets(); }
    catch (e) { errorVista(e.message); return; }
    dash.actualizado = Date.now();
    pintarDashboard(true);
  }

  const OSO_KPI = {
    "": "marca/otto.png", COMPLETADO: "marca/oso-trofeo.png", NUEVO: "marca/oso-saluda.png",
    EN_PROCESO: "marca/oso-obra.png", EN_ESPERA: "marca/oso-alto.png", CANCELADO: "marca/oso-alto.png",
  };

  /** Cuándo entregó IC: primer paso a Entregado (o el cierre, en tickets anteriores a esa fase). */
  const fechaEntrega = (t) => {
    const m = (t.movimientos || []).find((x) => x.a === "ENTREGADO");
    return m ? new Date(m.creadoEn).getTime() : (t.estatus === "COMPLETADO" ? fechaResuelta(t) : null);
  };
  const COLOR_BARRA = "#3F60A8";

  /** Fecha en que se resolvió un ticket (último movimiento a Completado). */
  const fechaResuelta = (t) => {
    const m = [...(t.movimientos || [])].reverse().find((x) => x.a === "COMPLETADO");
    return m ? new Date(m.creadoEn).getTime() : null;
  };

  /** Hallazgos que Otto va platicando. */
  function hallazgos(ts, datos) {
    const h = [];
    const top = (arr) => arr[0];
    const pct = (n) => (ts.length ? Math.round((n / ts.length) * 100) : 0);
    if (!ts.length) return ["Aún no hay solicitudes en este periodo. Prueba con otro rango en el calendario."];
    if (datos.ahoraP) h.push(datos.delta === null
      ? `En este periodo entregamos en <b>${datos.ahoraP.dias.toFixed(1)} días</b> en promedio.`
      : datos.delta <= 0
        ? `Entregamos <b>${Math.abs(datos.delta).toFixed(1)} días más rápido</b> que del ${datos.prev}. ¡Bien!`
        : `Entregamos <b>${datos.delta.toFixed(1)} días más lento</b> que del ${datos.prev}. Vale la pena revisar qué se atoró.`);
    const cd = top(contarPor(ts, (t) => t.cadena));
    if (cd) h.push(`La cadena que más nos pide es <b>${esc(cd.nombre)}</b>, con <b>${cd.n}</b> ${cd.n === 1 ? "solicitud" : "solicitudes"}.`);
    const tp = top(contarPor(ts, (t) => t.categoria));
    if (tp) h.push(`Lo más solicitado es <b>${esc(tp.nombre)}</b>: ${pct(tp.n)}% de todo lo que llega.`);
    const pz = top(contarPor(ts, (t) => t.plaza));
    if (pz) h.push(`<b>${esc(pz.nombre)}</b> es la plaza con más solicitudes: <b>${pz.n}</b> (${pct(pz.n)}% del total).`);
    if (datos.masVieja) { const d = Math.round((Date.now() - new Date(datos.masVieja.creadoEn)) / 86400000); h.push(`La solicitud abierta más antigua lleva <b>${d} ${d === 1 ? "día" : "días"}</b>: ${esc(datos.masVieja.folio)}.`); }
    else if (datos.abiertas === 0) h.push("¡No hay solicitudes abiertas! Todo lo del periodo ya se entregó.");
    const urg = ts.filter((t) => t.prioridad === "URGENTE" && ABIERTOS.includes(t.estatus)).length;
    if (urg) h.push(`Hay <b>${urg}</b> ${urg === 1 ? "urgente abierta" : "urgentes abiertas"}. Esas van primero en la fila.`);
    const ad = datos.admins.filter((a) => a.nombre !== "Sin asignar" && a.nDias).sort((a, z) => a.dias / a.nDias - z.dias / z.nDias)[0];
    if (ad) h.push(`<b>${esc(ad.nombre)}</b> es quien entrega más rápido: <b>${(ad.dias / ad.nDias).toFixed(1)} días</b> en promedio.`);
    const conf = ts.filter((t) => t.estatus === "ENTREGADO").length;
    if (conf) h.push(`Hay <b>${conf}</b> ${conf === 1 ? "entrega esperando" : "entregas esperando"} que el ejecutivo confirme.`);
    const ej = top(contarPor(ts, (t) => t.solicitante));
    if (ej) h.push(`<b>${esc(ej.nombre)}</b> es quien más ha solicitado: <b>${ej.n}</b> ${ej.n === 1 ? "solicitud" : "solicitudes"}.`);
    return h;
  }

  /** Curvas suaves (nuevas y resueltas) con área degradada y puntos. */
  function curvaTendencia(serie, max) {
    const W = 600, H = 170, arriba = 12, abajo = 24;
    const n = serie.length;
    const x = (i) => (n === 1 ? W / 2 : (i * W) / (n - 1));
    const y = (v) => H - abajo - (v / max) * (H - abajo - arriba);
    const camino = (clave) => {
      const p = serie.map((d, i) => [x(i), y(d[clave])]);
      let d = `M${p[0][0]},${p[0][1]}`;
      for (let i = 0; i < p.length - 1; i++) {
        const [x0, y0] = p[i - 1] || p[i], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2] || p[i + 1];
        const c1x = x1 + (x2 - x0) / 6, c1y = Math.min(H - abajo, y1 + (y2 - y0) / 6);
        const c2x = x2 - (x3 - x1) / 6, c2y = Math.min(H - abajo, y2 - (y3 - y1) / 6);
        d += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`;
      }
      return { linea: d, area: `${d} L${x(n - 1)},${H - abajo} L${x(0)},${H - abajo} Z`, puntos: p };
    };
    const nv = camino("nuevas"), rs = camino("resueltas");
    // los puntos van en HTML para que no se deformen al estirar la gráfica
    const puntos = (pts, clase, clave) => pts.map(([px, py], i) => serie[i][clave]
      ? `<i class="db-pt ${clase}" style="left:${((px / W) * 100).toFixed(2)}%;top:${((py / H) * 100).toFixed(2)}%;--i:${i}"></i>` : "").join("");
    return `
      <svg class="db-curva" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="gNuevas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--cielo)" stop-opacity=".42"/><stop offset="1" stop-color="var(--cielo)" stop-opacity="0"/></linearGradient>
          <linearGradient id="gResueltas" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--verde)" stop-opacity=".32"/><stop offset="1" stop-color="var(--verde)" stop-opacity="0"/></linearGradient>
        </defs>
        ${[0, 0.5, 1].map((f) => `<line class="db-guia" x1="0" x2="${W}" y1="${y(max * f)}" y2="${y(max * f)}"></line>`).join("")}
        <path class="db-area nuevas" d="${nv.area}" fill="url(#gNuevas)"></path>
        <path class="db-area resueltas" d="${rs.area}" fill="url(#gResueltas)"></path>
        <path class="db-linea nuevas" d="${nv.linea}" pathLength="1"></path>
        <path class="db-linea resueltas" d="${rs.linea}" pathLength="1"></path>
      </svg>
      <div class="db-puntos" aria-hidden="true">${puntos(nv.puntos, "nuevas", "nuevas")}${puntos(rs.puntos, "resueltas", "resueltas")}</div>`;
  }

  /** Ranking con podio de oro, plata y bronce; el resto en lista. */
  function rankingPodio(items, { color, total, vacio, extra, dim }) {
    const podio = items.slice(0, 3);
    const resto = items.slice(3);
    if (!items.length) return `<p class="db-vacio">${vacio}</p>`;
    return `
      <div class="db-rank">
        <div class="db-podio">
          ${[1, 0, 2].map((pos) => {
            const e = podio[pos];
            if (!e) return `<div class="db-escalon vacio p${pos + 1}"></div>`;
            return `
            <button type="button" class="db-escalon p${pos + 1}" data-dim="${dim}" data-val="${esc(e.nombre)}" style="--i:${pos}" title="${esc(e.nombre)}: ${e.n}${e.sub ? ` · ${esc(e.sub)}` : ""} · Toca para filtrar">
              ${pos === 0 ? `<img class="db-trofeo" src="marca/oso-trofeo.png" alt="">` : ""}
              <span class="db-cara grande">${esc(iniciales(e.nombre))}</span>
              <b class="db-escalon-nombre">${esc(e.nombre.split(" ")[0])}</b>
              ${e.sub ? `<small class="db-escalon-sub">${esc(e.sub)}</small>` : ""}
              <span class="db-bloque"><em>${pos + 1}°</em><b>${e.n}</b></span>
            </button>`;
          }).join("")}
        </div>
        <div class="db-resto">
          ${resto.length ? barrasDash(resto, { color, total, dim, icono: (i) => `<span class="db-cara chica">${esc(iniciales(i.nombre))}</span>` })
            : `<p class="db-vacio chico">Aquí aparecen los demás cuando haya más de tres.</p>`}
          ${extra || ""}
        </div>
      </div>`;
  }

  // ---------------------------------------------------------------- periodo con calendario
  const dia0 = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const masDias = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return dia0(x); };
  const difDias = (a, b) => Math.round((dia0(b) - dia0(a)) / 86400000);
  const fmtCorto = (d, conAnio = false) => {
    const t = d.toLocaleDateString("es-MX", { day: "numeric", month: "short", ...(conAnio ? { year: "numeric" } : {}) }).replace(/\./g, "");
    return t;
  };
  const textoRango = (a, b) => (difDias(a, b) === 0 ? fmtCorto(a, true) : `${fmtCorto(a, a.getFullYear() !== b.getFullYear())} – ${fmtCorto(b, true)}`);
  const isoDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  if (!dash.desde) { dash.hasta = dia0(new Date()); dash.desde = masDias(dash.hasta, -13); dash.comparar = true; dash.lugar = "cadena"; }

  /** Atajos del calendario: [clave, texto, () => [desde, hasta]] */
  function atajosPeriodo() {
    const hoy = dia0(new Date());
    const tri = Math.floor(hoy.getMonth() / 3) * 3;
    const primero = dash.tickets.reduce((m, t) => Math.min(m, new Date(t.creadoEn).getTime()), hoy.getTime());
    return [
      ["hoy", "Hoy", () => [hoy, hoy]],
      ["7", "Últimos 7 días", () => [masDias(hoy, -6), hoy]],
      ["14", "Últimos 14 días", () => [masDias(hoy, -13), hoy]],
      ["30", "Últimos 30 días", () => [masDias(hoy, -29), hoy]],
      ["mes", "Este mes", () => [new Date(hoy.getFullYear(), hoy.getMonth(), 1), hoy]],
      ["mesAnt", "Mes anterior", () => [new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), new Date(hoy.getFullYear(), hoy.getMonth(), 0)]],
      ["tri", "Este trimestre", () => [new Date(hoy.getFullYear(), tri, 1), hoy]],
      ["anio", "Este año", () => [new Date(hoy.getFullYear(), 0, 1), hoy]],
      ["todo", "Todo", () => [dia0(primero), hoy]],
    ];
  }

  function htmlMesCal(y, m, c) {
    const hoy = dia0(new Date());
    const primero = new Date(y, m, 1);
    const hueco = (primero.getDay() + 6) % 7;          // la semana empieza en lunes
    const nDias = new Date(y, m + 1, 0).getDate();
    let celdas = "";
    for (let i = 0; i < hueco; i++) celdas += "<span></span>";
    for (let d = 1; d <= nDias; d++) {
      const f = new Date(y, m, d);
      const en = c.hasta && f >= c.desde && f <= c.hasta;
      const cls = [en ? "en" : "", +f === +c.desde ? "ini" : "", c.hasta && +f === +c.hasta ? "fin" : "", +f === +hoy ? "hoy" : ""].join(" ").trim();
      celdas += f > hoy
        ? `<span class="fut">${d}</span>`
        : `<button type="button" class="${cls}" data-cal-dia="${isoDia(f)}">${d}</button>`;
    }
    return `<div class="dc-mes"><h4>${MESES[m]} ${y}</h4><div class="dc-sem"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div><div class="dc-dias">${celdas}</div></div>`;
  }

  function htmlCalendario() {
    const c = dash.cal;
    const der = c.mes;                                  // mes de la derecha
    const izq = new Date(der.getFullYear(), der.getMonth() - 1, 1);
    const largo = c.hasta ? difDias(c.desde, c.hasta) + 1 : 1;
    const prevH = masDias(c.desde, -1), prevD = masDias(c.desde, -largo);
    const hoy = dia0(new Date());
    return `
      <div class="dc-atajos">
        <b>Atajos</b>
        ${atajosPeriodo().map(([k, t, f]) => { const [a, z] = f(); const on = c.hasta && +a === +c.desde && +z === +c.hasta; return `<button type="button" data-cal-atajo="${k}" class="${on ? "on" : ""}">${t}</button>`; }).join("")}
      </div>
      <div class="dc-cuerpo">
        <div class="dc-fechas">
          <label>Desde<input type="date" id="dc-desde" value="${isoDia(c.desde)}" max="${isoDia(hoy)}"></label>
          <span>→</span>
          <label>Hasta<input type="date" id="dc-hasta" value="${c.hasta ? isoDia(c.hasta) : ""}" max="${isoDia(hoy)}"></label>
          <span class="dc-nav"><button type="button" data-cal-mes="-1" aria-label="Meses anteriores">‹</button><button type="button" data-cal-mes="1" aria-label="Meses siguientes"${der.getFullYear() === hoy.getFullYear() && der.getMonth() === hoy.getMonth() ? " disabled" : ""}>›</button></span>
        </div>
        <div class="dc-dos">${htmlMesCal(izq.getFullYear(), izq.getMonth(), c)}${htmlMesCal(der.getFullYear(), der.getMonth(), c)}</div>
        <p class="dc-ayuda">${c.hasta ? `Del ${fmtCorto(c.desde, true)} al ${fmtCorto(c.hasta, true)}` : "Ahora toca el día final"}</p>
        <div class="dc-pie">
          <label class="dc-sw"><input type="checkbox" id="dc-comparar"${c.comparar ? " checked" : ""}><i></i>Comparar con el periodo anterior <small>${c.hasta ? `(${textoRango(prevD, prevH)})` : ""}</small></label>
          <span class="dc-btns"><button type="button" class="dc-no" data-cal-cerrar>Cancelar</button><button type="button" class="dc-si" data-cal-aplicar${c.hasta ? "" : " disabled"}>Aplicar · ${largo} ${largo === 1 ? "día" : "días"}</button></span>
        </div>
      </div>`;
  }

  /** Antigüedad de una solicitud abierta (días desde que se pidió). */
  function edadAbierta(t) {
    if (!ABIERTOS.includes(t.estatus)) return "cerrada";
    const d = difDias(new Date(t.creadoEn), new Date());
    return d <= 1 ? "0-1" : d <= 3 ? "2-3" : d <= 7 ? "4-7" : "8+";
  }
  DIM.edad = edadAbierta;
  NOMBRE_DIM.edad = "Días abiertas";
  const EDADES = [["0-1", "Hoy o ayer", "#3E9B5F"], ["2-3", "2 a 3 días", "#7DB65A"], ["4-7", "4 a 7 días", "#E8A33D"], ["8+", "Más de 7 días", "#E35D5D"]];

  function pintarDashboard(animar) {
    clearInterval(dash.timer);
    const hoy0 = dia0(new Date());
    const ini = dash.desde.getTime(), fin = masDias(dash.hasta, 1).getTime();
    const enRango = (t, a, b) => { const c = new Date(t.creadoEn).getTime(); return c >= a && c < b; };
    const base = dash.tickets.filter((t) => enRango(t, ini, fin));
    const ts = filtrarDash(base);
    const de = (dim) => filtrarDash(base, dim);
    const total = ts.length;
    const tsEst = de("estatus");
    const porEstatus = (e) => tsEst.filter((t) => t.estatus === e).length;
    const largo = difDias(dash.desde, dash.hasta) + 1;
    const prevD = masDias(dash.desde, -largo), prevH = masDias(dash.desde, -1);

    // tiempo para entregar (y el del periodo anterior para comparar)
    const promDias = (lista) => {
      const r = lista.filter((t) => ["ENTREGADO", "COMPLETADO"].includes(t.estatus)).map((t) => ({ t, f: fechaEntrega(t) })).filter((x) => x.f);
      return r.length ? { n: r.length, dias: r.reduce((a, x) => a + (x.f - new Date(x.t.creadoEn).getTime()), 0) / r.length / 86400000 } : null;
    };
    const ahoraP = promDias(ts);
    const antesP = dash.comparar ? promDias(filtrarDash(dash.tickets.filter((t) => enRango(t, prevD.getTime(), prevH.getTime() + 86400000)))) : null;
    const delta = ahoraP && antesP ? ahoraP.dias - antesP.dias : null;

    // abiertas por antigüedad
    const abiertasE = de("edad").filter((t) => ABIERTOS.includes(t.estatus));
    const porEdad = EDADES.map(([k]) => abiertasE.filter((t) => edadAbierta(t) === k).length);
    const masVieja = [...abiertasE].sort((a, z) => new Date(a.creadoEn) - new Date(z.creadoEn))[0];

    // equipo IC
    const mapaAdm = new Map();
    de("asignado").forEach((t) => {
      const k = t.asignado || "Sin asignar";
      const a = mapaAdm.get(k) || { nombre: k, total: 0, resueltas: 0, curso: 0, dias: 0, nDias: 0 };
      a.total += 1;
      const fe = fechaEntrega(t);
      if (fe) { a.dias += (fe - new Date(t.creadoEn).getTime()) / 86400000; a.nDias += 1; }
      if (["ENTREGADO", "COMPLETADO", "CANCELADO"].includes(t.estatus)) a.resueltas += 1; else a.curso += 1;
      mapaAdm.set(k, a);
    });
    const admins = [...mapaAdm.values()].sort((a, z) => (a.nombre === "Sin asignar") - (z.nombre === "Sin asignar") || z.total - a.total);
    const ejecutivos = contarPor(de("solicitante"), (t) => t.solicitante);

    // por día (dentro del periodo elegido)
    const nDias = Math.min(400, largo);
    const serie = Array.from({ length: nDias }, (_, i) => {
      const a = masDias(dash.hasta, -(nDias - 1 - i)).getTime(), b = a + 86400000;
      const lista = filtrarDash(dash.tickets, "dia");
      return {
        fecha: new Date(a), clave: claveDia(a),
        nuevas: lista.filter((t) => enRango(t, a, b)).length,
        resueltas: lista.filter((t) => { const f = fechaEntrega(t); return f && f >= a && f < b; }).length,
      };
    });
    const totNuevas = serie.reduce((a, d) => a + d.nuevas, 0);
    const maxNuevas = Math.max(1, ...serie.map((d) => d.nuevas));
    const diasActivos = serie.map((d, i) => ({ d, i })).filter(({ d }) => d.nuevas || d.resueltas).reverse();
    const diasSin = serie.length - diasActivos.length;

    const ETAPAS = [
      ["NUEVO", "Sin asignar", (n) => `${tsEst.filter((t) => t.estatus === "NUEVO" && !t.asignado).length} sin asignar`],
      ["EN_PROCESO", "", () => "Con IC trabajando"],
      ["EN_ESPERA", "", () => "Esperan al ejecutivo"],
      ["ENTREGADO", "", () => "Por confirmar"],
      ["COMPLETADO", "", () => "Proceso cerrado"],
      ["CANCELADO", "", (n) => `${tsEst.length ? Math.round((n / tsEst.length) * 100) : 0}% del total`],
    ];
    const prios = SEMAFORO.map((p) => ({ p, n: de("prioridad").filter((t) => t.prioridad === p).length }));
    const totPrio = prios.reduce((a, x) => a + x.n, 0);
    let acum = 0;
    const conic = totPrio ? prios.filter((x) => x.n).map((x) => { const a = acum; acum += (x.n / totPrio) * 100; return `${PRIORIDAD_COLOR[x.p]} ${a}% ${acum}%`; }).join(",") : "var(--raya) 0 100%";

    const panel = (clase, titulo, icono, extra, cuerpo) => `
      <section class="db-panel ${clase}">
        <header><span class="db-hico">${icono}</span><h3>${titulo}</h3>${extra ? `<small>${extra}</small>` : ""}</header>
        <div class="db-cuerpo">${cuerpo}</div>
      </section>`;
    const persona = (dim, nombre, colorCara, principal, sub, cifra, cifraTxt, extra = "") => `
      <button type="button" class="dp-persona" data-dim="${dim}" data-val="${esc(nombre)}" title="Toca para filtrar">
        <span class="dp-cara" style="--c:${colorCara}">${esc(nombre === "Sin asignar" ? "?" : iniciales(nombre))}</span>
        <span class="dp-txt"><b>${esc(principal)}${extra}</b><small>${esc(sub)}</small></span>
        <span class="dp-cifra" style="--c:${colorCara}"><b>${cifra}</b><small>${cifraTxt}</small></span>
      </button>`;
    const MEDALLA = ["🥇", "🥈", "🥉"];
    const COLOR_IC = ["#3F60A8", "#7B61C4", "#2BA3A3", "#5B6F9E", "#8E6FD0"];
    const lugares = contarPor(de(dash.lugar), (t) => t[dash.lugar]);

    $("#contenido").innerHTML = `
      <div class="escenario" id="escenario"><div class="lienzo" id="lienzo" data-ancho="1280" data-alto="680" data-adaptable="1">
      <div class="db db2${animar ? " db-entra" : ""}" id="db">
        <div class="d2-cab">
          <div class="d2-tit"><h2>Dashboard de Inteligencia Comercial</h2><small>Solicitudes de Comercialización · actualizado ${new Date(dash.actualizado || Date.now()).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" })}</small></div>
          <div class="d2-rango">
            <button type="button" class="d2-rg" id="db-rango" aria-haspopup="dialog" aria-expanded="false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>
              <span><small>Periodo</small><b>${textoRango(dash.desde, dash.hasta)}</b></span><i>▾</i>
            </button>
            ${dash.comparar ? `<span class="d2-vs">vs. ${textoRango(prevD, prevH)}</span>` : ""}
            <div class="d2-cal" id="db-cal" hidden role="dialog" aria-label="Elegir periodo"></div>
          </div>
          <div class="db-otto-dlg">
            <div class="db-otto-oso" id="db-otto-oso" title="¡Tócalo para otro dato!">
              <img src="marca/otto-cuerpo.png" alt="Otto">
              <img class="o-ojos" src="marca/otto-ojos.png" alt="">
              <img class="o-mano" src="marca/otto-mano.png" alt="">
            </div>
            <div class="db-otto-globo" role="status" aria-live="polite">
              <svg class="db-otto-cola" viewBox="0 0 16 24" aria-hidden="true"><path d="M16 1 L1.5 12 L16 23"/></svg>
              <span class="db-otto-eti">Otto te cuenta</span>
              <p id="db-otto-txt"></p>
              <div class="db-otto-nav">
                <button type="button" id="db-otto-ant" aria-label="Dato anterior">‹</button>
                <span id="db-otto-puntos"></span>
                <button type="button" id="db-otto-sig" aria-label="Siguiente dato">›</button>
              </div>
              <i class="db-otto-prog" id="db-otto-prog"></i>
            </div>
          </div>
        </div>

        <div class="d2-fila1">
          <div class="d2-hero">
            <small>Tiempo promedio para entregar</small>
            <div class="d2-hero-n"><b class="db-tr-n">${ahoraP ? ahoraP.dias.toFixed(1) : "—"}</b><span>días</span></div>
            <span class="d2-delta${delta === null ? "" : delta <= 0 ? " mejor" : " peor"}">${delta === null
              ? (dash.comparar ? "Sin entregas para comparar" : `${ahoraP ? ahoraP.n : 0} entregadas en el periodo`)
              : `${delta <= 0 ? "▼" : "▲"} ${Math.abs(delta).toFixed(1)} días vs. ${textoRango(prevD, prevH)}`}</span>
            <img src="marca/oso-trofeo.png" alt="">
          </div>
          <section class="d2-flujo">
            <header><h3>Cómo va el flujo</h3><small>${tsEst.length} ${tsEst.length === 1 ? "solicitud" : "solicitudes"} en el periodo</small>
              ${dash.filtros.estatus ? `<button type="button" class="d2-todas" data-dim="estatus" data-val="">Ver todas</button>` : `<span class="d2-tip">Toca una etapa para filtrar todo</span>`}</header>
            <div class="d2-etapas">
              ${ETAPAS.map(([e, , sub], i) => { const n = porEstatus(e); const p = tsEst.length ? (n / tsEst.length) * 100 : 0; return `
                <button type="button" class="d2-et${e === "CANCELADO" ? " cancel" : ""}" data-dim="estatus" data-val="${e}" style="--c:${ESTATUS_COLOR[e]};--i:${i}" title="${ESTATUS_TEXTO[e]}: ${n} · Toca para filtrar">
                  <b class="db-kpi-n" data-n="${n}">${animar ? 0 : n}</b>
                  <span class="d2-et-n">${ESTATUS_TEXTO[e]}</span>
                  <small>${sub(n)}</small>
                  ${e === "CANCELADO" ? "" : `<i class="d2-et-b"><em style="width:${p}%"></em></i>`}
                </button>`; }).join("")}
            </div>
          </section>
        </div>

        <div class="d2-fila2">
          ${panel("db-tendencia", "Solicitudes por día", svg('<rect x="4" y="11" width="4" height="9" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="16" y="13" width="4" height="7" rx="1"/>'), `${totNuevas} en el periodo`, `
            <div class="db-dias">
              ${diasActivos.length ? diasActivos.map(({ d, i }, k) => {
                const pct = totNuevas ? Math.round((d.nuevas / totNuevas) * 100) : 0;
                const esHoy = d.clave === claveDia(hoy0);
                const ratio = d.nuevas / maxNuevas;
                const pico = d.nuevas > 0 && d.nuevas === maxNuevas;
                const sem = d.fecha.toLocaleDateString("es-MX", { weekday: "short" }).replace(".", "");
                const nombre = `${sem.charAt(0).toUpperCase()}${sem.slice(1)} ${d.fecha.getDate()} ${d.fecha.toLocaleDateString("es-MX", { month: "short" }).replace(".", "")}`;
                return `
                <button type="button" class="db-fila db-dia${esHoy ? " hoy" : ""}${pico ? " pico" : ""}" data-dim="dia" data-val="${d.clave}" style="--i:${i};--k:${k}"
                  title="${fmtCorto(d.fecha)}: ${d.nuevas} ${d.nuevas === 1 ? "nueva" : "nuevas"} (${pct}% del periodo) · ${d.resueltas} ${d.resueltas === 1 ? "entregada" : "entregadas"} · Toca para filtrar">
                  <span class="db-nombre">${esc(nombre)}${esHoy ? `<i class="db-hoy">Hoy</i>` : ""}${pico ? `<i class="db-pico" title="El día con más solicitudes">🔥</i>` : ""}</span>
                  <span class="db-barra"><i style="--p:${ratio * 100};--c:color-mix(in srgb,var(--dia-c) ${Math.round(45 + 55 * ratio)}%,#D6E6F8)"></i>${d.nuevas ? `<em class="db-perilla" style="--p:${ratio * 100}"></em>` : ""}</span>
                  <b class="db-n"><span class="db-dia-n" data-n="${d.nuevas}">${animar ? 0 : d.nuevas}</span><small>${pct}%</small></b>
                  <span class="db-col-res${d.resueltas ? "" : " vacio"}">${d.resueltas ? `✓${d.resueltas}` : "·"}</span>
                </button>`;
              }).join("") : `<p class="db-vacio">Sin solicitudes en este periodo</p>`}
            </div>
            <div class="db-mini-ley"><span><i class="n"></i>Nuevas · % del periodo</span><span><i class="r"></i>✓ Entregadas ese día</span>${diasSin ? `<span>${diasSin} ${diasSin === 1 ? "día" : "días"} sin movimiento</span>` : ""}</div>`)}

          ${panel("d2-edad", "Días abiertas", svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), `${abiertasE.length} sin entregar`, `
            <div class="d2-apil">${EDADES.map(([k, , c], i) => porEdad[i] ? `<i style="flex:${porEdad[i]};background:${c}"></i>` : "").join("") || `<i style="flex:1;background:var(--raya)"></i>`}</div>
            <div class="d2-edades">
              ${EDADES.map(([k, t, c], i) => `
                <button type="button" class="d2-ed" data-dim="edad" data-val="${k}" style="--c:${c}" title="Toca para filtrar">
                  <span>${t}</span><i><em style="width:${abiertasE.length ? (porEdad[i] / abiertasE.length) * 100 : 0}%"></em></i><b>${porEdad[i]}</b>
                </button>`).join("")}
            </div>
            ${masVieja ? `<p class="d2-nota">La más antigua lleva <b>${difDias(new Date(masVieja.creadoEn), new Date())} ${difDias(new Date(masVieja.creadoEn), new Date()) === 1 ? "día" : "días"}</b>: ${esc(masVieja.folio)} · ${esc(masVieja.cadena)}</p>` : `<p class="d2-nota ok">No hay solicitudes abiertas. ¡Todo entregado!</p>`}`)}

          ${panel("d2-prio", "Por prioridad", svg('<rect x="8" y="2" width="8" height="20" rx="3"/><circle cx="12" cy="7" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="17" r="1.6"/>'), "", `
            <div class="d2-dona-in">
              <div class="d2-dona" style="background:conic-gradient(${conic})"><span><b>${totPrio}</b><small>${totPrio === 1 ? "solicitud" : "solicitudes"}</small></span></div>
              <div class="d2-ley">${prios.map(({ p, n }) => `<button type="button" data-dim="prioridad" data-val="${p}" style="--c:${PRIORIDAD_COLOR[p]}" title="Toca para filtrar"><i></i>${PRIORIDAD_TEXTO[p]}<b>${n}</b></button>`).join("")}</div>
            </div>`)}
        </div>

        <div class="d2-fila3">
          ${panel("d2-equipo", "Equipo IC", svg('<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>'), "atendidas y promedio para entregar", `
            <div class="d2-lista">
              ${admins.length ? admins.map((a, i) => a.nombre === "Sin asignar"
                ? persona("asignado", a.nombre, "#A3ADC2", "Sin asignar", "esperan que alguien las tome", a.total, a.total === 1 ? "solicitud" : "solicitudes")
                : persona("asignado", a.nombre, COLOR_IC[i % COLOR_IC.length], a.nombre, `${a.total} ${a.total === 1 ? "atendida" : "atendidas"} · ${a.curso} en curso`,
                    a.nDias ? (a.dias / a.nDias).toFixed(1) : "—", a.nDias ? "días prom." : "sin entregas", i < 3 ? ` <em>${MEDALLA[i]}</em>` : "")).join("")
                : `<p class="db-vacio">Aún nadie de IC ha tomado solicitudes</p>`}
            </div>`)}

          ${panel("db-tipo", "Por tipo de solicitud", svg('<path d="M20 12l-8 8-9-9V3h8z"/><circle cx="7.5" cy="7.5" r="1.5"/>'), "", barrasDash(
            contarPor(de("categoria"), (t) => t.categoria), { color: "#3F60A8", total: de("categoria").length, dim: "categoria", icono: (i) => iconoCategoria(i.nombre) }))}

          <section class="db-panel d2-lugar">
            <header><span class="db-hico">${ICONO.tienda}</span><h3>Dónde se pide más</h3>
              <span class="d2-tabs"><button type="button" data-lugar="cadena" class="${dash.lugar === "cadena" ? "on" : ""}">Cadena</button><button type="button" data-lugar="plaza" class="${dash.lugar === "plaza" ? "on" : ""}">Plaza</button></span></header>
            <div class="db-cuerpo">${barrasDash(lugares, { color: "#7B61C4", total: de(dash.lugar).length, dim: dash.lugar })}</div>
          </section>

          ${panel("d2-ejec", "Quién pide más", svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.5-5.5 6.5-5.5s5.7 2 6.5 5.5"/><circle cx="17.5" cy="9" r="2.8"/><path d="M16 14.6c2.8.2 4.8 2 5.5 5"/>'), `${ejecutivos.length} ${ejecutivos.length === 1 ? "persona" : "personas"}`, `
            <div class="d2-lista">
              ${ejecutivos.length ? ejecutivos.map((e) => persona("solicitante", e.nombre, "#E97132", e.nombre, `${total ? Math.round((e.n / total) * 100) : 0}% del total`, e.n, e.n === 1 ? "solicitud" : "solicitudes")).join("")
                : `<p class="db-vacio">Sin solicitudes con estos filtros</p>`}
            </div>`)}
        </div>
      </div>
      </div></div>`;

    // números que suben
    $$(".db-kpi-n").forEach((n) => EF.contar(n, animar ? 0 : Number(n.dataset.n), Number(n.dataset.n), 800));
    $$(".db-dia-n").forEach((n, k) => { if (animar) setTimeout(() => EF.contar(n, 0, Number(n.dataset.n), 650), 150 + k * 70); });
    requestAnimationFrame(() => requestAnimationFrame(() => { const d = $("#db"); if (d) d.classList.add("listo"); }));

    // Otto y sus hallazgos (se calculan con el periodo y los filtros)
    const lista = hallazgos(ts, { admins, ahoraP, antesP, delta, prev: textoRango(prevD, prevH), masVieja, abiertas: abiertasE.length });
    let idx = 0;
    const oso = $("#db-otto-oso");
    const mostrarHallazgo = (i, saluda = true) => {
      idx = (i + lista.length) % lista.length;
      const p = $("#db-otto-txt");
      p.classList.remove("entra"); void p.offsetWidth; p.classList.add("entra");
      p.innerHTML = lista[idx];
      $("#db-otto-puntos").innerHTML = lista.map((_, k) => `<i class="${k === idx ? "on" : ""}"></i>`).join("");
      const prog = $("#db-otto-prog");
      if (prog) { prog.classList.remove("corre"); void prog.offsetWidth; prog.classList.add("corre"); }
      if (saluda && !EF.quieto) { oso.classList.remove("habla"); void oso.offsetWidth; oso.classList.add("habla"); }
    };
    mostrarHallazgo(0, false);
    const reiniciarRonda = () => { clearInterval(dash.timer); dash.timer = setInterval(() => mostrarHallazgo(idx + 1), 7000); };
    reiniciarRonda();
    $("#db-otto-sig").addEventListener("click", (e) => { e.stopPropagation(); mostrarHallazgo(idx + 1); reiniciarRonda(); });
    $("#db-otto-ant").addEventListener("click", (e) => { e.stopPropagation(); mostrarHallazgo(idx - 1); reiniciarRonda(); });
    oso.addEventListener("click", () => { mostrarHallazgo(idx + 1); reiniciarRonda(); });
    $(".db-otto-globo").addEventListener("click", (e) => { if (!e.target.closest("button")) { mostrarHallazgo(idx + 1); reiniciarRonda(); } });

    // calendario del periodo
    const cal = $("#db-cal"), btnR = $("#db-rango");
    const pintarCal = () => { cal.innerHTML = htmlCalendario(); };
    const abrirCal = () => {
      dash.cal = { desde: dash.desde, hasta: dash.hasta, comparar: dash.comparar, mes: new Date(dash.hasta.getFullYear(), dash.hasta.getMonth(), 1) };
      pintarCal(); cal.hidden = false; btnR.setAttribute("aria-expanded", "true");
    };
    const cerrarCal = () => { cal.hidden = true; btnR.setAttribute("aria-expanded", "false"); };
    btnR.addEventListener("click", (e) => { e.stopPropagation(); if (cal.hidden) abrirCal(); else cerrarCal(); });
    cal.addEventListener("click", (e) => {
      e.stopPropagation();
      const c = dash.cal;
      const diaB = e.target.closest("[data-cal-dia]");
      const at = e.target.closest("[data-cal-atajo]");
      const mesB = e.target.closest("[data-cal-mes]");
      if (diaB) {
        const [y, m, d] = diaB.dataset.calDia.split("-").map(Number);
        const f = new Date(y, m - 1, d);
        if (!c.hasta || +c.desde !== +c.hasta && c.hasta) {
          // empieza un rango nuevo si ya había uno completo
          if (c.hasta) { c.desde = f; c.hasta = null; } else if (f < c.desde) { c.hasta = c.desde; c.desde = f; } else c.hasta = f;
        } else if (f < c.desde) { c.hasta = c.desde; c.desde = f; } else c.hasta = f;
        pintarCal(); return;
      }
      if (at) { const [a, z] = atajosPeriodo().find(([k]) => k === at.dataset.calAtajo)[2](); c.desde = a; c.hasta = z; c.mes = new Date(z.getFullYear(), z.getMonth(), 1); pintarCal(); return; }
      if (mesB) { c.mes = new Date(c.mes.getFullYear(), c.mes.getMonth() + Number(mesB.dataset.calMes), 1); pintarCal(); return; }
      if (e.target.closest("[data-cal-cerrar]")) { cerrarCal(); return; }
      if (e.target.closest("[data-cal-aplicar]") && c.hasta) {
        dash.desde = c.desde; dash.hasta = c.hasta; dash.comparar = c.comparar;
        delete dash.filtros.dia;
        pintarDashboard(true);
      }
    });
    cal.addEventListener("change", (e) => {
      const c = dash.cal;
      if (e.target.id === "dc-comparar") { c.comparar = e.target.checked; pintarCal(); return; }
      if (e.target.id === "dc-desde" || e.target.id === "dc-hasta") {
        const v = e.target.value;
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(v)) return;
        const [y, m, d] = v.split("-").map(Number);
        const f = new Date(y, m - 1, d);
        if (f > dia0(new Date())) return;
        if (e.target.id === "dc-desde") { c.desde = f; if (c.hasta && c.hasta < f) c.hasta = f; } else { c.hasta = f < c.desde ? c.desde : f; }
        c.mes = new Date((c.hasta || c.desde).getFullYear(), (c.hasta || c.desde).getMonth(), 1);
        pintarCal();
      }
    });
    document.addEventListener("click", function fuera(ev) {
      if (!document.body.contains(cal)) { document.removeEventListener("click", fuera); return; }
      if (!cal.hidden && !ev.target.closest("#db-cal") && !ev.target.closest("#db-rango")) cerrarCal();
    });

    // cadena / plaza
    $$("[data-lugar]").forEach((b) => b.addEventListener("click", (e) => { e.stopPropagation(); dash.lugar = b.dataset.lugar; pintarDashboard(false); }));

    // filtros cruzados: tocar cualquier elemento filtra todo el dashboard
    $("#db").addEventListener("click", (e) => {
      const el = e.target.closest("[data-dim]");
      if (!el) return;
      const { dim, val } = el.dataset;
      if (dim === "estatus" && !val) delete dash.filtros.estatus;
      else if (dash.filtros[dim] === val) delete dash.filtros[dim];
      else dash.filtros[dim] = val;
      pintarDashboard(false);
    });

    // marcar lo elegido y apagar el resto de su gráfica
    $$("#db [data-dim]").forEach((el) => {
      const v = dash.filtros[el.dataset.dim];
      const activo = v !== undefined;
      const esEste = activo && el.dataset.val === v;
      el.classList.toggle("sel", esEste);
      el.classList.toggle("apagado", activo && !esEste && el.dataset.val !== "");
      if (el.matches("button")) el.setAttribute("aria-pressed", String(esEste));
    });

    // barra de filtros activos (fuera del lienzo para que no se escale)
    const filtros = Object.entries(dash.filtros);
    const barra = document.createElement("div");
    barra.className = "db-filtros" + (filtros.length ? "" : " oculto");
    barra.innerHTML = filtros.length ? `
      <span class="db-filtros-t">Filtrando</span>
      ${filtros.map(([d, v]) => `<button type="button" class="db-chip" data-quitar="${d}" title="Quitar este filtro"><small>${NOMBRE_DIM[d]}</small>${esc(textoFiltro(d, v))}<i aria-hidden="true">×</i></button>`).join("")}
      <span class="db-filtros-n">${total} ${total === 1 ? "solicitud" : "solicitudes"}</span>
      <button type="button" class="db-limpiar" id="db-limpiar">Limpiar</button>
      <button type="button" class="db-ir" id="db-ir">Ver en el tablero →</button>` : "";
    $("#contenido").appendChild(barra);
    barra.addEventListener("click", (e) => {
      const q = e.target.closest("[data-quitar]");
      if (q) { delete dash.filtros[q.dataset.quitar]; pintarDashboard(false); return; }
      if (e.target.closest("#db-limpiar")) { dash.filtros = {}; pintarDashboard(false); return; }
      if (e.target.closest("#db-ir")) {
        const f = dash.filtros;
        tablero.filtro = f.estatus || null;
        tablero.busca = f.plaza || f.cadena || f.categoria || f.solicitante || (f.asignado !== "Sin asignar" ? f.asignado : "") || "";
        tablero.pagina = 0;
        ir("tablero");
      }
    });
    ajustarLienzo();
  }

  // ================================================================ TABLERO
  const tablero = {
    tickets: [], filtro: null, busca: "", selId: null, pagina: 0, ocupado: false, folioPedido: null,
    // control de animaciones
    conteos: null, animarLista: true, saludNueva: true, ultimoDetalle: { id: null, estatus: null },
    // trabajo en equipo
    vista: "todas", orden: "vence", equipo: [], pop: null, popSel: null, quitarRT: null,
    // chat por ticket
    pestana: "info", chat: { ticketId: null, mensajes: [], cargando: false }, noLeidos: {}, borrador: {}, quitarChat: null,
  };

  (function leerFolioDeUrl() {
    try { tablero.folioPedido = new URLSearchParams(location.search).get("folio"); } catch (e) { /* nada */ }
  })();

  const ORDENES = [["vence", "Vence primero"], ["recientes", "Más recientes"], ["prioridad", "Prioridad"]];
  const PESO_PRIO = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };
  const msVence = (t) => (t.venceEn ? new Date(t.venceEn).getTime() : Infinity);
  const estaFuera = (t) => ABIERTOS.includes(t.estatus) && t.venceEn && new Date(t.venceEn).getTime() < Date.now();
  const finDeHoy = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };

  /** Pastilla de tiempo restante y cuánto del tiempo compromiso ya se usó. */
  function tiempoBoleto(t) {
    const ahora = Date.now();
    const dur = (ms) => { const m = Math.round(ms / 60000); if (m < 60) return `${Math.max(1, m)} min`; const h = Math.round(m / 60); return h < 48 ? `${h} h` : `${Math.round(h / 24)} días`; };
    if (t.estatus === "COMPLETADO") return { txt: "Cerrada", cls: "cerrada", p: 100 };
    if (t.estatus === "ENTREGADO") return { txt: "Por confirmar", cls: "entregado", p: 100 };
    if (t.estatus === "CANCELADO") return { txt: "Cancelada", cls: "cerrada", p: 100 };
    const ini = new Date(t.creadoEn).getTime();
    const fin = t.venceEn ? new Date(t.venceEn).getTime() : null;
    const p = fin ? Math.max(0, Math.min(100, ((ahora - ini) / Math.max(1, fin - ini)) * 100)) : 0;
    if (t.estatus === "EN_ESPERA") return { txt: "En pausa", cls: "pausa", p };
    if (!fin) return { txt: "Sin fecha", cls: "bien", p: 0 };
    if (ahora > fin) return { txt: `Vencida hace ${dur(ahora - fin)}`, cls: "fuera", p: 100 };
    const resta = fin - ahora;
    if (resta < 24 * 3600000) return { txt: `Vence en ${dur(resta)}`, cls: resta < 6 * 3600000 ? "vence" : "bien", p };
    return { txt: `Vence ${new Date(fin).toLocaleDateString("es-MX", { weekday: "short", day: "numeric" })}`, cls: "bien", p };
  }

  /** Pinta el equipo de IC con su carga actual. */
  function pintarEquipo() {
    const caja = $("#t-equipo");
    if (!caja) return;
    const abiertos = tablero.tickets.filter((t) => ABIERTOS.includes(t.estatus));
    const datos = tablero.equipo.map((m) => {
      const mios = abiertos.filter((t) => t.asignadoId === m.id);
      return {
        ...m,
        curso: mios.length,
        hoy: mios.filter((t) => t.venceEn && new Date(t.venceEn).getTime() <= finDeHoy() && !estaFuera(t)).length,
        fuera: mios.filter(estaFuera).length,
      };
    });
    const max = Math.max(1, ...datos.map((d) => d.curso));
    const sinDueno = abiertos.filter((t) => !t.asignadoId).length;
    caja.innerHTML = `
      <header><b>Equipo IC</b><small>carga actual</small></header>
      ${datos.map((d) => {
        const v = yo && d.id === yo.id ? "mias" : `u:${d.id}`;
        const nivel = d.curso >= max && d.curso >= 3 ? "alta" : d.curso >= 2 ? "media" : "baja";
        return `
        <button type="button" class="eq-persona${tablero.vista === v ? " sel" : ""}" data-vista="${v}" title="Ver los tickets de ${esc(d.nombre)}">
          <span class="eq-cara">${esc(iniciales(d.nombre))}</span>
          <span class="eq-txt">
            <b>${esc(d.nombre.split(" ")[0])}${yo && d.id === yo.id ? " <em>(tú)</em>" : ""}</b>
            <small>${d.curso} en curso${d.hoy ? ` · <span class="eq-hoy">${d.hoy} vence hoy</span>` : ""}${d.fuera ? ` · <span class="eq-fuera">${d.fuera} vencida${d.fuera > 1 ? "s" : ""}</span>` : ""}</small>
            <span class="eq-carga ${nivel}"><i style="--p:${(d.curso / max) * 100}"></i></span>
          </span>
          <b class="eq-n">${d.curso}</b>
        </button>`;
      }).join("")}
      <button type="button" class="eq-sin${tablero.vista === "sin" ? " sel" : ""}" data-vista="sin">
        <span class="eq-cara">?</span><span>Sin asignar</span><b>${sinDueno}</b>
      </button>`;
  }

  /** Filtros rápidos de la lista. */
  function pintarChips() {
    const caja = $("#t-chips");
    if (!caja) return;
    const abiertos = tablero.tickets.filter((t) => ABIERTOS.includes(t.estatus));
    const cuenta = {
      todas: tablero.tickets.length,
      mias: tablero.tickets.filter((t) => yo && t.asignadoId === yo.id && ABIERTOS.includes(t.estatus)).length,
      sin: abiertos.filter((t) => !t.asignadoId).length,
      urgentes: abiertos.filter((t) => t.prioridad === "URGENTE").length,
      fuera: abiertos.filter(estaFuera).length,
    };
    const otros = tablero.equipo.filter((m) => !yo || m.id !== yo.id);
    const chips = [
      ["todas", "Todas", cuenta.todas],
      ["mias", "Mías", cuenta.mias],
      ["sin", "Sin asignar", cuenta.sin],
      ["pedi", "Las que pedí", tablero.tickets.filter((t) => yo && t.solicitante === yo.nombre).length],
      ...otros.map((m) => [`u:${m.id}`, `De ${m.nombre.split(" ")[0]}`, abiertos.filter((t) => t.asignadoId === m.id).length]),
      ["urgentes", "Urgentes", cuenta.urgentes],
      ["fuera", "Fuera de tiempo", cuenta.fuera],
    ];
    caja.innerHTML = chips.map(([v, txt, n]) => `
      <button type="button" class="chip-f${tablero.vista === v ? " sel" : ""}${v === "fuera" && n ? " alerta" : ""}" data-vista="${v}">${txt}<b>${n}</b></button>`).join("");
  }

  function elegirVista(v) {
    tablero.vista = tablero.vista === v && v !== "todas" ? "todas" : v;
    tablero.animarLista = true;
    pintarChips();
    pintarEquipo();
    pintarLista();
  }

  async function refrescarPorEquipo() {
    // alguien más de IC hizo un cambio: se actualiza la lista y se avisa qué pasó
    const antes = new Map(tablero.tickets.map((t) => [t.id, t]));
    try { tablero.tickets = await D.tickets(); } catch (e) { return; }
    let mensaje = null;
    for (const t of tablero.tickets) {
      const a = antes.get(t.id);
      if (!a) { mensaje = [`Nueva solicitud ${t.folio}`, `${t.solicitante} · ${t.categoria}`]; break; }
      if (a.asignadoId !== t.asignadoId && t.asignado) { mensaje = [`${t.asignado.split(" ")[0]} tiene ahora ${t.folio}`, a.estatus === "NUEVO" ? "Lo acaba de tomar" : "Se lo reasignaron"]; break; }
      if (a.estatus !== t.estatus) { mensaje = [`${t.folio} pasó a ${ESTATUS_TEXTO[t.estatus]}`, t.asignado ? `Lo movió ${t.asignado}` : ""]; break; }
    }
    pintarTodo();
    if (mensaje) avisar(mensaje[0], mensaje[1]);
  }

  async function vistaTablero() {
    cargandoVista("Cargando tickets…");
    try {
      tablero.tickets = await D.tickets();
      if (esIC(yo) && D.equipo) tablero.equipo = await D.equipo();
      tablero.noLeidos = D.chatNoLeidos ? await D.chatNoLeidos() : {};
    } catch (e) { errorVista(e.message); return; }

    tablero.conteos = null;
    tablero.pruebaLuces = true;
    tablero.animarLista = true;
    tablero.saludNueva = true;
    tablero.ultimoDetalle = { id: null, estatus: null };
    tablero.pop = null;
    if (!esIC(yo)) tablero.vista = "todas";

    if (tablero.folioPedido) {
      const t = tablero.tickets.find((x) => x.folio === tablero.folioPedido);
      if (t) tablero.selId = t.id;
      tablero.folioPedido = null;
    }

    $("#contenido").innerHTML = `
      <div class="escenario" id="escenario"><div class="lienzo" id="lienzo" data-ancho="1280" data-alto="660" data-adaptable="1"><div class="tab-lienzo">
      <div class="tablero${esIC(yo) ? " con-equipo" : ""}">
        <section class="panel">
          <header>
            <span class="panel-luz" aria-hidden="true"></span>
            <b>${esIC(yo) ? "Tickets" : "Mis solicitudes"}</b>
            <small id="t-cuantos"></small>
          </header>
          <div class="busca busca-fila">
            <input type="search" id="t-busca" value="${esc(tablero.busca)}" placeholder="${esIC(yo) ? "Buscar…" : "Buscar folio, plaza o tipo"}" title="Busca por folio, plaza, cadena, tipo o persona" aria-label="Buscar">
            <select id="t-orden" aria-label="Ordenar">${ORDENES.map(([v, t]) => `<option value="${v}"${tablero.orden === v ? " selected" : ""}>${t}</option>`).join("")}</select>
          </div>
          ${esIC(yo) ? `<div class="chips-f" id="t-chips" role="group" aria-label="Filtros rápidos"></div>` : ""}
          <div class="pila" id="t-pila"></div>
        </section>
        <section class="detalle" id="t-detalle" aria-live="polite"></section>
        <aside class="tab-lado">
          <div class="salud" id="t-salud"></div>
          <div class="marcadores" id="t-marcadores"></div>
          ${esIC(yo) ? `<div class="equipo" id="t-equipo"></div>` : ""}
        </aside>
      </div>
      </div></div></div>`;

    $("#t-busca").addEventListener("input", (e) => { tablero.busca = e.target.value; pintarLista(); });
    $("#t-orden").addEventListener("change", (e) => { tablero.orden = e.target.value; tablero.animarLista = true; pintarLista(); });
    if ($("#t-chips")) $("#t-chips").addEventListener("click", (e) => { const b = e.target.closest("[data-vista]"); if (b) elegirVista(b.dataset.vista); });
    if ($("#t-equipo")) $("#t-equipo").addEventListener("click", (e) => { const b = e.target.closest("[data-vista]"); if (b) elegirVista(b.dataset.vista); });
    $("#t-marcadores").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-filtro]");
      if (!b) return;
      const f = b.dataset.filtro || null;
      tablero.filtro = f && tablero.filtro !== f ? f : null;
      tablero.animarLista = true;
      pintarMarcadores();
      pintarLista();
    });
    $("#t-pila").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-id]");
      if (!b) return;
      tablero.selId = b.dataset.id;
      tablero.pop = null;
      $$("#t-pila .boleto").forEach((x) => x.setAttribute("aria-current", String(x === b)));
      pintarDetalle();
      if (esMovil()) abrirHoja();
    });
    $("#t-salud").addEventListener("click", (e) => {
      const sem = e.target.closest(".sem-anim");
      if (!sem || EF.quieto) return;
      sem.classList.remove("arranque", "saluda"); void sem.offsetWidth;
      sem.classList.add("arranque", "saluda");
      setTimeout(() => sem.classList.remove("arranque", "saluda"), 1700);
    });
    $("#t-detalle").addEventListener("click", accionDetalle);

    // tiempo real: lo que hacen los otros dos de IC aparece solo
    if (tablero.quitarRT) tablero.quitarRT();
    tablero.quitarRT = D.suscribirTickets ? D.suscribirTickets(refrescarPorEquipo) : null;
    if (tablero.quitarChat) tablero.quitarChat();
    tablero.quitarChat = D.suscribirChat ? D.suscribirChat(alCambiarChat) : null;

    pintarTodo();
    ajustarLienzo();
  }

  // ---------------------------------------------------------------- chat por ticket
  const RAPIDAS_IC = ["Ya lo estoy revisando 👀", "¿Me compartes el contrato?", "¿Para qué fecha lo necesitas?", "Te lo envío hoy", "¡Listo! Ya quedó ✅"];
  const RAPIDAS_EJE = ["¿Cómo va mi solicitud?", "Te comparto la información", "¿Necesitas algo más de mi parte?", "¡Gracias! 🙌"];
  const horaCorta = (f) => new Date(f).toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  function etiquetaDia(f) {
    const d = new Date(f); const h = new Date(); h.setHours(0, 0, 0, 0);
    const dd = new Date(d); dd.setHours(0, 0, 0, 0);
    const dif = Math.round((h - dd) / 86400000);
    if (dif === 0) return "Hoy";
    if (dif === 1) return "Ayer";
    const t = d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long" });
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  const enlazar = (txt) => esc(txt).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, "<br>");

  /** Mensajes + movimientos del ticket, en orden, con separadores por día. */
  function htmlMensajes(sel) {
    const items = [
      ...tablero.chat.mensajes.map((m) => ({ tipo: "msg", f: m.creadoEn, m })),
      ...sel.movimientos.map((m) => ({ tipo: "sis", f: m.creadoEn, m })),
    ].sort((a, z) => a.f.localeCompare(z.f));
    if (!tablero.chat.mensajes.length) {
      const otro = esIC(yo) ? String(sel.solicitante).split(" ")[0] : (sel.asignado ? sel.asignado.split(" ")[0] : "Inteligencia Comercial");
      items.push({ tipo: "vacio", f: "", otro });
    }
    let dia = "", previo = null;
    return items.map((it) => {
      let sep = "";
      if (it.f) { const d = etiquetaDia(it.f); if (d !== dia) { dia = d; sep = `<div class="ch-dia"><span>${d}</span></div>`; previo = null; } }
      if (it.tipo === "vacio") {
        return `<div class="ch-vacio"><img src="${IMG.otto}" alt=""><p>Aún no hay mensajes. Escríbele a <b>${esc(it.otro)}</b> para dar seguimiento: la conversación queda guardada en este ticket.</p></div>`;
      }
      if (it.tipo === "sis") {
        previo = null;
        const m = it.m;
        const txt = m.nota === "Solicitud creada" ? `${m.autor} levantó la solicitud`
          : m.nota && m.nota.startsWith("Reasignado a") ? `${m.autor}: ${m.nota}`
          : `${m.autor} la movió a ${ESTATUS_TEXTO[m.a]}${m.nota ? ` · “${m.nota}”` : ""}`;
        return `${sep}<div class="ch-sis" style="--c:${ESTATUS_COLOR[m.a]}"><i></i>${esc(txt)} · ${horaCorta(m.creadoEn)}</div>`;
      }
      const m = it.m;
      const seguido = previo && previo.autorId === m.autorId && (new Date(m.creadoEn) - new Date(previo.creadoEn)) < 5 * 60000;
      previo = m;
      return `${sep}<div class="ch-msg${m.mio ? " mio" : ""}${seguido ? " seguido" : ""}${m.enviando ? " enviando" : ""}">
        ${!m.mio && !seguido ? `<span class="ch-cara${m.esIC ? " ic" : ""}">${esc(iniciales(m.autor))}</span>` : ""}
        <div class="ch-burbuja">
          ${!m.mio && !seguido ? `<b class="ch-autor${m.esIC ? " ic" : ""}">${esc(m.autor)}${m.esIC ? " · IC" : ""}</b>` : ""}
          <span class="ch-txt">${enlazar(m.texto)}</span>
          <span class="ch-meta">${horaCorta(m.creadoEn)}${m.mio ? `<i class="ch-palomas${m.visto ? " visto" : ""}" title="${m.enviando ? "Enviando…" : m.visto ? "Visto" : "Enviado"}">${m.enviando ? "🕓" : m.visto ? "✓✓" : "✓"}</i>` : ""}</span>
        </div>
      </div>`;
    }).join("");
  }

  function pintarListaChat(sel, alFinal = true) {
    const lista = $("#chat-msgs");
    if (!lista) return;
    const cerca = lista.scrollHeight - lista.scrollTop - lista.clientHeight < 80;
    lista.innerHTML = tablero.chat.cargando && !tablero.chat.mensajes.length ? `<div class="ch-cargando">Cargando conversación…</div>` : htmlMensajes(sel);
    if (alFinal || cerca) lista.scrollTop = lista.scrollHeight;
  }

  /** Pinta el chat del ticket seleccionado y trae sus mensajes. */
  function pintarChat(sel, enfocar = false) {
    const caja = $("#chat");
    if (!caja) return;
    const otro = esIC(yo) ? sel.solicitante : (sel.asignado || "Inteligencia Comercial");
    const rapidas = esIC(yo) ? RAPIDAS_IC : RAPIDAS_EJE;
    caja.innerHTML = `
      <div class="ch-cab">
        <span class="ch-cara grande${esIC(yo) ? "" : " ic"}">${esc(iniciales(otro))}</span>
        <div><b>${esc(otro)}</b><small>${esIC(yo) ? "Quien levantó la solicitud" : sel.asignado ? "Te atiende en Inteligencia Comercial" : "Equipo de Inteligencia Comercial"} · la conversación queda guardada en el ticket</small></div>
      </div>
      <div class="chat-msgs" id="chat-msgs" aria-live="polite"></div>
      <div class="ch-rapidas">${rapidas.map((r) => `<button type="button" data-accion="rapida" data-txt="${esc(r)}">${esc(r)}</button>`).join("")}</div>
      <form class="chat-escribe" id="chat-form" autocomplete="off">
        <textarea id="chat-txt" rows="1" maxlength="2000" placeholder="Escribe un mensaje…  (Enter para enviar · Shift+Enter para otra línea)">${esc(tablero.borrador[sel.id] || "")}</textarea>
        <button type="submit" aria-label="Enviar mensaje"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.4 20.4 21 12 3.4 3.6 3 10l12 2-12 2z"/></svg></button>
      </form>`;
    const txt = $("#chat-txt");
    const ajustar = () => { txt.style.height = "auto"; txt.style.height = `${Math.min(txt.scrollHeight, 110)}px`; };
    ajustar();
    txt.addEventListener("input", () => { tablero.borrador[sel.id] = txt.value; ajustar(); });
    txt.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#chat-form").requestSubmit(); } });
    $("#chat-form").addEventListener("submit", (e) => { e.preventDefault(); enviarChat(sel); });
    if (enfocar) txt.focus();
    if (tablero.chat.ticketId === sel.id) pintarListaChat(sel);
    cargarChat(sel, tablero.chat.ticketId !== sel.id);
  }

  async function cargarChat(sel, nuevo) {
    if (nuevo) { tablero.chat = { ticketId: sel.id, mensajes: [], cargando: true }; pintarListaChat(sel); }
    try {
      const msgs = await D.mensajes(sel.id);
      if (tablero.chat.ticketId !== sel.id) return;
      tablero.chat = { ticketId: sel.id, mensajes: msgs, cargando: false };
      pintarListaChat(sel, nuevo);
      if (tablero.noLeidos[sel.id]) {
        await D.marcarChatLeido(sel.id);
        tablero.noLeidos[sel.id] = 0;
        pintarGlobitosChat();
      } else if (D.marcarChatLeido) D.marcarChatLeido(sel.id);
    } catch (e) { tablero.chat.cargando = false; pintarListaChat(sel); }
  }

  async function enviarChat(sel) {
    const txt = $("#chat-txt");
    const texto = (txt.value || "").trim();
    if (!texto) return;
    txt.value = ""; tablero.borrador[sel.id] = ""; txt.style.height = "auto";
    // se ve al instante; se confirma al guardarse
    tablero.chat.mensajes = [...tablero.chat.mensajes, { id: `tmp${Date.now()}`, autorId: yo.id, autor: yo.nombre, esIC: esIC(yo), texto, creadoEn: new Date().toISOString(), mio: true, enviando: true }];
    pintarListaChat(sel, true);
    try {
      await D.enviarMensaje(sel.id, texto);
      const msgs = await D.mensajes(sel.id);
      if (tablero.chat.ticketId === sel.id) { tablero.chat.mensajes = msgs; pintarListaChat(sel, true); }
    } catch (e) {
      tablero.chat.mensajes = tablero.chat.mensajes.filter((m) => !m.enviando);
      pintarListaChat(sel, true);
      txt.value = texto;
      avisar("No se pudo enviar", e.message);
    }
  }

  /** Actualiza los globitos de no leídos sin repintar todo (para no perder lo que se escribe). */
  function pintarGlobitosChat() {
    $$("#t-pila .boleto").forEach((b) => {
      const n = tablero.noLeidos[b.dataset.id] || 0;
      const der = $(".b-der", b);
      if (!der) return;
      let g = $(".b-chat", der);
      if (n && !g) { g = document.createElement("span"); g.className = "b-chat"; der.prepend(g); }
      if (g) { if (n) { g.textContent = `💬 ${n}`; g.title = `${n} mensajes sin leer`; } else g.remove(); }
    });
    const sel = seleccionado();
    const dt = $("#dt-n");
    if (dt && sel) { const n = tablero.noLeidos[sel.id] || 0; dt.hidden = !n; dt.textContent = n; }
  }

  /** Llegó o se leyó un mensaje en algún ticket. */
  async function alCambiarChat(ticketId) {
    try { tablero.noLeidos = await D.chatNoLeidos(); } catch (e) { /* sin red */ }
    const sel = seleccionado();
    if (sel && tablero.pestana === "chat" && $("#chat") && (!ticketId || ticketId === sel.id)) {
      const msgs = await D.mensajes(sel.id);
      if (tablero.chat.ticketId === sel.id) {
        const antes = tablero.chat.mensajes.filter((m) => !m.enviando).length;
        tablero.chat.mensajes = msgs;
        pintarListaChat(sel, msgs.length > antes);
        if (tablero.noLeidos[sel.id]) { await D.marcarChatLeido(sel.id); tablero.noLeidos[sel.id] = 0; }
      }
    }
    pintarGlobitosChat();
  }

  /** Clics dentro del detalle: tomar, menús de estatus y de reasignar, confirmar. */
  async function accionDetalle(e) {
    if (e.target.closest("[data-volver]")) { cerrarHoja(); return; }
    const el = e.target.closest("[data-accion]");
    if (!el || tablero.ocupado) return;
    const sel = seleccionado();
    const acc = el.dataset.accion;
    if (acc === "tomar") { mover("EN_PROCESO", !esMovil(), { tomar: true }); return; }
    if (acc === "correo") { abrirCorreo(sel, el); return; }
    if (acc === "confirmar-cierre" || acc === "pedir-mas") {
      const nota = ($("#cf-nota") || {}).value || "";
      if (acc === "pedir-mas" && nota.trim().length < 5) { avisar("Cuéntale a IC qué te falta", "Escríbelo en el comentario antes de regresarla"); $("#cf-nota").focus(); return; }
      tablero.ocupado = true; pintarDetalle();
      try {
        await D.cambiarEstatus(sel.id, acc === "confirmar-cierre" ? "COMPLETADO" : "EN_PROCESO", nota);
        tablero.tickets = await D.tickets();
        if (acc === "confirmar-cierre" && !EF.quieto) EF.confeti(window.innerWidth / 2, window.innerHeight / 3);
        avisar(acc === "confirmar-cierre" ? "¡Solicitud cerrada!" : "Se la regresamos a IC", acc === "confirmar-cierre" ? "Gracias por confirmar" : "Le llegó tu comentario a quien la atiende");
      } catch (err) { avisar("No se pudo guardar", err.message); }
      finally { tablero.ocupado = false; pintarTodo(); }
      return;
    }
    if (acc === "pestana") { tablero.pestana = el.dataset.p; tablero.pop = null; pintarDetalle(); if (tablero.pestana === "chat") setTimeout(() => { const t = $("#chat-txt"); if (t && !esMovil()) t.focus(); }, 60); return; }
    if (acc === "rapida") {
      const t = $("#chat-txt");
      if (t) { t.value = t.value ? `${t.value.trim()} ${el.dataset.txt}` : el.dataset.txt; t.dispatchEvent(new Event("input")); t.focus(); }
      return;
    }
    if (acc === "abrir-estatus") { tablero.pop = tablero.pop === "estatus" ? null : "estatus"; tablero.popSel = null; pintarDetalle(); return; }
    if (acc === "abrir-reasignar") { tablero.pop = tablero.pop === "reasignar" ? null : "reasignar"; tablero.popSel = null; pintarDetalle(); return; }
    if (acc === "cerrar-pop") { tablero.pop = null; pintarDetalle(); return; }
    if (acc === "elegir") {
      tablero.popSel = el.dataset.valor;
      $$("[data-accion='elegir']").forEach((x) => x.classList.toggle("sel", x === el));
      const conf = $("#pop-confirmar");
      if (conf) { conf.disabled = false; conf.textContent = tablero.pop === "estatus" ? `Mover a ${ESTATUS_TEXTO[tablero.popSel]}` : `Pasar a ${el.dataset.nombre}`; }
      const nota = $("#t-nota"); if (nota) nota.focus();
      return;
    }
    if (acc === "confirmar" && tablero.popSel) {
      if (tablero.pop === "estatus") { const v = tablero.popSel; tablero.pop = null; mover(v, false); return; }
      if (tablero.pop === "reasignar") {
        const nota = ($("#t-nota") || {}).value || "";
        const para = tablero.equipo.find((m) => m.id === tablero.popSel);
        tablero.ocupado = true; tablero.pop = null; pintarDetalle();
        try {
          await D.reasignar(sel.id, tablero.popSel, nota);
          tablero.tickets = await D.tickets();
          avisar(`Se lo pasaste a ${para ? para.nombre.split(" ")[0] : "tu compañero"}`, "Le llegó el aviso en su campana");
        } catch (err) { avisar("No se pudo reasignar", err.message); }
        finally { tablero.ocupado = false; pintarTodo(); }
      }
    }
  }

  function visibles() {
    const q = tablero.busca.toLowerCase().trim();
    const v = tablero.vista;
    const lista = tablero.tickets.filter((t) =>
      (!tablero.filtro || t.estatus === tablero.filtro) &&
      (!q || `${t.folio}${t.plaza}${t.cadena}${t.pdv || ""}${t.categoria}${t.solicitante}${t.asignado || ""}`.toLowerCase().includes(q)) &&
      (v === "todas" ||
        (v === "mias" && yo && t.asignadoId === yo.id && ABIERTOS.includes(t.estatus)) ||
        (v === "pedi" && yo && t.solicitante === yo.nombre) ||
        (v === "sin" && !t.asignadoId && ABIERTOS.includes(t.estatus)) ||
        (v === "urgentes" && t.prioridad === "URGENTE" && ABIERTOS.includes(t.estatus)) ||
        (v === "fuera" && estaFuera(t)) ||
        (v.startsWith("u:") && t.asignadoId === v.slice(2) && ABIERTOS.includes(t.estatus))));
    // primero lo activo, luego lo que está en pausa y al final lo cerrado
    const abierto = (t) => ({ NUEVO: 0, EN_PROCESO: 0, EN_ESPERA: 1, ENTREGADO: 2, CANCELADO: 3, COMPLETADO: 4 }[t.estatus] ?? 3);
    const orden = {
      vence: (a, z) => abierto(a) - abierto(z) || msVence(a) - msVence(z),
      recientes: (a, z) => abierto(a) - abierto(z) || z.creadoEn.localeCompare(a.creadoEn),
      prioridad: (a, z) => abierto(a) - abierto(z) || PESO_PRIO[a.prioridad] - PESO_PRIO[z.prioridad] || msVence(a) - msVence(z),
    }[tablero.orden] || (() => 0);
    return lista.sort(orden);
  }

  function seleccionado() {
    return tablero.tickets.find((t) => t.id === tablero.selId) || visibles()[0] || null;
  }

  function pintarTodo() {
    pintarMarcadores();
    pintarSalud();
    pintarChips();
    pintarEquipo();
    pintarLista();
  }

  function pintarMarcadores() {
    const ts = tablero.tickets;
    const primera = tablero.conteos === null;
    const antes = tablero.conteos || {};
    const ahora = { TOTAL: ts.length };
    ESTATUS_ORDEN.forEach((e) => { ahora[e] = ts.filter((t) => t.estatus === e).length; });

    const caja = $("#t-marcadores");
    caja.classList.toggle("anim", primera);
    const ORDEN_CONTADORES = ["TOTAL", "NUEVO", "EN_PROCESO", "EN_ESPERA", "ENTREGADO", "COMPLETADO", "CANCELADO"];
    caja.innerHTML = ORDEN_CONTADORES.map((e, i) => {
      const total = e === "TOTAL";
      return `
        <button class="mk${total ? " mk-total" : ""}" type="button" data-filtro="${total ? "" : e}" style="--c:${total ? "var(--morado)" : ESTATUS_COLOR[e]};--i:${i}" aria-pressed="${total ? tablero.filtro === null : tablero.filtro === e}">
          <span class="n" data-clave="${e}">${primera ? 0 : antes[e]}</span>
          <span class="e">${total ? "Total" : ESTATUS_TEXTO[e]}</span>
        </button>`;
    }).join("");

    $$(".n[data-clave]", caja).forEach((n) => {
      const clave = n.dataset.clave;
      const de = primera ? 0 : antes[clave];
      EF.contar(n, de, ahora[clave], primera ? 900 : 500);
      if (!primera && de !== ahora[clave] && !EF.quieto) {
        n.classList.remove("brinca"); void n.offsetWidth; n.classList.add("brinca");
      }
    });
    tablero.conteos = ahora;
  }

  function pintarSalud() {
    const ahora = Date.now();
    const SEIS_HORAS = 6 * 3600000;
    const abiertos = tablero.tickets.filter((t) => ABIERTOS.includes(t.estatus));
    const fuera = abiertos.filter((t) => t.venceEn && new Date(t.venceEn).getTime() < ahora);
    const porVencer = abiertos.filter((t) => t.venceEn && t.estatus !== "EN_ESPERA" &&
      new Date(t.venceEn).getTime() >= ahora && new Date(t.venceEn).getTime() - ahora < SEIS_HORAS);
    const bien = abiertos.length - fuera.length - porVencer.length;
    const luz = fuera.length ? "rojo" : porVencer.length ? "ambar" : "verde";
    const plural = (n, a, b) => (n === 1 ? a : b);

    const titulo = fuera.length
      ? `${fuera.length} ${plural(fuera.length, "solicitud", "solicitudes")} fuera de tiempo`
      : porVencer.length
        ? `${porVencer.length} ${plural(porVencer.length, "vence", "vencen")} en menos de 6 h`
        : "Todo dentro de tiempo";
    const detalle = `${abiertos.length} abiertas · ${bien} en tiempo` +
      (porVencer.length && fuera.length ? ` · ${porVencer.length} por vencer` : "");

    const salud = $("#t-salud");
    const cambio = tablero.ultimaLuz && tablero.ultimaLuz !== luz;
    tablero.ultimaLuz = luz;
    salud.classList.toggle("anim", tablero.saludNueva);
    salud.classList.toggle("alerta", fuera.length > 0);
    tablero.saludNueva = false;
    const color = (i) => (i < bien ? "var(--verde)" : i < bien + porVencer.length ? "var(--p-media)" : "var(--rojo)");
    salud.innerHTML = `
      ${semaforoAnim(luz, titulo)}
      <div>
        <b>${titulo}</b>
        <small>${detalle}</small>
      </div>
      <div class="barra">${abiertos.map((_, i) => `<i style="--i:${i};--c:${color(i)}"></i>`).join("")}</div>`;
    const sem = $(".sem-anim", salud);
    if ((cambio || tablero.pruebaLuces !== false) && !EF.quieto) {
      sem.classList.add("arranque");
      setTimeout(() => sem.classList.remove("arranque"), 1700);
    }
    tablero.pruebaLuces = false;
    if (cambio && !EF.quieto) sem.classList.add("cambia");
  }

  function pintarLista() {
    const lista = visibles();
    const sel = seleccionado();
    $("#t-cuantos").textContent = `${lista.length} ${lista.length === 1 ? "solicitud" : "solicitudes"}`;
    const pila = $("#t-pila");
    pila.classList.toggle("anim-lista", tablero.animarLista);
    tablero.animarLista = false;
    const vacio = tablero.vista === "pedi" ? "Aún no has levantado solicitudes. Cuando envíes una, aparece aquí."
      : tablero.vista === "mias" ? "No tienes tickets abiertos. ¡Toma uno de Sin asignar!"
      : tablero.vista === "sin" ? "No hay tickets sin asignar. ¡Todo el equipo está al día!"
      : "Aquí no hay nada con ese filtro.";
    pila.innerHTML = lista.length === 0
      ? `<div class="vacio-caja">${MAQUINA_ANIM}<p>${vacio}</p></div>`
      : lista.map((t, i) => {
        const tb = tiempoBoleto(t);
        return `
        <button class="boleto" type="button" data-id="${esc(t.id)}" aria-current="${sel && sel.id === t.id}"
          style="--i:${Math.min(i, 12)};--c:${ESTATUS_COLOR[t.estatus]};--tc:${ESTATUS_TINTA[t.estatus]}" title="Creado ${haceCuanto(t.creadoEn)} por ${esc(t.solicitante)}">
          <span class="talon"><span>${esc(t.folio.slice(-6))}</span></span>
          <span class="b-cuerpo">
            <span class="b-cab">
              <span class="b-folio">${esc(t.folio)}</span>
              <span class="b-der">${tablero.noLeidos[t.id] ? `<span class="b-chat" title="${tablero.noLeidos[t.id]} mensajes sin leer">💬 ${tablero.noLeidos[t.id]}</span>` : ""}<span class="b-est" style="--c:${ESTATUS_COLOR[t.estatus]}">${ESTATUS_TEXTO[t.estatus]}</span></span>
            </span>
            <span class="t">${esc(t.categoria)}</span>
            <span class="d">${ICONO.pin}<span>${esc(t.plaza)} · ${esc(t.cadena)}</span></span>
            <span class="f">
              <span class="prio" style="--c:${PRIORIDAD_COLOR[t.prioridad]}">${PRIORIDAD_TEXTO[t.prioridad]}</span>
              <span class="tiempo ${tb.cls}">${tb.txt}</span>
              <span class="b-quien${t.asignado ? "" : " sin"}" title="${t.asignado ? `Atiende ${esc(t.asignado)}` : "Sin asignar"}">
                <span class="ini${t.asignado ? "" : " sin"}">${t.asignado ? esc(iniciales(t.asignado)) : "?"}</span>${t.asignado ? esc(t.asignado.split(" ")[0]) : "Libre"}
              </span>
            </span>
            <span class="b-sla ${tb.cls}"><i style="--p:${tb.p}"></i></span>
          </span>
        </button>`;
      }).join("");
    pintarDetalle();
  }

  function textoEstado(t) {
    if (t.estatus === "COMPLETADO") return "Cerrado";
    if (t.estatus === "CANCELADO") return "Cancelado";
    if (t.estatus === "EN_ESPERA") return "Detenido";
    if (t.estatus === "ENTREGADO") return "Entregada";
    if (t.venceEn && new Date(t.venceEn) < new Date()) return "Fuera de tiempo";
    return t.estatus === "NUEVO" ? "Sin asignar" : "En tiempo";
  }

  function detalleEstado(t) {
    if (t.estatus === "COMPLETADO") return "La solicitud quedó resuelta";
    if (t.estatus === "CANCELADO") return "Sin acciones pendientes";
    if (t.estatus === "EN_ESPERA") return "Esperando información de quien la solicitó";
    if (t.estatus === "ENTREGADO") return esIC(yo) ? `Esperando que ${String(t.solicitante).split(" ")[0]} confirme que terminó su proceso` : "Esperando tu confirmación para cerrarla";
    if (!t.venceEn) return "Sin fecha compromiso";
    const horas = Math.round((new Date(t.venceEn).getTime() - Date.now()) / 3600000);
    if (horas < 0) return `Se pasó por ${Math.abs(horas)} horas`;
    return t.asignado ? `En manos de ${t.asignado} · vence en ${horas} h` : `Vence en ${horas} h`;
  }

  /** Correo ya escrito en Outlook para avisar a quien solicitó. */
  /** Partes del correo para quien solicitó, según el estatus. */
  function partesCorreo(t) {
    const nombre = String(t.solicitante).split(" ")[0];
    const nota = ([...t.movimientos].reverse()
      .find((m) => m.a === t.estatus && m.nota && m.nota !== "Solicitud creada" && !m.nota.startsWith("Reasignado a")) || {}).nota || "";
    const asunto = `${t.folio} · ${{
      NUEVO: "Recibimos tu solicitud",
      EN_PROCESO: "Tu solicitud está en proceso",
      EN_ESPERA: "Necesitamos información para tu solicitud",
      ENTREGADO: "Te entregamos la información de tu solicitud",
      COMPLETADO: "Tu solicitud quedó cerrada",
      CANCELADO: "Tu solicitud fue cancelada",
    }[t.estatus]} (${t.categoria})`;
    const mensaje = {
      NUEVO: "Ya recibimos tu solicitud. En breve alguien del equipo la va a tomar y te avisamos.",
      EN_PROCESO: "Ya estamos trabajando en tu solicitud. Te avisamos en cuanto esté lista.",
      EN_ESPERA: nota
        ? `Pusimos tu solicitud en espera porque necesitamos lo siguiente:\n${nota}\n\nEn cuanto nos lo compartas, la retomamos. Puedes responder a este correo.`
        : "Pusimos tu solicitud en espera porque necesitamos información adicional de tu parte. Responde a este correo y la retomamos.",
      ENTREGADO: "Ya te entregamos toda la información de tu solicitud. Revísala y, cuando termines tu proceso, confírmalo en la app (Mis solicitudes → Sí, ya terminé) para cerrarla. Si te falta algo, ahí mismo puedes pedirlo.",
      COMPLETADO: "Confirmaste que tu proceso quedó completo y la solicitud se cerró. ¡Gracias!",
      CANCELADO: "Cancelamos esta solicitud. Si todavía la necesitas, puedes levantar una nueva desde la app.",
    }[t.estatus];
    const comentario = nota && t.estatus !== "EN_ESPERA" ? nota : "";
    return { nombre, asunto, mensaje, comentario };
  }

  function correoAviso(t) {
    const p = partesCorreo(t);
    const lineas = [
      `Hola, ${p.nombre}:`,
      "",
      p.mensaje,
      ...(p.comentario ? ["", `Comentario de Inteligencia Comercial: ${p.comentario}`] : []),
      "",
      "Puedes ver el detalle y el historial en Tickets Inteligencia Comercial, en la pestaña Mis solicitudes.",
      "",
      "Saludos,",
      yo ? yo.nombre : "",
    ];
    // Outlook respeta mejor los saltos de línea como \r\n
    return `mailto:${t.solicitanteCorreo}?subject=${encodeURIComponent(p.asunto)}&body=${encodeURIComponent(lineas.join("\r\n"))}`;
  }

  // ---------------------------------------------------------------- tarjeta en imagen
  const cargarImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });

  /** Dibuja la tarjeta "Datos de tu solicitud" con los colores, logos y Otto de la app. */
  async function tarjetaCorreo(t) {
    try { await Promise.all(['30px "Luckiest Guy"', '700 20px "Roboto Condensed"', '400 16px "Roboto Condensed"'].map((f) => document.fonts.load(f))); } catch (e) { /* usa la de respaldo */ }
    // logos incrustados (js/marca-correo.js): así el canvas nunca queda "contaminado", ni abriendo desde el disco
    const M = window.MARCA_CORREO || {};
    const [logo, mune, otto] = await Promise.all([cargarImg(M.alvaco || "marca/alvaco.png"), cargarImg(M.munelocos || "marca/munelocos.png"), cargarImg(M.otto || "marca/otto.png")]);
    const W = 900, X = 40, GAP = 14;
    const F = (peso, tam) => `${peso} ${tam}px "Roboto Condensed", "Arial Narrow", Arial, sans-serif`;
    const TIT = (tam) => `${tam}px "Luckiest Guy", "Segoe UI Black", Impact, sans-serif`;
    const C = { azul: "#3F60A8", azulOsc: "#1F3864", lila: "#7B61C4", lilaOsc: "#4B2E83", tarjeta: "#F2F5FB", borde: "#D5DEF0", gris: "#595959", lilaFondo: "#F8F5FE" };
    const abierto = ABIERTOS.includes(t.estatus);
    const ultimo = t.movimientos[t.movimientos.length - 1];
    const fecha = (f) => new Date(f).toLocaleString("es-MX", { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
    const campos = [
      [["Folio", t.folio], ["Tipo", t.categoria]],
      [["Plaza y cadena", `${t.plaza} · ${t.cadena}`], ["Atiende", t.asignado || "Por asignar"]],
      [["Motivo", t.proposito, true]],
      [[abierto ? "Fecha compromiso" : "Fecha de cierre", abierto ? (t.venceEn ? fecha(t.venceEn) : "—") : fecha(ultimo.creadoEn)], ["Estatus", ESTATUS_TEXTO[t.estatus]]],
    ];

    // medir el motivo para saber cuántos renglones ocupa
    const medir = document.createElement("canvas").getContext("2d");
    const partir = (ctx, texto, ancho) => {
      const palabras = String(texto).split(/\s+/); const lin = []; let act = "";
      palabras.forEach((p) => { const prueba = act ? `${act} ${p}` : p; if (ctx.measureText(prueba).width > ancho && act) { lin.push(act); act = p; } else act = prueba; });
      if (act) lin.push(act);
      return lin;
    };
    medir.font = F(700, 20);
    const lineasMotivo = partir(medir, t.proposito, W - 2 * X - 32).slice(0, 3);
    const altoFila = (fila) => (fila[0][2] ? 52 + lineasMotivo.length * 26 : 72);
    const yCampos = 330;
    const H = yCampos + campos.reduce((a, f) => a + altoFila(f) + GAP, 0) + 70;

    const cv = document.createElement("canvas");
    const k = 2;
    cv.width = W * k; cv.height = H * k;
    const ctx = cv.getContext("2d");
    ctx.scale(k, k);
    const redondo = (x, y, w, h, r) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };

    // fondo blanco (la imagen se guarda en JPG, más ligera para el correo)
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, W, H);
    // tarjeta
    redondo(1, 1, W - 2, H - 2, 26); ctx.fillStyle = "#fff"; ctx.fill();
    ctx.save(); redondo(1, 1, W - 2, H - 2, 26); ctx.clip();
    // encabezado con degradado azul → morado
    const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, C.azul); g.addColorStop(1, C.lila);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, 118);
    ctx.fillStyle = "rgba(255,255,255,.08)";
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(520 + i * 70, 118, 46 + (i % 3) * 14, 0, Math.PI * 2); ctx.fill(); }
    // pie
    ctx.fillStyle = C.lilaFondo; ctx.fillRect(0, H - 52, W, 52);
    ctx.fillStyle = C.borde; ctx.fillRect(0, H - 52, W, 1.5);
    ctx.restore();
    redondo(1, 1, W - 2, H - 2, 26); ctx.strokeStyle = C.borde; ctx.lineWidth = 2; ctx.stroke();

    // logo ALVACO en círculo blanco
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(X + 38, 59, 40, 0, Math.PI * 2); ctx.fill();
    if (logo) ctx.drawImage(logo, X + 2, 23, 72, 72);
    ctx.fillStyle = "#fff"; ctx.font = F(700, 30); ctx.textBaseline = "alphabetic";
    ctx.fillText("Tickets Inteligencia Comercial", X + 96, 56);
    ctx.fillStyle = "rgba(255,255,255,.85)"; ctx.font = F(400, 18);
    ctx.fillText("Comercialización · ALVACO", X + 96, 84);
    // Muñelocos directo sobre el degradado (fondo transparente), con sombrita para que resalte
    if (mune) {
      ctx.save();
      ctx.shadowColor = "rgba(0,0,0,.28)"; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
      ctx.drawImage(mune, W - 238, 34, 198, 46);
      ctx.restore();
    }

    // Otto asomándose del lado derecho
    if (otto) {
      // la versión incrustada ya viene recortada; la original trae margen transparente
      const [sx, sy, sw, sh] = M.otto ? [0, 0, otto.naturalWidth, otto.naturalHeight] : [111, 16, 303, 517];
      const h = 228, w = (sw / sh) * h;
      ctx.drawImage(otto, sx, sy, sw, sh, W - w - 34, 104, w, h);
    }

    // título y estatus
    ctx.fillStyle = C.azul; ctx.font = TIT(32);
    ctx.fillText("DATOS DE TU SOLICITUD", X, 172);
    // el canvas no entiende var(--…): se resuelve al color real del tema
    const resolver = (c) => { const m = /^var\((--[\w-]+)\)$/.exec(String(c).trim()); return m ? (getComputedStyle(document.body).getPropertyValue(m[1]).trim() || C.azul) : c; };
    const colorEst = resolver(ESTATUS_COLOR[t.estatus]);
    ctx.font = F(700, 15);
    const txtEst = ESTATUS_TEXTO[t.estatus].toUpperCase();
    const anchoEst = ctx.measureText(txtEst).width + 44;
    redondo(X, 186, anchoEst, 32, 16); ctx.fillStyle = colorEst; ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(X + 17, 202, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText(txtEst, X + 30, 207.5);

    // avance: Recibida → En proceso → Resuelta
    const pasos = ["Recibida", t.estatus === "EN_ESPERA" ? "En espera" : "En proceso", "Entregada", t.estatus === "CANCELADO" ? "Cancelada" : "Completada"];
    const nivel = { NUEVO: 0, EN_PROCESO: 1, EN_ESPERA: 1, ENTREGADO: 2, COMPLETADO: 3, CANCELADO: 3 }[t.estatus];
    const x0 = X + 16, x1 = W - 250, yA = 270;
    ctx.lineWidth = 5; ctx.lineCap = "round";
    ctx.strokeStyle = C.borde; ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x1, yA); ctx.stroke();
    ctx.strokeStyle = colorEst; ctx.beginPath(); ctx.moveTo(x0, yA); ctx.lineTo(x0 + ((x1 - x0) * nivel) / (pasos.length - 1), yA); ctx.stroke();
    pasos.forEach((p, i) => {
      const cx = x0 + ((x1 - x0) * i) / (pasos.length - 1);
      const hecho = i <= nivel;
      ctx.beginPath(); ctx.arc(cx, yA, 15, 0, Math.PI * 2);
      ctx.fillStyle = hecho ? (i === nivel ? colorEst : C.azul) : "#fff"; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = hecho ? "#fff" : C.borde; ctx.stroke();
      ctx.fillStyle = hecho ? "#fff" : C.gris; ctx.font = F(700, 14); ctx.textAlign = "center";
      ctx.fillText(i < nivel || (i === nivel && t.estatus === "COMPLETADO") ? "✓" : String(i + 1), cx, yA + 5);
      ctx.fillStyle = i === nivel ? C.azulOsc : C.gris; ctx.font = F(i === nivel ? 700 : 400, 15);
      ctx.fillText(p, cx, yA + 38);
      ctx.textAlign = "left";
    });

    // campos en cajitas como en la app
    let y = yCampos;
    const anchoMedio = (W - 2 * X - GAP) / 2;
    campos.forEach((fila) => {
      const h = altoFila(fila);
      fila.forEach(([lab, val, ancho], j) => {
        const w = ancho ? W - 2 * X : anchoMedio;
        const x = X + (ancho ? 0 : j * (anchoMedio + GAP));
        redondo(x, y, w, h, 14); ctx.fillStyle = C.tarjeta; ctx.fill(); ctx.strokeStyle = C.borde; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = lab === "Estatus" ? colorEst : C.lila; ctx.fillRect(x, y + 14, 4, h - 28);
        ctx.fillStyle = C.gris; ctx.font = F(400, 14); ctx.fillText(lab, x + 18, y + 26);
        ctx.fillStyle = lab === "Estatus" ? colorEst : C.azulOsc; ctx.font = F(700, 20);
        if (ancho) lineasMotivo.forEach((l, n) => ctx.fillText(l, x + 18, y + 52 + n * 26));
        else {
          let v = String(val);
          while (ctx.measureText(v).width > w - 34 && v.length > 4) v = `${v.slice(0, -2)}…`;
          ctx.fillText(v.charAt(0).toUpperCase() + v.slice(1), x + 18, y + 54);
        }
      });
      y += h + GAP;
    });

    // pie
    ctx.fillStyle = C.gris; ctx.font = F(400, 14);
    ctx.fillText("Tickets Inteligencia Comercial · Consulta el historial en la pestaña Mis solicitudes", X, H - 21);
    ctx.fillStyle = C.lila; ctx.font = F(700, 14); ctx.textAlign = "right";
    ctx.fillText("Inteligencia Comercial · ALVACO", W - X, H - 21);
    ctx.textAlign = "left";
    return cv;
  }

  // ---------------------------------------------------------------- correo listo en Outlook (.eml)
  const b64Texto = (txt) => { const bytes = new TextEncoder().encode(txt); let bin = ""; bytes.forEach((x) => { bin += String.fromCharCode(x); }); return btoa(bin); };
  const en76 = (b64) => b64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
  const encabezado = (txt) => `=?UTF-8?B?${b64Texto(txt)}?=`;

  /** HTML del correo (estilos en línea para que Outlook lo respete). */
  function htmlCorreo(t, p) {
    const fuente = "font-family:'Segoe UI',Calibri,Arial,sans-serif;font-size:15px;line-height:1.5;color:#1F3864";
    const parrafo = (txt) => `<p style="margin:0 0 14px;${fuente}">${esc(txt).replace(/\n/g, "<br>")}</p>`;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0">
<div style="${fuente};max-width:640px">
${parrafo(`Hola, ${p.nombre}:`)}
${parrafo(p.mensaje)}
${p.comentario ? `<p style="margin:0 0 14px;${fuente}"><b>Comentario de Inteligencia Comercial:</b> ${esc(p.comentario)}</p>` : ""}
<p style="margin:6px 0 18px"><img src="cid:tarjeta-ic" width="600" alt="Datos de tu solicitud ${esc(t.folio)}" style="display:block;width:600px;max-width:100%;height:auto;border:0"></p>
${parrafo("Puedes ver el detalle y el historial en Tickets Inteligencia Comercial, en la pestaña Mis solicitudes.")}
<p style="margin:0;${fuente}">Saludos,<br>${esc(yo ? yo.nombre : "")}</p>
</div></body></html>`;
  }

  /** Borrador .eml (Outlook clásico): con "X-Unsent: 1" se abre listo para Enviar. */
  function descargarEml(t, p, png) {
    const limite = `----=_TicketsIC_${Date.now().toString(36)}`;
    const eml = [
      "X-Unsent: 1",
      `To: ${t.solicitanteCorreo}`,
      `Subject: ${encabezado(p.asunto)}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/related; boundary="${limite}"; type="text/html"`,
      "",
      `--${limite}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: base64",
      "",
      en76(b64Texto(htmlCorreo(t, p))),
      "",
      `--${limite}`,
      `Content-Type: image/jpeg; name="${t.folio}.jpg"`,
      "Content-Transfer-Encoding: base64",
      "Content-ID: <tarjeta-ic>",
      `Content-Disposition: inline; filename="${t.folio}.jpg"`,
      "",
      en76(png),
      "",
      `--${limite}--`,
      "",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([eml], { type: "message/rfc822" }));
    const a = document.createElement("a");
    a.href = url; a.download = `Correo ${t.folio}.eml`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  /** Abre una ventana de redacción de Outlook con destinatario y asunto. */
  function abrirRedaccion(t, p, cuerpo = "") {
    const a = document.createElement("a");
    a.href = `mailto:${t.solicitanteCorreo}?subject=${encodeURIComponent(p.asunto)}${cuerpo ? `&body=${encodeURIComponent(cuerpo)}` : ""}`;
    document.body.appendChild(a); a.click(); a.remove();
  }

  /** Guía breve con Otto mientras se termina el correo en Outlook. */
  function guiaPegar(nombre) {
    const viejo = $("#guia-pegar"); if (viejo) viejo.remove();
    const g = document.createElement("div");
    g.id = "guia-pegar";
    g.className = "guia-pegar";
    g.setAttribute("role", "status");
    g.innerHTML = `
      <img src="${IMG.otto}" alt="">
      <div>
        <b>¡Listo! El correo para ${esc(nombre)} ya está copiado</b>
        <ol>
          <li>En la ventana de Outlook que se abrió, haz clic en el <b>cuerpo del mensaje</b>.</li>
          <li>Presiona <kbd>Ctrl</kbd> + <kbd>V</kbd>: se pega el saludo, la tarjeta y la firma.</li>
          <li>Revisa y presiona <b>Enviar</b>.</li>
        </ol>
      </div>
      <button type="button" aria-label="Cerrar">×</button>`;
    document.body.appendChild(g);
    const cerrar = () => { g.classList.add("sale"); setTimeout(() => g.remove(), 300); };
    g.querySelector("button").addEventListener("click", cerrar);
    setTimeout(cerrar, 20000);
  }

  /**
   * Botón "Correo": genera la tarjeta y deja el correo armado.
   * Modo "pegar" (nuevo Outlook / web): copia el mensaje completo con la imagen
   * y abre la redacción; con un Ctrl + V queda listo.
   * Modo "eml" (Outlook clásico): descarga un borrador que se abre listo para Enviar.
   */
  async function abrirCorreo(t, boton) {
    const original = boton ? boton.innerHTML : "";
    if (boton) { boton.disabled = true; boton.innerHTML = "Preparando…"; }
    const p = partesCorreo(t);
    const modo = (window.IC_CONFIG && window.IC_CONFIG.CORREO) || "pegar";
    // la tarjeta se genera una sola vez y se comparte entre las dos versiones
    const tarjeta = tarjetaCorreo(t).then((cv) => cv.toDataURL("image/jpeg", 0.9));
    try {
      if (modo === "eml") {
        descargarEml(t, p, (await tarjeta).split(",")[1]);
        avisar("Correo listo para Outlook", "Abre el archivo descargado: solo revisa y presiona Enviar");
        return;
      }
      // El portapapeles se pide en el mismo clic (con promesas) para que el navegador lo permita
      const html = tarjeta.then((url) => new Blob([htmlCorreo(t, p).replace("cid:tarjeta-ic", url)], { type: "text/html" }));
      const texto = Promise.resolve(new Blob([correoTextoPlano(t, p)], { type: "text/plain" }));
      await navigator.clipboard.write([new ClipboardItem({ "text/html": html, "text/plain": texto })]);
      abrirRedaccion(t, p);
      guiaPegar(p.nombre);
    } catch (e) {
      // sin permiso de portapapeles: se baja el borrador y se abre Outlook con el texto
      try { descargarEml(t, p, (await tarjeta).split(",")[1]); } catch (e2) { /* sin imagen */ }
      abrirRedaccion(t, p, correoTextoPlano(t, p));
      avisar("Abrimos Outlook con el texto", "La tarjeta se descargó como borrador .eml por si la quieres agregar");
    } finally {
      if (boton) { boton.disabled = false; boton.innerHTML = original; }
    }
  }

  function correoTextoPlano(t, p) {
    return [
      `Hola, ${p.nombre}:`, "", p.mensaje,
      ...(p.comentario ? ["", `Comentario de Inteligencia Comercial: ${p.comentario}`] : []),
      "", "Puedes ver el detalle y el historial en Tickets Inteligencia Comercial, en la pestaña Mis solicitudes.",
      "", "Saludos,", yo ? yo.nombre : "",
    ].join("\r\n");
  }

  /** Avance visible para quien solicitó: Recibida → En proceso → Entregada → Completada. */
  function avanceTicket(t) {
    const pasos = [
      { id: "rec", txt: "Recibida" },
      { id: "pro", txt: t.estatus === "EN_ESPERA" ? "En espera" : "En proceso" },
      { id: "ent", txt: "Entregada" },
      { id: "fin", txt: t.estatus === "CANCELADO" ? "Cancelada" : "Completada" },
    ];
    const nivel = { NUEVO: 0, EN_PROCESO: 1, EN_ESPERA: 1, ENTREGADO: 2, COMPLETADO: 3, CANCELADO: 3 }[t.estatus];
    return `
      <div class="avance" data-estatus="${t.estatus}" style="--i:0">
        ${pasos.map((p, i) => `
          <div class="av-paso${i < nivel ? " hecho" : ""}${i === nivel ? " actual" : ""}">
            <span class="av-punto">${i < nivel || (i === nivel && t.estatus === "COMPLETADO") ? "✓" : i + 1}</span>
            <span class="av-txt">${p.txt}</span>
          </div>${i < pasos.length - 1 ? `<i class="av-linea${i < nivel ? " hecho" : ""}"></i>` : ""}`).join("")}
      </div>`;
  }

  function pintarDetalle() {
    const caja = $("#t-detalle");
    const sel = seleccionado();
    caja.classList.toggle("cargando", tablero.ocupado);

    if (!sel) {
      caja.innerHTML = `
        <div class="vacio-caja" style="padding:60px 20px">
          ${MAQUINA_ANIM}
          <p>Todavía no hay solicitudes. En cuanto llegue la primera aparece aquí.</p>
        </div>`;
      return;
    }

    const c = ESTATUS_COLOR[sel.estatus];
    const teniaFocoChat = document.activeElement && document.activeElement.id === "chat-txt";
    caja.innerHTML = `
      <div class="det-cima" style="--c:${c};--tc:${ESTATUS_TINTA[sel.estatus]}">
        <button class="volver" type="button" data-volver aria-label="Volver a la lista">‹ Lista</button>
        <div>
          <h2>${esc(sel.folio)}</h2>
          <p>${esc(sel.proposito)}</p>
        </div>
        <div class="acciones">
          ${esIC(yo) && sel.solicitanteCorreo ? `<button type="button" class="acc correo" data-accion="correo" title="Prepara el aviso con la tarjeta de la solicitud"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>Correo</button>` : ""}
          ${esIC(yo) && sel.estatus === "NUEVO" && !sel.asignadoId ? `<button class="acc tomar" type="button" data-accion="tomar"><img src="${IMG.garra}" alt="">Tomar</button>` : ""}
          ${esIC(yo) ? `<span class="pop-ancla">
            <button class="acc estatus" type="button" data-accion="abrir-estatus" aria-expanded="${tablero.pop === "estatus"}" style="--cc:${ESTATUS_COLOR[sel.estatus]}">
              <i class="punto"></i>${ESTATUS_TEXTO[sel.estatus]}<span class="flecha">▾</span>
            </button>
            ${tablero.pop === "estatus" ? `
            <div class="pop" role="dialog" aria-label="Cambiar estatus">
              <b class="pop-t">Mover a</b>
              <div class="pop-opciones">
                ${ESTATUS_ORDEN.filter((x) => x !== sel.estatus).map((x) => `
                  <button type="button" class="pop-op${tablero.popSel === x ? " sel" : ""}" data-accion="elegir" data-valor="${x}" style="--cc:${ESTATUS_COLOR[x]}"><i class="punto"></i>${ESTATUS_TEXTO[x]}</button>`).join("")}
              </div>
              <label class="nota-lb" for="t-nota">Nota para quien lo solicitó <span class="opc">(opcional)</span></label>
              <textarea class="nota-in" id="t-nota" maxlength="500" rows="2" placeholder="Ej. Ya tengo el margen, te lo mando mañana."></textarea>
              <div class="pop-acc"><button type="button" class="pop-no" data-accion="cerrar-pop">Cancelar</button><button type="button" class="pop-si" id="pop-confirmar" data-accion="confirmar" disabled>Elige un estatus</button></div>
            </div>` : ""}
          </span>` : ""}
        </div>
      </div>

      ${esIC(yo) ? (() => {
        const tb = tiempoBoleto(sel);
        const otros = tablero.equipo.filter((m) => m.id !== sel.asignadoId);
        return `
      <div class="det-resp">
        <span class="dr-cara${sel.asignado ? "" : " sin"}">${sel.asignado ? esc(iniciales(sel.asignado)) : "?"}</span>
        <span class="dr-txt"><small>Atiende</small><b>${sel.asignado ? esc(sel.asignado) : "Sin asignar"}</b></span>
        <span class="pop-ancla">
          <button type="button" class="dr-btn" data-accion="abrir-reasignar" aria-expanded="${tablero.pop === "reasignar"}">${sel.asignado ? "Reasignar" : "Asignar"} ▾</button>
          ${tablero.pop === "reasignar" ? `
          <div class="pop izq" role="dialog" aria-label="Reasignar">
            <b class="pop-t">Pasar a</b>
            <div class="pop-opciones">
              ${otros.map((m) => `<button type="button" class="pop-op persona${tablero.popSel === m.id ? " sel" : ""}" data-accion="elegir" data-valor="${m.id}" data-nombre="${esc(m.nombre.split(" ")[0])}"><span class="eq-cara">${esc(iniciales(m.nombre))}</span>${esc(m.nombre)}${yo && m.id === yo.id ? " (tú)" : ""}</button>`).join("")}
            </div>
            <label class="nota-lb" for="t-nota">Nota <span class="opc">(opcional)</span></label>
            <textarea class="nota-in" id="t-nota" maxlength="500" rows="2" placeholder="Ej. Te lo paso porque es de tu plaza."></textarea>
            <div class="pop-acc"><button type="button" class="pop-no" data-accion="cerrar-pop">Cancelar</button><button type="button" class="pop-si" id="pop-confirmar" data-accion="confirmar" disabled>Elige a alguien</button></div>
          </div>` : ""}
        </span>
        <span class="dr-sla ${tb.cls}">
          <small>${ABIERTOS.includes(sel.estatus) && sel.venceEn ? `Responder antes de ${new Date(sel.venceEn).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}` : "Tiempo compromiso"}</small>
          <b>${tb.txt}</b>
          <i><em style="--p:${tb.p}"></em></i>
        </span>
      </div>`;
      })() : ""}

      <div class="det-tabs" role="tablist" aria-label="Vista del ticket">
        <button type="button" role="tab" data-accion="pestana" data-p="info" aria-selected="${tablero.pestana !== "chat"}">Información</button>
        <button type="button" role="tab" data-accion="pestana" data-p="chat" aria-selected="${tablero.pestana === "chat"}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>
          Chat con ${esc(esIC(yo) ? String(sel.solicitante).split(" ")[0] : "IC")}
          <span class="dt-n" id="dt-n"${tablero.noLeidos[sel.id] ? "" : " hidden"}>${tablero.noLeidos[sel.id] || 0}</span>
        </button>
      </div>

      ${tablero.pestana === "chat" ? `<div class="chat" id="chat" data-ticket="${esc(sel.id)}"></div>` : `
      <div class="secciones">
        ${!esIC(yo) && sel.estatus === "ENTREGADO" ? `
        <div class="confirma" style="--i:0">
          <span class="cf-ico">📦</span>
          <div class="cf-txt">
            <b>IC ya te entregó la información de esta solicitud</b>
            <small>Cuando termines tu proceso, confírmalo para cerrarla. Si te falta algo, pídelo y regresa a IC.</small>
            <textarea class="nota-in" id="cf-nota" rows="2" maxlength="500" placeholder="Comentario para IC (opcional). Si necesitas algo más, explícalo aquí."></textarea>
          </div>
          <div class="cf-btns">
            <button type="button" class="cf-si" data-accion="confirmar-cierre">✅ Sí, ya terminé · Cerrar</button>
            <button type="button" class="cf-no" data-accion="pedir-mas">↩ Necesito algo más</button>
          </div>
        </div>` : ""}
        <div class="mascota" style="--c:${c};--i:0">
          <img src="${ESTATUS_OSO[sel.estatus]}" alt="">
          <div>
            <b>${esc(textoEstado(sel))}</b>
            <small>${esc(detalleEstado(sel))}</small>
          </div>
        </div>

        ${esIC(yo) ? "" : avanceTicket(sel)}

        <div class="sec" style="--i:1">
          <h3><span class="cua" style="--c:var(--cielo)"></span>Información general</h3>
          <div class="campos">
            <div class="ca"><span>Plaza</span><b>${esc(sel.plaza)}</b></div>
            <div class="ca"><span>Cadena</span><b>${esc(sel.cadena)}</b></div>
            <div class="ca"><span>Fecha de solicitud</span><b>${esc(new Date(sel.creadoEn).toLocaleString("es-MX", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }))}</b></div>
            <div class="ca"><span>Solicitante</span><b>${esc(sel.solicitante)}</b></div>
          </div>
        </div>

        <div class="sec" style="--i:2">
          <h3><span class="cua" style="--c:var(--morado)"></span>Clasificación</h3>
          <div class="campos tres">
            <div class="ca"><span>Categoría</span><b>${esc(sel.categoria)}</b></div>
            <div class="ca"><span>Prioridad</span><b style="color:${PRIORIDAD_COLOR[sel.prioridad]}">${PRIORIDAD_TEXTO[sel.prioridad]}</b></div>
            <div class="ca"><span>Esquema de renta</span><b>${esc(sel.margenPara || "No aplica")}</b></div>
          </div>
          ${Object.keys(sel.detalles || {}).filter((k) => !DET_ESPECIALES.includes(k)).length ? `<div class="campos det-extra">${Object.entries(sel.detalles).filter(([k]) => !DET_ESPECIALES.includes(k)).map(([k, v]) => `
            <div class="ca"><span>${esc(etiquetaDetalle(sel.categoria, k))}</span><b>${esc(k === "vence" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }) : v)}</b></div>`).join("")}</div>` : ""}
        </div>

        ${sel.detalles && sel.detalles.renta ? `<div class="sec" style="--i:2">
          <h3><span class="cua" style="--c:var(--verde)"></span>Renta y equipos</h3>
          ${htmlRentaDetalle(sel.detalles.renta)}
        </div>` : ""}

        <div class="sec" style="--i:3">
          <h3><span class="cua" style="--c:var(--naranja)"></span>Detalle</h3>
          <div class="desc">${esc(sel.descripcion)}</div>
        </div>

        <div class="sec" style="--i:4">
          <h3><span class="cua" style="--c:var(--rosa)"></span>Qué ha pasado</h3>
          <div class="linea-t">
            ${sel.movimientos.map((m) => `
              <div class="hito" style="--c:${ESTATUS_COLOR[m.a]}">
                <i></i>
                <div>
                  <b>${esc(m.nota === "Solicitud creada" ? `Solicitud creada por ${m.autor}` : `Movido a ${ESTATUS_TEXTO[m.a].toLowerCase()} por ${m.autor}`)}</b>
                  ${m.nota && m.nota !== "Solicitud creada" ? `<q class="hito-nota">${esc(m.nota)}</q>` : ""}
                  <small>${esc(new Date(m.creadoEn).toLocaleString("es-MX"))}</small>
                </div>
              </div>`).join("")}
          </div>
        </div>

      </div>`}`;
    caja.classList.toggle("con-chat", tablero.pestana === "chat");
    if (tablero.pestana === "chat") pintarChat(sel, teniaFocoChat);

    // Animaciones: entrada si cambió el ticket, festejo del oso si cambió su estatus
    const previo = tablero.ultimoDetalle;
    if (!EF.quieto) {
      if (previo.id !== sel.id) {
        caja.classList.remove("entra"); void caja.offsetWidth; caja.classList.add("entra");
        clearTimeout(caja._fin); caja._fin = setTimeout(() => caja.classList.remove("entra"), 900);
      } else if (previo.estatus !== sel.estatus) {
        caja.classList.remove("entra");
        const masc = $(".mascota", caja); if (masc) masc.classList.add("cambia");
        const hitos = $$(".hito", caja);
        if (hitos.length) hitos[hitos.length - 1].classList.add("nuevo");
      }
    }
    tablero.ultimoDetalle = { id: sel.id, estatus: sel.estatus };
  }

  async function mover(nuevo, conGarra, opciones = {}) {
    const sel = seleccionado();
    if (!sel || sel.estatus === nuevo) return;
    // la nota se lee antes de volver a pintar el detalle
    const notaEl = $("#t-nota");
    const nota = notaEl ? notaEl.value.trim() : "";
    tablero.ocupado = true;
    tablero.selId = sel.id;
    const boleto = conGarra ? $(`#t-pila .boleto[data-id="${CSS.escape(sel.id)}"]`) : null;
    pintarDetalle();
    try {
      const [r] = await Promise.all([D.cambiarEstatus(sel.id, nuevo, nota, opciones), EF.garra(boleto)]);
      tablero.tickets = await D.tickets();
      const sub = D.modo === "demo"
        ? `Le llegó el aviso a ${sel.solicitante} (campana)`
        : r.avisado === false ? "Ya se había avisado este estatus" : `Le llegó el aviso a ${sel.solicitante}`;
      avisar(nuevo === "COMPLETADO" ? "¡Solicitud completada!" : "Estatus actualizado", sub);
    } catch (e) {
      avisar(opciones.tomar ? "No se pudo tomar" : "No se pudo mover", e.message);
      try { tablero.tickets = await D.tickets(); } catch (e2) { /* sin red */ }
    } finally {
      tablero.ocupado = false;
      pintarTodo();
    }
    const ahora = seleccionado();
    if (ahora && ahora.estatus === "COMPLETADO" && nuevo === "COMPLETADO") {
      const oso = $("#t-detalle .mascota img");
      if (oso) {
        const r = oso.getBoundingClientRect();
        setTimeout(() => EF.confeti(r.left + r.width / 2, r.top + r.height / 2, { cantidad: 70, escala: 0.8 }), 250);
      }
    }
  }

  async function recargar() {
    const b = $("#t-recargar");
    b.disabled = true;
    try {
      tablero.tickets = await D.tickets();
      pintarTodo();
    } catch (e) {
      avisar("No se pudo actualizar", e.message);
    } finally {
      b.disabled = false;
    }
  }

  // ---------------------------------------------------------------- arranque
  if (!D) {
    document.body.innerHTML = "<p style='padding:40px;font-family:sans-serif'>Falta cargar js/datos-demo.js o js/datos-supabase.js.</p>";
  } else {
    ruta();
  }
})();
