/*
 * Otto en el login.
 * La garra lo deja en la vitrina, saluda y señala el formulario.
 * Reacciona a lo que pasa: correo, contraseña (cierra los ojos),
 * error (niega con la cabeza), éxito (brinca) y si le das clic.
 *
 * Expone window.IC_OTTO con: iniciar(), detener(), error(texto), exito(nombre)
 */
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pausa = (ms) => new Promise((r) => setTimeout(r, quieto ? 0 : ms));

  const el = {};
  let turno = 0;            // invalida secuencias viejas si el login se reinicia
  let escribiendo = null;
  let parpadeo = null;
  let ocio = null;
  let listo = false;
  let ojosCerrados = false;

  const FRASES_TOQUE = [
    "¡Hola otra vez! Aquí sigo.",
    "Cuidado, que la garra anda cerca.",
    "Si no tienes cuenta, pídela a IC.",
    "¿Ya llenaste tus datos? Te espero.",
    "Me gusta este lugar, pero prefiero la vitrina de una tienda.",
  ];

  function tomar() {
    el.escena = $("#vista-login");
    el.otto = $("#otto");
    el.sacude = $("#otto-sacude");
    el.giro = $("#otto-giro");
    el.mano = $("#otto-mano");
    el.ojos = $("#otto-ojos");
    el.sombra = $("#otto-sombra");
    el.grua = $("#grua");
    el.globo = $("#globo");
    el.txt = $("#globo-txt");
    el.caja = $("#login-caja");
    el.correo = $("#correo");
    el.pass = $("#password");
    el.toque = $("#otto-toque");
    el.joystick = $("#maq-joystick");
    el.garrita = $("#maq-garrita");
    el.garritaCuerpo = $("#garrita-cuerpo");
    el.boton = $("#btn-entrar");
    el.vitrina = document.querySelector(".vitrina");
  }

  // ------------------------------------------------------------ globo
  let terminarAnterior = null;
  function decir(texto, { senala = false } = {}) {
    clearInterval(escribiendo);
    // si Otto estaba a media frase, esa frase se da por terminada (si no, quien la esperaba se quedaría atorado)
    if (terminarAnterior) { terminarAnterior(); terminarAnterior = null; }
    el.globo.classList.add("visible");
    el.globo.classList.toggle("senala", senala);
    if (quieto) { el.txt.textContent = texto; return Promise.resolve(); }
    el.globo.classList.remove("visible");
    void el.globo.offsetWidth;
    el.globo.classList.add("visible");
    el.txt.textContent = "";
    let i = 0;
    return new Promise((fin) => {
      terminarAnterior = fin;
      escribiendo = setInterval(() => {
        i += 1;
        el.txt.textContent = texto.slice(0, i);
        if (i >= texto.length) { clearInterval(escribiendo); terminarAnterior = null; fin(); }
      }, 28);
    });
  }

  // ------------------------------------------------------------ gestos
  function saludar() {
    el.mano.classList.remove("saluda");
    void el.mano.offsetWidth;
    el.mano.classList.add("saluda");
  }

  function pose(nombre) {
    el.giro.classList.remove("apunta", "voltea");
    if (nombre) el.giro.classList.add(nombre);
  }

  function ojos(cerrados) {
    ojosCerrados = cerrados;
    el.ojos.classList.toggle("cerrados", cerrados);
  }

  function parpadear() {
    clearTimeout(parpadeo);
    parpadeo = setTimeout(() => {
      if (!ojosCerrados && listo) {
        el.ojos.classList.add("cerrados");
        setTimeout(() => { if (!ojosCerrados) el.ojos.classList.remove("cerrados"); }, 140);
      }
      parpadear();
    }, 2600 + Math.random() * 3200);
  }

  function llamarCaja() {
    el.caja.classList.remove("llama");
    void el.caja.offsetWidth;
    el.caja.classList.add("llama");
  }

  function reiniciarOcio() {
    clearTimeout(ocio);
    ocio = setTimeout(async () => {
      if (!listo || document.activeElement === el.pass) return;
      saludar();
      await decir("¿Sigues ahí? Aquí te espero.", { senala: true });
      llamarCaja();
    }, 18000);
  }

  // ------------------------------------------------------------ confeti al aterrizar
  function confeti() {
    if (quieto || !window.IC_EFECTOS || el.escena.hidden) return;
    const o = el.otto.getBoundingClientRect();
    window.IC_EFECTOS.confeti(o.left + o.width / 2, o.bottom - o.height * 0.1, {
      cantidad: 80, escala: Math.max(0.6, o.width / 330),
    });
  }

  // ------------------------------------------------------------ entrada con la garra
  async function entrada(miTurno) {
    const animar = (nodo, cuadros, opciones) =>
      quieto ? null : nodo.animate(cuadros, { fill: "forwards", ...opciones });

    el.globo.classList.remove("visible", "senala");
    pose(null);
    ojos(false);
    el.grua.classList.remove("abierta");

    if (quieto) {
      el.otto.style.transform = "translateY(0)";
      el.grua.style.transform = "translateY(-120%)";
      el.sombra.style.transform = "scale(1)";
      el.sombra.style.opacity = "1";
    } else {
      el.otto.getAnimations().forEach((a) => a.cancel());
      el.grua.getAnimations().forEach((a) => a.cancel());
      el.sombra.getAnimations().forEach((a) => a.cancel());

      // La garra baja con Otto agarrado
      animar(el.grua, [{ transform: "translateY(-72%)" }, { transform: "translateY(-15%)" }], { duration: 950, easing: "cubic-bezier(.3,.1,.3,1)" });
      animar(el.otto, [{ transform: "translateY(-100%)" }, { transform: "translateY(-21%)" }], { duration: 950, easing: "cubic-bezier(.3,.1,.3,1)" });
      animar(el.sombra, [{ transform: "scale(.4)", opacity: .3 }, { transform: "scale(.7)", opacity: .6 }], { duration: 950 });
      await pausa(1050);
      if (miTurno !== turno) return;

      // Abre la garra y Otto cae
      el.grua.classList.add("abierta");
      await pausa(220);
      animar(el.otto, [
        { transform: "translateY(-21%)", easing: "cubic-bezier(.5,0,1,1)" },
        { transform: "translateY(0)", offset: .55, easing: "cubic-bezier(0,0,.3,1)" },
        { transform: "translateY(-5%)", offset: .75, easing: "cubic-bezier(.5,0,1,1)" },
        { transform: "translateY(0)" },
      ], { duration: 620 });
      animar(el.sombra, [{ transform: "scale(.7)", opacity: .6 }, { transform: "scale(1)", opacity: 1 }], { duration: 340 });
      setTimeout(confeti, 330);
      await pausa(380);
      if (miTurno !== turno) return;

      // La garra se va
      animar(el.grua, [{ transform: "translateY(-15%)" }, { transform: "translateY(-120%)" }], { duration: 900, easing: "cubic-bezier(.5,0,.7,.4)" });
      setTimeout(() => el.grua.classList.remove("abierta"), 500);
      await pausa(260);
    }
    if (miTurno !== turno) return;

    listo = true;
    saludar();
    parpadear();
    await decir("¡Hola! Soy Otto.");
    await pausa(1100);
    if (miTurno !== turno) return;

    pose("apunta");
    await decir("Mira, aquí ingresa tus datos para entrar", { senala: true });
    llamarCaja();
    await pausa(1600);
    if (miTurno === turno && document.activeElement !== el.pass) pose(null);
    reiniciarOcio();
  }

  // ------------------------------------------------------------ reacciones
  function alEscribirCorreo() {
    if (!listo) return;
    reiniciarOcio();
    const v = el.correo.value.trim().toLowerCase();
    if (/^[^\s@]+@alvaco\.com\.mx$/.test(v)) {
      if (el.txt.dataset.ultimo !== "ok") {
        el.txt.dataset.ultimo = "ok";
        saludar();
        decir("¡Perfecto! Ahora tu contraseña.");
      }
    } else if (el.txt.dataset.ultimo !== "correo") {
      el.txt.dataset.ultimo = "correo";
      decir("Escribe tu correo de Alvaco.");
    }
  }

  function alEntrarPass() {
    if (!listo) return;
    reiniciarOcio();
    el.txt.dataset.ultimo = "pass";
    pose("voltea");
    ojos(true);
    decir("No te preocupes, no estoy viendo tu contraseña.");
  }

  function alSalirPass() {
    pose(null);
    ojos(false);
  }

  function alMoverRaton(e) {
    if (quieto || !listo) return;
    const r = el.otto.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
    el.giro.style.setProperty("--raton", `${Math.max(-1, Math.min(1, dx * 2)) * 4}deg`);
  }

  async function alTocar() {
    if (!listo) return;
    reiniciarOcio();
    saludar();
    if (!quieto) {
      el.sacude.animate(
        [{ transform: "translateY(0)" }, { transform: "translateY(-6%)" }, { transform: "translateY(0)" }],
        { duration: 420, easing: "cubic-bezier(.3,1.5,.5,1)" },
      );
    }
    let f;
    do { f = FRASES_TOQUE[Math.floor(Math.random() * FRASES_TOQUE.length)]; } while (f === el.txt.textContent && FRASES_TOQUE.length > 1);
    el.txt.dataset.ultimo = "";
    decir(f);
  }

  // ------------------------------------------------------------ API
  let conectado = false;
  function conectar() {
    if (conectado) return;
    conectado = true;
    el.correo.addEventListener("input", alEscribirCorreo);
    el.correo.addEventListener("focus", alEscribirCorreo);
    el.pass.addEventListener("focus", alEntrarPass);
    el.pass.addEventListener("blur", alSalirPass);
    el.escena.addEventListener("pointermove", alMoverRaton);
    el.toque.addEventListener("click", alTocar);

    // La peluchera: la palanca mueve la garra y Entrar la hace bajar
    if (el.joystick && el.garrita) {
      let gx = 50;
      let dir = 0;
      let cuadro = null;
      let previo = 0;
      let inicio = 0;
      let presentada = false;

      const pintar = () => el.garrita.style.setProperty("--gx", gx.toFixed(2));
      const paso = (t) => {
        const dt = previo ? Math.min(48, t - previo) : 16;
        previo = t;
        gx = Math.max(8, Math.min(92, gx + dir * dt * 0.055));
        pintar();
        if (dir !== 0) cuadro = requestAnimationFrame(paso);
        else { cuadro = null; previo = 0; }
      };
      const mover = (d) => {
        dir = d;
        el.joystick.style.setProperty("--tilt", `${d * 24}deg`);
        el.joystick.classList.toggle("activa", d !== 0);
        el.garrita.classList.toggle("va-izq", d < 0);
        el.garrita.classList.toggle("va-der", d > 0);
        if (d !== 0 && !cuadro) cuadro = requestAnimationFrame(paso);
        if (d !== 0 && !presentada && listo) {
          presentada = true;
          decir("¡Eso! Con la palanca mueves la garra.");
        }
      };
      // Un toque corto igual mueve un poco la garra
      const soltar = () => {
        const resto = 240 - (performance.now() - inicio);
        if (resto > 0) setTimeout(() => mover(0), resto); else mover(0);
      };
      const lado = (e) => {
        const r = el.joystick.getBoundingClientRect();
        return e.clientX < r.left + r.width / 2 ? -1 : 1;
      };

      el.joystick.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        el.joystick.setPointerCapture(e.pointerId);
        inicio = performance.now();
        mover(lado(e));
      });
      el.joystick.addEventListener("pointermove", (e) => {
        if (dir !== 0 && el.joystick.hasPointerCapture(e.pointerId)) {
          const nuevo = lado(e);
          if (nuevo !== dir) mover(nuevo);
        }
      });
      el.joystick.addEventListener("pointerup", soltar);
      el.joystick.addEventListener("pointercancel", () => mover(0));
      el.joystick.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        e.preventDefault();
        const d = e.key === "ArrowLeft" ? -1 : 1;
        if (dir !== d) { inicio = performance.now(); mover(d); }
      });
      el.joystick.addEventListener("keyup", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") soltar();
      });
      el.joystick.addEventListener("click", (e) => e.preventDefault());
    }

    if (el.boton && el.garritaCuerpo) {
      el.boton.addEventListener("click", () => {
        if (quieto) return;
        el.garritaCuerpo.classList.remove("baja"); void el.garritaCuerpo.offsetWidth; el.garritaCuerpo.classList.add("baja");
      });
      el.garritaCuerpo.addEventListener("animationend", (e) => {
        if (e.animationName === "bajaGarra") el.garritaCuerpo.classList.remove("baja");
      });
    }
  }

  window.IC_OTTO = {
    iniciar() {
      tomar();
      if (!el.otto) return;
      conectar();
      turno += 1;
      listo = false;
      el.txt.dataset.ultimo = "";
      entrada(turno);
    },

    detener() {
      // el confeti de la entrada no sigue cayendo sobre el tablero
      document.querySelectorAll(".estallido-fijo").forEach((n) => n.remove());
      turno += 1;
      listo = false;
      clearTimeout(ocio);
      clearTimeout(parpadeo);
      clearInterval(escribiendo);
    },

    async error(texto) {
      if (!el.otto) return;
      reiniciarOcio();
      pose(null);
      ojos(false);
      if (!quieto) {
        el.sacude.animate(
          [{ transform: "rotate(0)" }, { transform: "rotate(-5deg)" }, { transform: "rotate(5deg)" },
           { transform: "rotate(-4deg)" }, { transform: "rotate(3deg)" }, { transform: "rotate(0)" }],
          { duration: 620, easing: "ease-in-out" },
        );
      }
      el.txt.dataset.ultimo = "";
      await decir(`Mmm… ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`);
    },

    async exito(nombre) {
      if (!el.otto) return;
      clearTimeout(ocio);
      pose(null);
      ojos(false);
      saludar();
      if (!quieto) {
        el.sacude.animate(
          [{ transform: "translateY(0)" }, { transform: "translateY(-14%)", offset: .4 },
           { transform: "translateY(0)", offset: .75 }, { transform: "translateY(-4%)", offset: .87 }, { transform: "translateY(0)" }],
          { duration: 700, easing: "ease-out" },
        );
      }
      const primero = String(nombre || "").split(" ")[0];
      await decir(primero ? `¡Qué gusto verte, ${primero}!` : "¡Qué gusto verte!");
      await pausa(650);
    },
  };
})();
