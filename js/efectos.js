// Motor de efectos de celebración. No necesitas editar este archivo:
// las fechas se configuran en js/celebraciones.js
(function () {
  const ZONA = "America/Santiago";
  const lista = window.CELEBRACIONES || [];
  const DURACION = window.CELEBRACION_DURACION_MS || 5000;

  // Fecha de hoy en Chile como "AAAA-MM-DD" (según el reloj del dispositivo).
  // Para probar sin esperar la fecha: agrega ?fecha=AAAA-MM-DD a la dirección.
  function hoyEnChile() {
    const forzada = new URLSearchParams(location.search).get("fecha");
    if (/^\d{4}-\d{2}-\d{2}$/.test(forzada || "")) return forzada;
    const dos = (n) => String(n).padStart(2, "0");
    try {
      // formatToParts da año, mes y día por separado: no depende del formato de cada celular
      const p = {};
      for (const parte of new Intl.DateTimeFormat("en-US", { timeZone: ZONA, year: "numeric", month: "numeric", day: "numeric" }).formatToParts(new Date()))
        p[parte.type] = parte.value;
      return `${p.year}-${dos(p.month)}-${dos(p.day)}`;
    } catch (e) {
      const d = new Date(); // navegador sin soporte de zonas horarias: usa la fecha local
      return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
    }
  }

  const hoy = hoyEnChile();
  const evento = lista.find((e) => e.fecha === hoy || e.fecha === hoy.slice(5));
  if (!evento) return;

  const PALETA = ["#FF4D6D", "#7C5CFF", "#3CE5D2", "#FFD166", "#FF9F1C", "#F15BB5", "#FFFFFF"];
  const azar = (a, b) => a + Math.random() * (b - a);
  const color = () => PALETA[(Math.random() * PALETA.length) | 0];

  // ---------- Lienzo ----------
  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "99998", transition: "opacity 600ms ease" });
  const ctx = canvas.getContext("2d");
  let W = 0, H = 0, dpr = 1;
  function ajustar() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------- Partículas ----------
  const movil = window.innerWidth < 700;
  const piezas = [];

  function papelito(x, y) {
    return { tipo: "papel", x, y, vx: azar(-2.5, 2.5), vy: azar(-3, 1), w: azar(6, 11), h: azar(9, 16), rot: azar(0, 6.28), vr: azar(-0.2, 0.2), giro: azar(0, 6.28), vg: azar(0.08, 0.2), c: color() };
  }
  function serpentina(x, y) {
    return { tipo: "serp", x, y, vx: azar(-1.2, 1.2), vy: azar(1.5, 3), largo: azar(60, 120), amp: azar(5, 10), fase: azar(0, 6.28), vf: azar(0.08, 0.15), grosor: azar(2.5, 4), c: color() };
  }
  function figura(x, y, forma) {
    return { tipo: forma, x, y, vx: azar(-1, 1), vy: azar(1, 2.6), s: azar(10, 20), rot: azar(-0.4, 0.4), vr: azar(-0.03, 0.03), c: color() };
  }

  function emitir(n) {
    for (let i = 0; i < n; i++) {
      const x = azar(0, W), y = azar(-40, -10);
      if (evento.efecto === "corazones") piezas.push(figura(x, y, "corazon"));
      else if (evento.efecto === "estrellas") piezas.push(figura(x, y, "estrella"));
      else piezas.push(Math.random() < 0.18 ? serpentina(x, y - 80) : papelito(x, y));
    }
  }

  // Ráfagas laterales de "cañones" al inicio (solo confeti)
  function cañonazo() {
    const n = movil ? 45 : 90;
    for (let i = 0; i < n; i++) {
      for (const lado of [0, 1]) {
        const p = papelito(lado ? W + 10 : -10, H * 0.75);
        p.vx = (lado ? -1 : 1) * azar(4, 11);
        p.vy = azar(-15, -7);
        piezas.push(p);
      }
    }
  }

  function corazon(s) {
    ctx.beginPath();
    ctx.moveTo(0, s * 0.3);
    ctx.bezierCurveTo(-s, -s * 0.4, -s * 0.4, -s, 0, -s * 0.45);
    ctx.bezierCurveTo(s * 0.4, -s, s, -s * 0.4, 0, s * 0.3);
    ctx.fill();
  }
  function estrella(s) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? s * 0.42 : s, a = (i * Math.PI) / 5 - Math.PI / 2;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill();
  }

  function dibujar(p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = p.c; ctx.strokeStyle = p.c;
    if (p.tipo === "papel") {
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.giro)); // efecto de papel girando en el aire
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    } else if (p.tipo === "serp") {
      ctx.lineWidth = p.grosor; ctx.lineCap = "round";
      ctx.beginPath();
      for (let i = 0; i <= p.largo; i += 4) {
        const dx = Math.sin(p.fase + i * 0.12) * p.amp;
        i === 0 ? ctx.moveTo(dx, -i) : ctx.lineTo(dx, -i);
      }
      ctx.stroke();
    } else {
      ctx.rotate(p.rot);
      p.tipo === "corazon" ? corazon(p.s) : estrella(p.s);
    }
    ctx.restore();
  }

  // k = cuántos "cuadros de 60 fps" pasaron: la velocidad es igual en equipos lentos o rápidos
  function mover(p, k) {
    if (p.tipo === "papel") {
      p.vy = Math.min(p.vy + 0.18 * k, 3.4); p.vx *= Math.pow(0.985, k);
      p.x += (p.vx + Math.sin(p.giro) * 0.6) * k; p.y += p.vy * k;
      p.rot += p.vr * k; p.giro += p.vg * k;
    } else if (p.tipo === "serp") {
      p.x += p.vx * k; p.y += p.vy * k; p.fase += p.vf * k;
    } else {
      p.x += (p.vx + Math.sin(p.y * 0.02)) * k; p.y += p.vy * k; p.rot += p.vr * k;
    }
  }

  // ---------- Mensaje ----------
  function mostrarMensaje() {
    if (!evento.mensaje) return null;
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.textContent = evento.mensaje;
    Object.assign(el.style, {
      position: "fixed", top: "max(18px, env(safe-area-inset-top))", left: "50%",
      transform: "translate(-50%, -20px) scale(.92)", opacity: "0",
      padding: movil ? "12px 18px" : "14px 26px", borderRadius: "18px",
      background: "linear-gradient(135deg, #FF4D6D, #7C5CFF 60%, #3CE5D2)",
      color: "#fff", fontWeight: "850", fontSize: movil ? "17px" : "20px",
      letterSpacing: ".2px", textAlign: "center", width: "max-content", maxWidth: "calc(100vw - 32px)",
      boxShadow: "0 16px 50px rgba(124,92,255,.45), 0 10px 30px rgba(0,0,0,.35)",
      zIndex: "99999", pointerEvents: "none",
      transition: "opacity 450ms cubic-bezier(.2,.8,.2,1), transform 450ms cubic-bezier(.2,.8,.2,1)",
    });
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translate(-50%, 0) scale(1)"; });
    return el;
  }

  // ---------- Ciclo ----------
  function iniciar() {
    ajustar();
    document.body.appendChild(canvas);
    window.addEventListener("resize", ajustar);
    const mensaje = mostrarMensaje();
    if (evento.efecto === "confeti") cañonazo();

    const inicio = performance.now();
    const ritmo = movil ? 3 : 6;
    let fin = false, previo = inicio;

    function cuadro(t) {
      const pasado = t - inicio;
      const k = Math.min(Math.max((t - previo) / 16.67, 0), 3);
      previo = t;
      if (pasado < DURACION - 1200) emitir(Math.round(ritmo * k) || 1);      // deja de emitir antes del final
      if (!fin && pasado > DURACION - 600) {            // desvanece todo al llegar a los 5 s
        fin = true;
        canvas.style.opacity = "0";
        if (mensaje) { mensaje.style.opacity = "0"; mensaje.style.transform = "translate(-50%, -20px) scale(.92)"; }
      }
      if (pasado > DURACION) {
        canvas.remove(); mensaje && mensaje.remove();
        window.removeEventListener("resize", ajustar);
        return;
      }
      ctx.clearRect(0, 0, W, H);
      for (let i = piezas.length - 1; i >= 0; i--) {
        const p = piezas[i];
        mover(p, k); dibujar(p);
        if (p.y > H + 140 || p.x < -150 || p.x > W + 150) piezas.splice(i, 1);
      }
      requestAnimationFrame(cuadro);
    }
    requestAnimationFrame(cuadro);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
