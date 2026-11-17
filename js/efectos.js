/*
 * Efectos compartidos de la interfaz.
 *   IC_EFECTOS.confeti(x, y, opciones)  estallido de confeti en coordenadas de pantalla
 *   IC_EFECTOS.contar(elemento, de, a)  número que sube o baja animado
 *   IC_EFECTOS.garra(elemento)          la garra baja, agarra el elemento y lo levanta
 * Si la persona tiene "reducir movimiento" activado, nada se anima.
 */
(function () {
  "use strict";

  const quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const COLORES = ["#E5322D", "#FFC62E", "#29ABE2", "#2FA84F", "#F58220", "#EC008C", "#7B3FB5", "#FFFFFF"];
  const pausa = (ms) => new Promise((r) => setTimeout(r, ms));

  const SVG_GARRA = `
    <svg viewBox="0 0 120 460" width="120" height="460" aria-hidden="true">
      <line x1="60" y1="0" x2="60" y2="360" stroke="#C9D3E6" stroke-width="4"/>
      <line x1="60" y1="0" x2="60" y2="360" stroke="#0D1B3E" stroke-width="1" opacity=".35"/>
      <rect x="34" y="352" width="52" height="26" rx="6" fill="#C9D3E6" stroke="#0D1B3E" stroke-width="3"/>
      <circle cx="60" cy="365" r="5" fill="#E5322D"/>
      <g class="pinza izq"><path d="M40 376 C 18 392, 14 420, 30 446" fill="none" stroke="#0D1B3E" stroke-width="10" stroke-linecap="round"/><path d="M40 376 C 18 392, 14 420, 30 446" fill="none" stroke="#C9D3E6" stroke-width="6" stroke-linecap="round"/></g>
      <g class="pinza der"><path d="M80 376 C 102 392, 106 420, 90 446" fill="none" stroke="#0D1B3E" stroke-width="10" stroke-linecap="round"/><path d="M80 376 C 102 392, 106 420, 90 446" fill="none" stroke="#C9D3E6" stroke-width="6" stroke-linecap="round"/></g>
    </svg>`;

  function confeti(x, y, { cantidad = 70, escala = 1 } = {}) {
    if (quieto) return;
    const capa = document.createElement("div");
    capa.className = "estallido-fijo";
    capa.setAttribute("aria-hidden", "true");
    document.body.appendChild(capa);
    let restantes = 0;

    for (let i = 0; i < cantidad; i++) {
      const p = document.createElement("i");
      const ancho = 6 + Math.random() * 6;
      const redondo = Math.random() < 0.3;
      p.style.cssText =
        `left:${x - ancho / 2}px;top:${y}px;width:${ancho}px;height:${redondo ? ancho : ancho * 1.6}px;` +
        `background:${COLORES[i % COLORES.length]};border-radius:${redondo ? "50%" : "2px"}`;
      capa.appendChild(p);

      // Sale disparado hacia arriba en abanico y luego cae girando
      const ang = (-90 + (Math.random() * 2 - 1) * 75) * Math.PI / 180;
      const vel = (170 + Math.random() * 280) * escala;
      const dx = Math.cos(ang) * vel;
      const dy = Math.sin(ang) * vel;
      const giro = (Math.random() < 0.5 ? -1 : 1) * (360 + Math.random() * 540);
      restantes += 1;
      p.animate([
        { transform: "translate(0,0) rotate(0deg)", opacity: 1, easing: "cubic-bezier(.12,.75,.35,1)" },
        { transform: `translate(${dx}px,${dy}px) rotate(${giro * 0.4}deg)`, opacity: 1, offset: 0.38, easing: "cubic-bezier(.45,0,.9,.6)" },
        { transform: `translate(${dx * 1.35}px,${dy + 340 * escala}px) rotate(${giro}deg)`, opacity: 0 },
      ], { duration: 1500 + Math.random() * 900, delay: Math.random() * 120, fill: "both" })
        .onfinish = () => { restantes -= 1; if (restantes === 0) capa.remove(); };
    }
  }

  function contar(nodo, de, a, duracion = 700) {
    if (!nodo) return;
    if (quieto || de === a) { nodo.textContent = a; return; }
    const inicio = performance.now();
    const paso = (ahora) => {
      const t = Math.min(1, (ahora - inicio) / duracion);
      const suave = 1 - Math.pow(1 - t, 3);
      nodo.textContent = Math.round(de + (a - de) * suave);
      if (t < 1) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  }

  async function garra(objetivo) {
    if (quieto || !objetivo) return;
    const r = objetivo.getBoundingClientRect();
    if (r.bottom < 0 || r.top > window.innerHeight) return;

    // si la pantalla está escalada (hoja fija), la garra se escala igual
    const escala = objetivo.offsetWidth ? r.width / objetivo.offsetWidth : 1;
    const ancho = 84 * escala;
    const k = ancho / 120;
    const g = document.createElement("div");
    g.className = "garra-fija abierta";
    g.innerHTML = SVG_GARRA;
    g.style.width = `${ancho}px`;
    g.style.left = `${r.left + r.width / 2 - ancho / 2}px`;
    g.style.top = `${r.top + 10 - 378 * k}px`;
    document.body.appendChild(g);

    // Baja abierta
    await g.animate(
      [{ transform: "translateY(-170px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
      { duration: 460, easing: "cubic-bezier(.25,.8,.35,1)", fill: "forwards" },
    ).finished;

    // Cierra
    g.classList.remove("abierta");
    await pausa(200);

    // Levanta el boleto
    const sube = { duration: 380, easing: "cubic-bezier(.3,0,.3,1)", fill: "forwards" };
    g.animate([{ transform: "translateY(0)" }, { transform: "translateY(-14px)" }], sube);
    await objetivo.animate(
      [{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(-14px) rotate(-2.5deg)" }], sube,
    ).finished;
    await pausa(160);

    // Lo suelta y la garra se va
    g.classList.add("abierta");
    objetivo.animate(
      [
        { transform: "translateY(-14px) rotate(-2.5deg)", easing: "cubic-bezier(.5,0,1,1)" },
        { transform: "translateY(0) rotate(0)", offset: 0.6, easing: "cubic-bezier(0,0,.3,1)" },
        { transform: "translateY(-6px) rotate(.6deg)", offset: 0.8 },
        { transform: "translateY(0) rotate(0)" },
      ],
      { duration: 480 },
    );
    await g.animate(
      [{ transform: "translateY(-14px)", opacity: 1 }, { transform: "translateY(-200px)", opacity: 0 }],
      { duration: 520, delay: 120, easing: "cubic-bezier(.5,0,.7,.4)", fill: "forwards" },
    ).finished;
    g.remove();
  }

  /** La garra baja, agarra el elemento y se lo lleva hacia arriba como premio. */
  async function llevarse(objetivo) {
    if (quieto || !objetivo) return;
    const r = objetivo.getBoundingClientRect();
    const escala = objetivo.offsetWidth ? r.width / objetivo.offsetWidth : 1;
    const ancho = 110 * escala;
    const k = ancho / 120;
    const g = document.createElement("div");
    g.className = "garra-fija abierta";
    g.innerHTML = SVG_GARRA;
    g.style.width = `${ancho}px`;
    g.style.left = `${r.left + r.width / 2 - ancho / 2}px`;
    g.style.top = `${r.top + 34 * escala - 378 * k}px`;
    document.body.appendChild(g);
    await g.animate(
      [{ transform: "translateY(-220px)", opacity: 0 }, { transform: "translateY(0)", opacity: 1 }],
      { duration: 520, easing: "cubic-bezier(.25,.8,.35,1)", fill: "forwards" },
    ).finished;
    g.classList.remove("abierta");
    await pausa(240);
    // se balancea un poco y sube con el boleto
    const viaje = { duration: 900, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" };
    g.animate([{ transform: "translateY(0)" }, { transform: "translateY(-10px) rotate(-2deg)", offset: .25 }, { transform: "translateY(-900px)" }], viaje);
    await objetivo.animate(
      [{ transform: "translateY(0) rotate(0)" }, { transform: "translateY(-10px) rotate(-3deg)", offset: .25 }, { transform: "translateY(-900px) rotate(4deg)", opacity: .2 }],
      viaje,
    ).finished;
    g.remove();
  }

  window.IC_EFECTOS = { quieto, confeti, contar, garra, llevarse };
})();
