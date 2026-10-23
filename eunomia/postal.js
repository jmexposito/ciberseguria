/* eunomIA · postal de la polis en la portada
 * Vista general fija de la polis con su animación ambiental (paquetes, faro,
 * nubes). Solo se anima mientras está en pantalla y nunca con
 * prefers-reduced-motion.
 */
(() => {
  "use strict";
  const canvas = document.getElementById("eunomia-postal");
  if (!canvas || !window.EuMundo) return;
  const reduceQ = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false, raf = 0;
  EuMundo.iniciar(canvas, { modo: "postal" });
  const medir = () => EuMundo.medir(innerWidth < 900, reduceQ.matches);
  const pintar = (t) => {
    raf = 0;
    EuMundo.dibujar(0, { reloj: reduceQ.matches ? 0 : t });
    if (visible && !reduceQ.matches) raf = requestAnimationFrame(pintar);
  };
  const pedir = () => { if (!raf) raf = requestAnimationFrame(pintar); };
  medir(); pedir();
  addEventListener("resize", () => { medir(); pedir(); });
  reduceQ.addEventListener?.("change", () => { medir(); pedir(); });
  if ("IntersectionObserver" in window) new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) pedir(); }).observe(canvas);
})();
