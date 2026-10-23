/* eunomIA · orquestación de la página
 * Conecta el scroll con el vuelo por la polis (EuMundo), muestra el texto de
 * cada parada y arranca las tres herramientas. Respeta prefers-reduced-motion:
 * sin vuelo, una vista fija de la polis y las paradas en lista.
 */
(() => {
  "use strict";
  const reduceQ = matchMedia("(prefers-reduced-motion: reduce)");
  const N = 4;   // paradas: 0 entrada, 1 balanza, 2 faro, 3 pliego, 4 final

  /* ---------- herramientas ---------- */
  window.EuBalanza && window.EuBalanza.iniciar();
  window.EuFaro && window.EuFaro.iniciar();
  window.EuPliego && window.EuPliego.iniciar();

  /* ---------- la polis ---------- */
  const seccion = document.getElementById("polis");
  const canvas = document.getElementById("eu-canvas");
  if (!seccion || !canvas || !window.EuMundo) return;

  const entrada = document.getElementById("eu-entrada");
  const paradas = [...seccion.querySelectorAll(".eu-parada")];
  const actualEl = document.getElementById("eu-actual"), progresoEl = document.getElementById("eu-progreso"), pistaEl = document.getElementById("eu-pista");
  const PISTAS = ["Desliza para recorrer la polis", "Balanza · clasificar", "Faro · avisar", "Pliego · contratar", "Elige herramienta"];

  let movil = false, reducido = reduceQ.matches, Tobj = 0, Tvis = 0, visible = true, hover = 0, raf = 0, ultimo = 0;
  EuMundo.iniciar(canvas);

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);

  function medir() {
    movil = innerWidth < 900;
    reducido = reduceQ.matches;
    document.documentElement.classList.toggle("eu-sin-vuelo", reducido);
    EuMundo.medir(movil, reducido);
  }
  function objetivo() {
    if (reducido) return 0;
    const r = seccion.getBoundingClientRect();
    const recorrido = seccion.offsetHeight - canvas.parentElement.offsetHeight;
    return clamp(-r.top / Math.max(recorrido, 1), 0, 1) * N;
  }
  function alfaParada(T, s) {
    if (s === N) return seg(T, N - .32, N - .12);
    return Math.min(seg(T, s - .28, s - .1), 1 - seg(T, s + .2, s + .3));
  }
  function textos(T) {
    if (reducido) return;
    const aE = 1 - seg(T, .1, .28);
    entrada.style.setProperty("--a", aE.toFixed(3));
    entrada.style.setProperty("--y", ((1 - aE) * -40).toFixed(1) + "px");
    entrada.toggleAttribute("data-oculto", aE < .02);
    paradas.forEach((p) => {
      const s = +p.dataset.parada, a = alfaParada(T, s);
      p.style.setProperty("--a", a.toFixed(3));
      p.style.setProperty("--y", ((1 - a) * 28).toFixed(1) + "px");
      p.toggleAttribute("data-oculto", a < .02);
    });
    const actual = Math.round(T);
    actualEl.textContent = String(actual).padStart(2, "0");
    progresoEl.style.transform = `scaleX(${(T / N).toFixed(4)})`;
    if (pistaEl.textContent !== PISTAS[actual]) pistaEl.textContent = PISTAS[actual];
  }

  function fotograma(ahora) {
    raf = 0;
    Tobj = objetivo();
    const d = Tobj - Tvis;
    Tvis = Math.abs(d) < .0005 ? Tobj : Tvis + d * .14;
    EuMundo.dibujar(Tvis, { reloj: reducido ? 0 : ahora, hover });
    textos(Tvis);
    if (visible && !reducido) raf = requestAnimationFrame(fotograma);
    ultimo = ahora;
  }
  function pedir() { if (!raf) raf = requestAnimationFrame(fotograma); }

  // solo animamos mientras la polis está en pantalla
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedir(); }, { rootMargin: "100px 0px" }).observe(seccion);
  }
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", () => { medir(); pedir(); });
  reduceQ.addEventListener?.("change", () => { medir(); Tvis = Tobj = objetivo(); pedir(); });

  // clic en un edificio desde la vista general: viaja a su parada
  function irA(s) {
    const recorrido = seccion.offsetHeight - canvas.parentElement.offsetHeight;
    const y = seccion.getBoundingClientRect().top + scrollY + recorrido * (s / N);
    scrollTo({ top: y, behavior: reducido ? "auto" : "smooth" });
  }
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const n = EuMundo.edificioEn(e.clientX - r.left, e.clientY - r.top);
    if (n !== hover) { hover = n; canvas.classList.toggle("is-puntero", !!n); pedir(); }
  });
  canvas.addEventListener("pointerleave", () => { hover = 0; canvas.classList.remove("is-puntero"); pedir(); });
  canvas.addEventListener("click", (e) => {
    const r = canvas.getBoundingClientRect();
    const n = EuMundo.edificioEn(e.clientX - r.left, e.clientY - r.top);
    if (!n) return;
    if (reducido) location.hash = ["", "#balanza", "#faro", "#pliego"][n];
    else irA(n);
  });

  medir();
  Tvis = Tobj = objetivo();
  pedir();
  if (reducido) fotograma(0);
})();
