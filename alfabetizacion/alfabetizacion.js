/* Alfabetización en IA · interfaz de la página /alfabetizacion-ia
 * Scroll → cámara del mundo (mundo.js), textos cinéticos, tarjetas de vídeo,
 * cabecera con indicador deslizante y la «sala» donde se ven los dos vídeos
 * de cada sección. Todo el texto visible sale de categorias.json.
 */
(function () {
  "use strict";

  const VH_POR_SECCION = 125;
  const CLAVE = "ciberseguria:alfabetizacion-ia:v2";
  const VELOCIDADES = [1, 1.25, 1.5, 0.75];
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finoMq = window.matchMedia("(pointer: fine)");
  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
  const easeOut = (x) => 1 - Math.pow(1 - x, 3);
  const pad = (n) => (n < 10 ? "0" : "") + n;
  const mmss = (t) => { t = Math.max(0, Math.floor(t || 0)); return Math.floor(t / 60) + ":" + pad(t % 60); };
  const url = (ruta) => encodeURI(ruta);
  const reducido = () => mq.matches;

  /* ---------- estado ---------- */
  let DATA, N, UI;
  let tObjetivo = 0, tActual = 0, copiaIndice = -1, movil = false;
  let puntero = [0, 0], punteroObj = [0, 0], hover = -1, mundoVisible = true, corriendo = false;
  const canvas = $("lit-canvas"), seccionEl = $("mundo"), copy = $("lit-copy"), media = $("lit-media");
  const pasos = $("lit-steps"), thumb = document.querySelector(".lit-steps-thumb");
  const progresoBarra = document.querySelector(".scroll-progress"), estado = document.querySelector(".lit-status");

  /* ---------- progreso de visionado (solo en este navegador) ---------- */
  let memoria = {};
  try { memoria = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { memoria = {}; }
  memoria.videos = memoria.videos || {};
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(memoria)); } catch (e) { /* sin almacenamiento: no pasa nada */ } };
  const info = (num) => memoria.videos[num] || { t: 0, d: 0, visto: false };
  const fraccion = (num) => { const v = info(num); return v.visto ? 1 : v.d ? clamp(v.t / v.d, 0, 1) : 0; };

  /* =========================================================
   *  CONSTRUCCIÓN DESDE EL JSON
   * ========================================================= */
  function construir() {
    document.title = DATA.titulo + " | CibersegurIA";
    pasos.style.setProperty("--n", N);
    DATA.secciones.forEach((s, j) => {
      const a = document.createElement("a");
      a.className = "lit-step"; a.href = "#mundo"; a.style.setProperty("--acc", s.acento);
      const partes = s.seccion.split(" "), num = partes.pop();
      a.innerHTML = '<span><b></b></span><i><b></b></i><em class="lit-step-nombre"></em>';
      a.querySelector("span b").textContent = partes.join(" ") + " ";
      a.querySelector("span").appendChild(document.createTextNode(num));
      a.querySelector(".lit-step-nombre").textContent = s.nombre;
      if (s.videos) {
        const v = document.createElement("small"); v.className = "lit-step-vistos"; v.setAttribute("aria-hidden", "true");
        s.videos.forEach(() => v.appendChild(document.createElement("s")));
        a.appendChild(v);
      }
      a.setAttribute("aria-label", s.seccion + ": " + s.nombre);
      a.addEventListener("click", (e) => { e.preventDefault(); irA(j); });
      pasos.appendChild(a);
    });
    $("lit-total").textContent = pad(N);
    $("lit-cue").textContent = DATA.pista;
    $("lit-cta").querySelector("b").textContent = DATA.boton;

    // textos fijos de la sala
    $("sala-cerrar").querySelector(".sr-only").textContent = UI.cerrar;
    $("sala-cerrar").title = UI.cerrar + " (Esc)";
    $("player-grande").querySelector(".sr-only").textContent = UI.reproducir;
    $("b-cc").setAttribute("aria-label", UI.subtitulos);
    $("b-vel").setAttribute("aria-label", UI.velocidad);
    $("b-full").querySelector(".sr-only").textContent = UI.pantallaCompleta;
    $("sala-l-videos").textContent = UI.videos;
    $("sala-l-capitulos").textContent = UI.capitulos;
    $("sala-teclas").textContent = UI.teclas;
    $("fin-etiqueta").textContent = UI.siguiente;
    $("sala-prev").querySelector("span").textContent = "← " + UI.seccionAnterior;
    $("sala-next").querySelector("span").textContent = UI.seccionSiguiente + " →";
    construirIndice();
    actualizarVistos();
  }

  // Índice de la cabecera de la página: una fila por sección
  function construirIndice() {
    const total = DATA.secciones.reduce((n, s) => n + (s.videos ? s.videos.length : 0), 0);
    $("alfa-cuenta").textContent = pad(N) + " " + UI.secciones + " · " + pad(total) + " " + UI.videosCuenta;
    $("alfa-indice-total").textContent = pad(total) + " " + UI.disponibles;
    const ol = $("alfa-indice");
    DATA.secciones.forEach((s, j) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.style.setProperty("--acc", s.acento); b.style.setProperty("--acc-ink", tintaSobre(s.acento));
      b.innerHTML = "<span></span><strong></strong><em></em>";
      b.querySelector("span").textContent = s.seccion.split(" ").pop();
      b.querySelector("strong").textContent = s.nombre;
      (s.videos || []).forEach(() => b.querySelector("em").appendChild(document.createElement("s")));
      b.setAttribute("aria-label", s.seccion + ": " + s.nombre);
      b.addEventListener("click", () => irA(j));
      li.appendChild(b); ol.appendChild(li);
    });
  }

  // color de texto legible sobre un acento (amarillo → azul oscuro; azul o rojo → blanco)
  function tintaSobre(hex) {
    const c = hex.replace("#", ""), r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? "#052f70" : "#ffffff";
  }

  function partir(nombre) { return LitMundo.partirTitulo(nombre); }

  // Titular en letras sueltas: cada una sube con un pequeño retardo (CSS: --i, --n, --rv)
  function letras(el, texto) {
    el.textContent = "";
    let i = 0;
    const total = texto.replace(/\s/g, "").length;
    texto.split(" ").forEach((palabra, w) => {
      if (w) el.appendChild(document.createTextNode(" "));
      const span = document.createElement("span"); span.className = "w"; span.setAttribute("aria-hidden", "true");
      for (const c of palabra) {
        const ch = document.createElement("span"); ch.className = "ch"; ch.textContent = c;
        ch.style.setProperty("--i", i++); span.appendChild(ch);
      }
      el.appendChild(span);
    });
    el.style.setProperty("--n", total);
  }

  function tarjetaVideo(i, k) {
    const v = DATA.secciones[i].videos[k];
    const b = document.createElement("button");
    b.type = "button"; b.className = "vcard"; b.style.setProperty("--d", k);
    b.dataset.seccion = i; b.dataset.video = k;
    b.setAttribute("aria-label", UI.ver + " " + v.numero + ": " + v.titulo + " (" + mmss(v.duracion) + ")");
    b.innerHTML = '<span class="vcard-img"><img alt="" loading="lazy" decoding="async"><span class="vcard-num"></span><span class="vcard-dur"></span><span class="vcard-play"></span><span class="vcard-visto"></span><span class="vcard-prog"><b></b></span></span><span class="vcard-titulo"></span>';
    b.querySelector("img").src = v.portada;
    b.querySelector(".vcard-num").textContent = v.numero;
    b.querySelector(".vcard-dur").textContent = mmss(v.duracion);
    b.querySelector(".vcard-visto").textContent = "✓ " + UI.visto;
    b.querySelector(".vcard-titulo").textContent = v.titulo;
    pintarProgreso(b, v.numero);
    b.addEventListener("click", () => abrirSala(i, k, b.querySelector(".vcard-img")));
    return b;
  }

  function pintarProgreso(el, num) {
    el.style.setProperty("--p", fraccion(num).toFixed(3));
    el.classList.toggle("is-visto", !!info(num).visto);
  }

  function ponerCopia(i) {
    const s = DATA.secciones[i], t = partir(s.nombre);
    copy.style.setProperty("--acc", s.acento);
    $("lit-seccion").textContent = s.seccion;
    $("lit-count").textContent = "· " + pad(i + 1) + " / " + pad(N);
    copy.querySelector(".lit-title-pre").textContent = t.pre;
    const main = copy.querySelector(".lit-title-main");
    letras(main, t.main);
    $("lit-title").setAttribute("aria-label", s.nombre);
    $("lit-lead").textContent = s.subtitulo;

    media.textContent = "";
    if (s.videos && s.videos.length) {
      s.videos.forEach((_, k) => media.appendChild(tarjetaVideo(i, k)));
    } else {
      // Ágora: accesos a cada sección («elige por dónde empezar»)
      const ul = document.createElement("ul"); ul.className = "lit-chips";
      DATA.secciones.forEach((o, j) => {
        if (!j) return;
        const li = document.createElement("li"), b = document.createElement("button");
        b.type = "button"; b.className = "lit-chip"; b.style.setProperty("--d", j); b.style.setProperty("--acc", o.acento);
        b.innerHTML = "<b></b><span></span>";
        b.querySelector("b").textContent = o.seccion.split(" ").pop();
        b.style.setProperty("--acc-ink", tintaSobre(o.acento));
        b.querySelector("span").textContent = partir(o.nombre).main;
        b.setAttribute("aria-label", o.seccion + ": " + o.nombre);
        b.addEventListener("click", () => irA(j));
        li.appendChild(b); ul.appendChild(li);
      });
      media.appendChild(ul);
    }

    // el titular se reduce si no cabe en la columna
    main.style.removeProperty("--title-size");
    let size = parseFloat(getComputedStyle(main).fontSize);
    const ancho = main.parentElement.clientWidth;
    while (main.scrollWidth > ancho + 1 && size > 26) { size -= 2; main.style.setProperty("--title-size", size + "px"); }
    copiaIndice = i;
    moverIndicador(i);
  }

  function moverIndicador(i) {
    const el = pasos.children[i];
    if (!el) return;
    thumb.style.setProperty("--tx", el.offsetLeft + "px");
    thumb.style.setProperty("--tw", el.offsetWidth + "px");
  }

  function actualizarVistos() {
    DATA.secciones.forEach((s, j) => {
      if (!s.videos) return;
      const dots = pasos.children[j] && pasos.children[j].querySelectorAll(".lit-step-vistos s");
      s.videos.forEach((v, k) => dots && dots[k] && dots[k].classList.toggle("is-visto", !!info(v.numero).visto));
    });
    [...$("alfa-indice").children].forEach((li, j) => {
      const s = DATA.secciones[j];
      li.querySelectorAll("em s").forEach((el, k) => el.classList.toggle("is-visto", !!info(s.videos[k].numero).visto));
    });
    media.querySelectorAll(".vcard").forEach((b) => pintarProgreso(b, DATA.secciones[+b.dataset.seccion].videos[+b.dataset.video].numero));
  }

  /* =========================================================
   *  SCROLL Y BUCLE DE DIBUJO
   * ========================================================= */
  function medir() {
    movil = window.innerWidth < 900;
    seccionEl.style.height = "calc(" + N * VH_POR_SECCION + "vh + 100vh)";
    LitMundo.medir(movil, reducido());
  }
  function distancia() { return Math.max(1, seccionEl.offsetHeight - window.innerHeight); }
  function leerScroll() {
    const p = clamp((window.scrollY - seccionEl.offsetTop) / distancia(), 0, 1);
    tObjetivo = Math.min(p * N, N - 1e-6);
    const total = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progresoBarra.style.setProperty("--scroll-progress", clamp(window.scrollY / total, 0, 1).toFixed(4));
  }
  function posicion(j) { return seccionEl.offsetTop + (j + 0.35) / N * distancia(); }
  function irA(j) { window.scrollTo({ top: posicion(j), behavior: reducido() ? "auto" : "smooth" }); }

  function interfaz(cam, T) {
    const i = cam.i, u = cam.u, ultimo = i === N - 1;
    if (i !== copiaIndice) ponerCopia(i);
    let a, y, rv;
    if (reducido()) { a = ultimo && u > 0.6 ? 0 : 1; y = 0; rv = 1; }
    else {
      const ent = i === 0 ? 1 : easeOut(seg(u, 0.03, 0.18));
      const sal = easeOut(seg(u, ultimo ? 0.55 : 0.64, ultimo ? 0.66 : 0.74));
      a = ent * (1 - sal); y = (1 - ent) * 30 - sal * 30;
      rv = i === 0 && u < 0.05 ? 1 : seg(u, 0.03, 0.3);
      rv = rv * (1 - sal);
    }
    copy.style.setProperty("--copy-a", a.toFixed(3));
    copy.style.setProperty("--copy-y", y.toFixed(1) + "px");
    copy.style.setProperty("--rv", rv.toFixed(3));
    copy.querySelector(".lit-title-main").style.setProperty("--underline", seg(rv, 0.4, 1).toFixed(3));
    copy.dataset.hidden = a < 0.02 ? "true" : "false";

    [...pasos.children].forEach((el, j) => {
      const lleno = reducido() ? (j <= i ? 1 : 0) : clamp((T - j) / 0.6, 0, 1);
      el.style.setProperty("--fill", lleno.toFixed(3));
      el.classList.toggle("is-active", j === i);
      el.classList.toggle("is-done", lleno >= 1);
      if (j === i) el.setAttribute("aria-current", "step"); else el.removeAttribute("aria-current");
    });
    $("lit-current").textContent = pad(i + 1);
    estado.style.setProperty("--p", (T / N).toFixed(4));
    estado.style.setProperty("--cue", (1 - seg(T, 0.02, 0.12)).toFixed(3));
  }

  function tick(ahora) {
    const d = tObjetivo - tActual;
    tActual = reducido() || Math.abs(d) < 1e-4 ? tObjetivo : tActual + d * 0.12;
    puntero[0] += (punteroObj[0] - puntero[0]) * 0.08;
    puntero[1] += (punteroObj[1] - puntero[1]) * 0.08;
    const cam = LitMundo.dibujar(tActual, { puntero: puntero, hover: hover, reloj: ahora });
    interfaz(cam, tActual);
    const sigue = !sala.abierta && mundoVisible && (!reducido() || Math.abs(tObjetivo - tActual) > 1e-4 || LitMundo.animando());
    if (sigue) requestAnimationFrame(tick); else corriendo = false;
  }
  function pedir() { if (!corriendo) { corriendo = true; requestAnimationFrame(tick); } }

  /* puntero sobre el mundo: paralaje, islas que se elevan y clic para entrar */
  function eventosMundo() {
    canvas.addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      punteroObj = [((e.clientX - r.left) / r.width - 0.5) * 2, ((e.clientY - r.top) / r.height - 0.5) * 2];
      if (e.pointerType === "mouse") {
        hover = LitMundo.islaEn(e.clientX - r.left, e.clientY - r.top);
        canvas.classList.toggle("is-pointer", hover >= 0);
      }
      pedir();
    });
    canvas.addEventListener("pointerleave", () => { punteroObj = [0, 0]; hover = -1; canvas.classList.remove("is-pointer"); pedir(); });
    canvas.addEventListener("click", (e) => {
      const r = canvas.getBoundingClientRect();
      const j = LitMundo.islaEn(e.clientX - r.left, e.clientY - r.top);
      if (j < 0) return;
      const s = DATA.secciones[j];
      if (j === copiaIndice && s.videos) abrirSala(j, primerPendiente(j), { x: e.clientX, y: e.clientY });
      else irA(j);
    });
  }

  /* imán en botones marcados con data-magnetic */
  function iman() {
    document.addEventListener("pointermove", (e) => {
      if (!finoMq.matches || reducido()) return;
      document.querySelectorAll("[data-magnetic]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.hypot(dx, dy);
        const radio = Math.max(r.width, r.height) * 0.9;
        if (dist < radio) {
          el.classList.add("is-near");
          el.style.setProperty("--mx", (dx * 0.22).toFixed(1) + "px");
          el.style.setProperty("--my", (dy * 0.3).toFixed(1) + "px");
        } else if (el.classList.contains("is-near")) {
          el.classList.remove("is-near"); el.style.setProperty("--mx", "0px"); el.style.setProperty("--my", "0px");
        }
      });
    }, { passive: true });
  }

  function primerPendiente(i) {
    const vs = DATA.secciones[i].videos || [];
    const k = vs.findIndex((v) => !info(v.numero).visto);
    return k < 0 ? 0 : k;
  }

  /* =========================================================
   *  SALA DE PROYECCIÓN
   * ========================================================= */
  const dlg = $("sala"), video = $("video"), player = $("player");
  const sala = { abierta: false, i: 1, k: 0, fin: null, quieto: null, guardado: 0, raf: 0 };

  function rectDe(origen) {
    if (!origen) return null;
    if (origen.getBoundingClientRect) return origen.getBoundingClientRect();
    return { left: origen.x - 12, top: origen.y - 12, right: origen.x + 12, bottom: origen.y + 12 };
  }
  function recorte(r) {
    const W = window.innerWidth, H = window.innerHeight;
    if (!r) return "inset(48% 48% 48% 48% round 16px)";
    return "inset(" + Math.max(0, r.top) + "px " + Math.max(0, W - r.right) + "px " + Math.max(0, H - r.bottom) + "px " + Math.max(0, r.left) + "px round 14px)";
  }

  function abrirSala(i, k, origen) {
    if (sala.abierta) return;
    sala.abierta = true;
    pintarSeccion(i);
    cargarVideo(k, { reproducir: true });
    // se bloquea el scroll de la página sin que el contenido salte
    document.documentElement.style.setProperty("--barra", (window.innerWidth - document.documentElement.clientWidth) + "px");
    document.documentElement.classList.add("sala-abierta");
    dlg.showModal();
    dlg.classList.remove("is-dentro");
    if (reducido()) { dlg.classList.add("is-dentro"); }
    else {
      dlg.animate([{ clipPath: recorte(rectDe(origen)) }, { clipPath: "inset(0px 0px 0px 0px round 0px)" }],
        { duration: 760, easing: "cubic-bezier(.76,0,.24,1)" });
      setTimeout(() => dlg.classList.add("is-dentro"), 240);
    }
    $("sala-cerrar").focus({ preventScroll: true });
  }

  function cerrarSala() {
    if (!sala.abierta) return;
    guardarProgreso(true);
    video.pause();
    clearTimeout(sala.fin && sala.fin.t); ocultarFin();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    // si se ha cambiado de sección dentro de la sala, el recorrido salta a esa isla
    if (sala.i !== copiaIndice) {
      window.scrollTo({ top: posicion(sala.i), behavior: "instant" });
      leerScroll(); tActual = tObjetivo;
      const cam = LitMundo.dibujar(tActual, { puntero: puntero, hover: -1, reloj: performance.now() });
      interfaz(cam, tActual);
    }
    actualizarVistos();
    const destino = media.querySelector('.vcard[data-video="' + sala.k + '"] .vcard-img');
    const terminar = () => {
      dlg.close(); dlg.classList.remove("is-dentro");
      document.documentElement.classList.remove("sala-abierta");
      sala.abierta = false;
      video.removeAttribute("src"); video.load();
      const foco = media.querySelector('.vcard[data-video="' + sala.k + '"]') || $("lit-cta");
      foco.focus({ preventScroll: true });
      pedir();
    };
    if (reducido()) { terminar(); return; }
    dlg.classList.remove("is-dentro");
    const anim = dlg.animate([{ clipPath: "inset(0px 0px 0px 0px round 0px)" }, { clipPath: recorte(rectDe(destino)) }],
      { duration: 620, easing: "cubic-bezier(.76,0,.24,1)", fill: "forwards" });
    anim.onfinish = () => { terminar(); anim.cancel(); };
  }

  function pintarSeccion(i) {
    sala.i = i;
    const s = DATA.secciones[i], t = partir(s.nombre);
    dlg.style.setProperty("--acc", s.acento);
    $("sala-seccion").textContent = s.seccion + " · " + pad(i + 1) + " / " + pad(N);
    const nom = $("sala-nombre");
    nom.querySelector(".lit-title-pre").textContent = t.pre;
    nom.querySelector(".sala-nombre-main").textContent = t.main;
    $("sala-sub").textContent = s.subtitulo;
    // el nombre se ajusta al ancho de la columna
    const nm = nom.querySelector(".sala-nombre-main");
    nom.style.removeProperty("--nombre-size");
    requestAnimationFrame(() => {
      let size = parseFloat(getComputedStyle(nom).fontSize);
      while (nm.scrollWidth > nom.clientWidth + 1 && size > 20) { size -= 2; nom.style.setProperty("--nombre-size", size + "px"); }
    });
    const lista = $("sala-videos"); lista.textContent = "";
    s.videos.forEach((v, k) => {
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "svid"; b.dataset.video = k;
      b.innerHTML = '<span class="svid-img"><img alt="" decoding="async"><span class="vcard-prog"><b></b></span></span><span><b></b><strong></strong><em></em></span>';
      b.querySelector("img").src = v.portada;
      b.querySelector("span > b").textContent = v.numero;
      b.querySelector("strong").textContent = v.titulo;
      b.querySelector("em").textContent = mmss(v.duracion) + (info(v.numero).visto ? " · ✓ " + UI.visto : "");
      b.style.setProperty("--p", fraccion(v.numero).toFixed(3));
      b.addEventListener("click", () => { if (k !== sala.k) cambiarVideo(k, true); });
      li.appendChild(b); lista.appendChild(li);
    });
    // saltos entre secciones (solo las que tienen vídeos)
    const prev = i - 1 >= 1 ? i - 1 : -1, next = i + 1 < N ? i + 1 : -1;
    const bp = $("sala-prev"), bn = $("sala-next");
    bp.hidden = prev < 0; bn.hidden = next < 0;
    if (prev >= 0) bp.querySelector("b").textContent = partir(DATA.secciones[prev].nombre).main;
    if (next >= 0) bn.querySelector("b").textContent = partir(DATA.secciones[next].nombre).main;
    bp.onclick = () => prev >= 0 && cambiarSeccion(prev);
    bn.onclick = () => next >= 0 && cambiarSeccion(next);
  }

  function transicion(clase, fn) {
    if (reducido()) { fn(); return; }
    dlg.classList.add(clase);
    setTimeout(() => { fn(); requestAnimationFrame(() => dlg.classList.remove(clase)); }, 260);
  }
  function cambiarSeccion(i) {
    guardarProgreso(true);
    transicion("is-cambio-seccion", () => { pintarSeccion(i); cargarVideo(primerPendiente(i), { reproducir: !video.paused }); });
  }
  function cambiarVideo(k, reproducir) {
    guardarProgreso(true);
    transicion("is-cambio", () => cargarVideo(k, { reproducir: reproducir }));
  }

  function cargarVideo(k, opc) {
    ocultarFin();
    sala.k = k;
    const v = DATA.secciones[sala.i].videos[k];
    sala.v = v;
    [...$("sala-videos").children].forEach((li, n) => li.firstChild.setAttribute("aria-current", n === k ? "true" : "false"));
    $("sala-num").textContent = v.numero;
    $("sala-titulo").textContent = v.titulo;

    // pista con un tramo por capítulo
    const tramos = $("pista-tramos"); tramos.textContent = "";
    const caps = v.capitulos && v.capitulos.length ? v.capitulos : [{ t: 0, titulo: "" }];
    caps.forEach((c, n) => {
      const fin = n + 1 < caps.length ? caps[n + 1].t : v.duracion;
      const el = document.createElement("span"); el.className = "tramo"; el.style.setProperty("--w", Math.max(0.5, fin - c.t));
      el.innerHTML = "<i></i><b></b>"; tramos.appendChild(el);
    });
    const lista = $("sala-capitulos"); lista.textContent = "";
    caps.forEach((c) => {
      if (!c.titulo) return;
      const li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; b.className = "cap"; b.innerHTML = "<span></span><b></b>";
      b.querySelector("span").textContent = mmss(c.t);
      b.querySelector("b").textContent = c.titulo;
      b.addEventListener("click", () => { video.currentTime = c.t + 0.05; video.play().catch(() => {}); });
      li.appendChild(b); lista.appendChild(li);
    });
    $("pista").setAttribute("aria-label", v.numero + " " + v.titulo);
    $("pista").setAttribute("aria-valuemax", v.duracion);

    // vídeo, portada y subtítulos
    [...video.querySelectorAll("track")].forEach((t) => t.remove());
    video.poster = v.portada;
    video.src = url(v.archivo);
    if (v.subtitulos) {
      const tr = document.createElement("track");
      tr.kind = "subtitles"; tr.srclang = "es"; tr.label = UI.subtitulos; tr.src = url(v.subtitulos);
      video.appendChild(tr);
      tr.track.mode = memoria.cc ? "showing" : "hidden";
    }
    $("b-cc").hidden = !v.subtitulos;
    $("b-cc").setAttribute("aria-pressed", memoria.cc ? "true" : "false");
    video.playbackRate = memoria.vel || 1;
    $("b-vel").textContent = (memoria.vel || 1) + "×";
    video.muted = !!memoria.mudo;
    player.classList.toggle("is-mudo", video.muted);
    $("b-mute").querySelector(".sr-only").textContent = video.muted ? UI.sonido : UI.silenciar;

    const previo = info(v.numero);
    video.addEventListener("loadedmetadata", function una() {
      video.removeEventListener("loadedmetadata", una);
      if (previo.t > 2 && !previo.visto && previo.t < video.duration - 5) video.currentTime = previo.t;
      video.playbackRate = memoria.vel || 1;
      pintarPlayer();
    });
    sala.capActual = -1;
    pintarPlayer();
    if (opc && opc.reproducir) video.play().catch(() => {});
  }

  /* ---------- estado del reproductor ---------- */
  function capituloEn(t) {
    const caps = sala.v.capitulos || [];
    let n = 0;
    for (let i = 0; i < caps.length; i++) if (t >= caps[i].t) n = i;
    return n;
  }
  function pintarPlayer() {
    if (!sala.v) return;
    const dur = video.duration || sala.v.duracion, t = video.currentTime || 0;
    $("tiempo").textContent = mmss(t) + " / " + mmss(dur);
    const pista = $("pista");
    pista.style.setProperty("--p", (t / dur).toFixed(4));
    pista.setAttribute("aria-valuenow", Math.round(t));
    pista.setAttribute("aria-valuetext", mmss(t) + " / " + mmss(dur));
    const caps = sala.v.capitulos && sala.v.capitulos.length ? sala.v.capitulos : [{ t: 0 }];
    let buf = 0;
    try { for (let i = 0; i < video.buffered.length; i++) if (video.buffered.start(i) <= t + 0.5) buf = Math.max(buf, video.buffered.end(i)); } catch (e) { /* sin datos */ }
    [...$("pista-tramos").children].forEach((el, n) => {
      const a = caps[n].t, b = n + 1 < caps.length ? caps[n + 1].t : dur;
      el.style.setProperty("--jug", seg(t, a, b).toFixed(4));
      el.style.setProperty("--buf", seg(buf, a, b).toFixed(4));
    });
    const n = capituloEn(t);
    const items = [...$("sala-capitulos").querySelectorAll(".cap")];
    if (items.length) {
      const a = caps[n].t, b = n + 1 < caps.length ? caps[n + 1].t : dur;
      items.forEach((el, m) => { el.setAttribute("aria-current", m === n ? "true" : "false"); if (m === n) el.style.setProperty("--cp", seg(t, a, b).toFixed(3)); });
    }
    if (n !== sala.capActual) {
      sala.capActual = n;
      const lab = $("player-capitulo");
      lab.textContent = caps[n].titulo || sala.v.numero;
      lab.classList.remove("is-cambio"); void lab.offsetWidth; lab.classList.add("is-cambio");
    }
    // la barra de progreso de la tarjeta lateral sigue al vídeo
    const actual = $("sala-videos").children[sala.k];
    if (actual && dur) actual.firstChild.style.setProperty("--p", Math.max(fraccion(sala.v.numero), t / dur).toFixed(3));
  }

  function bucleVideo() {
    pintarPlayer();
    if (!video.paused && !video.ended) sala.raf = requestAnimationFrame(bucleVideo);
  }

  function guardarProgreso(forzar) {
    if (!sala.v || !video.duration) return;
    const ahora = performance.now();
    if (!forzar && ahora - sala.guardado < 2000) return;
    sala.guardado = ahora;
    const prev = info(sala.v.numero);
    const t = video.currentTime, d = video.duration;
    memoria.videos[sala.v.numero] = { t: t, d: d, visto: prev.visto || t / d > 0.9 };
    guardar();
  }

  function siguienteDe(i, k) {
    const s = DATA.secciones[i];
    if (k + 1 < s.videos.length) return { i: i, k: k + 1 };
    for (let j = i + 1; j < N; j++) if (DATA.secciones[j].videos && DATA.secciones[j].videos.length) return { i: j, k: 0 };
    return null;
  }

  function mostrarFin() {
    const sig = siguienteDe(sala.i, sala.k);
    const capa = $("player-fin"), boton = $("fin-siguiente"), cancelar = $("fin-cancelar");
    capa.hidden = false;
    if (!sig) {
      boton.hidden = true; $("fin-etiqueta").hidden = true;
      cancelar.textContent = UI.volver; cancelar.onclick = cerrarSala; cancelar.focus();
      return;
    }
    const v = DATA.secciones[sig.i].videos[sig.k];
    boton.hidden = false; $("fin-etiqueta").hidden = false;
    $("fin-img").src = v.portada; $("fin-num").textContent = v.numero; $("fin-titulo").textContent = v.titulo;
    boton.setAttribute("aria-label", UI.siguiente + ": " + v.numero + " " + v.titulo);
    cancelar.textContent = UI.cancelar;
    const ir = () => {
      clearInterval(sala.fin && sala.fin.t);
      if (sig.i !== sala.i) transicion("is-cambio-seccion", () => { pintarSeccion(sig.i); cargarVideo(sig.k, { reproducir: true }); });
      else cambiarVideo(sig.k, true);
    };
    boton.onclick = ir;
    cancelar.onclick = () => { clearInterval(sala.fin && sala.fin.t); ocultarFin(); };
    boton.focus({ preventScroll: true });
    if (reducido()) return;   // sin cuenta atrás automática si se pide menos movimiento
    const total = 6000, inicio = performance.now(), anillo = $("fin-anillo");
    sala.fin = { t: setInterval(() => {
      const k = clamp((performance.now() - inicio) / total, 0, 1);
      anillo.style.setProperty("--off", (106.8 * (1 - k)).toFixed(1));
      if (k >= 1) ir();
    }, 50) };
  }
  function ocultarFin() {
    if (sala.fin) clearInterval(sala.fin.t);
    sala.fin = null;
    $("player-fin").hidden = true;
    $("fin-anillo").style.setProperty("--off", "106.8");
  }

  function alternar() { if (video.paused || video.ended) video.play().catch(() => {}); else video.pause(); }
  function saltar(d) { video.currentTime = clamp((video.currentTime || 0) + d, 0, (video.duration || sala.v.duracion) - 0.1); pintarPlayer(); }
  function despertar() {
    player.classList.remove("is-quieto");
    clearTimeout(sala.quieto);
    sala.quieto = setTimeout(() => player.classList.add("is-quieto"), 2400);
  }
  function alternarCC() {
    const tr = video.textTracks[0]; if (!tr) return;
    memoria.cc = !memoria.cc; guardar();
    tr.mode = memoria.cc ? "showing" : "hidden";
    $("b-cc").setAttribute("aria-pressed", memoria.cc ? "true" : "false");
  }
  function alternarMudo() {
    video.muted = !video.muted; memoria.mudo = video.muted; guardar();
    player.classList.toggle("is-mudo", video.muted);
    $("b-mute").querySelector(".sr-only").textContent = video.muted ? UI.sonido : UI.silenciar;
  }
  function alternarCompleta() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (player.requestFullscreen) player.requestFullscreen().catch(() => {});
  }

  function eventosSala() {
    $("sala-cerrar").addEventListener("click", cerrarSala);
    dlg.addEventListener("cancel", (e) => { e.preventDefault(); if (document.fullscreenElement) return; cerrarSala(); });

    video.addEventListener("play", () => { player.dataset.estado = "play"; $("b-play").querySelector(".sr-only").textContent = UI.pausar; despertar(); cancelAnimationFrame(sala.raf); bucleVideo(); });
    video.addEventListener("pause", () => { player.dataset.estado = "pausa"; $("b-play").querySelector(".sr-only").textContent = UI.reproducir; player.classList.remove("is-quieto"); guardarProgreso(true); });
    video.addEventListener("timeupdate", () => { guardarProgreso(false); if (video.paused) pintarPlayer(); });
    video.addEventListener("progress", pintarPlayer);
    video.addEventListener("ended", () => {
      memoria.videos[sala.v.numero] = { t: video.duration, d: video.duration, visto: true }; guardar();
      pintarSeccionVistos(); mostrarFin();
    });
    video.addEventListener("click", alternar);
    video.addEventListener("dblclick", alternarCompleta);
    $("player-grande").addEventListener("click", () => video.play().catch(() => {}));
    $("b-play").addEventListener("click", alternar);
    $("b-mute").addEventListener("click", alternarMudo);
    $("b-cc").addEventListener("click", alternarCC);
    $("b-full").addEventListener("click", alternarCompleta);
    $("b-vel").addEventListener("click", () => {
      const n = (VELOCIDADES.indexOf(memoria.vel || 1) + 1) % VELOCIDADES.length;
      memoria.vel = VELOCIDADES[n]; guardar();
      video.playbackRate = memoria.vel; $("b-vel").textContent = memoria.vel + "×";
    });
    player.addEventListener("pointermove", despertar);
    player.addEventListener("pointerdown", despertar);

    // pista: arrastrar, tooltip con capítulo y teclado
    const pista = $("pista"), tip = $("pista-tip");
    const aTiempo = (x) => { const r = pista.getBoundingClientRect(); return clamp((x - r.left) / r.width, 0, 1) * (video.duration || sala.v.duracion); };
    let arrastrando = false;
    pista.addEventListener("pointerdown", (e) => { arrastrando = true; pista.setPointerCapture(e.pointerId); pista.classList.add("is-arrastre"); video.currentTime = aTiempo(e.clientX); pintarPlayer(); });
    pista.addEventListener("pointermove", (e) => {
      const t = aTiempo(e.clientX), r = pista.getBoundingClientRect(), n = capituloEn(t);
      if (arrastrando) { video.currentTime = t; pintarPlayer(); }
      tip.hidden = false;
      tip.style.setProperty("--x", clamp(e.clientX - r.left, 70, r.width - 70) + "px");
      tip.querySelector("b").textContent = (sala.v.capitulos[n] || {}).titulo || sala.v.numero;
      tip.querySelector("em").textContent = mmss(t);
      [...$("pista-tramos").children].forEach((el, m) => el.classList.toggle("is-hover", m === n));
    });
    const soltar = () => { arrastrando = false; pista.classList.remove("is-arrastre"); };
    pista.addEventListener("pointerup", soltar);
    pista.addEventListener("pointercancel", soltar);
    pista.addEventListener("pointerleave", () => { tip.hidden = true; [...$("pista-tramos").children].forEach((el) => el.classList.remove("is-hover")); });
    pista.addEventListener("keydown", (e) => {
      const mapa = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -10, ArrowUp: 10, PageDown: -30, PageUp: 30 };
      if (e.key in mapa) { e.preventDefault(); e.stopPropagation(); saltar(mapa[e.key]); }
      else if (e.key === "Home") { e.preventDefault(); video.currentTime = 0; }
      else if (e.key === "End") { e.preventDefault(); video.currentTime = (video.duration || sala.v.duracion) - 0.5; }
    });

    // atajos de teclado dentro de la sala
    dlg.addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const enBoton = e.target.closest && e.target.closest("button");
      switch (e.key) {
        case " ": if (enBoton) return; e.preventDefault(); alternar(); break;
        case "k": case "K": alternar(); break;
        case "ArrowLeft": if (e.target === pista) return; e.preventDefault(); saltar(-5); break;
        case "ArrowRight": if (e.target === pista) return; e.preventDefault(); saltar(5); break;
        case "j": case "J": saltar(-10); break;
        case "l": case "L": saltar(10); break;
        case "m": case "M": alternarMudo(); break;
        case "c": case "C": alternarCC(); break;
        case "f": case "F": alternarCompleta(); break;
        default: return;
      }
      despertar();
    });
  }

  function pintarSeccionVistos() {
    [...$("sala-videos").children].forEach((li, k) => {
      const v = DATA.secciones[sala.i].videos[k], b = li.firstChild;
      b.style.setProperty("--p", fraccion(v.numero).toFixed(3));
      b.querySelector("em").textContent = mmss(v.duracion) + (info(v.numero).visto ? " · ✓ " + UI.visto : "");
    });
  }

  /* =========================================================
   *  ARRANQUE
   * ========================================================= */
  fetch("alfabetizacion/categorias.json", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then((json) => {
      DATA = json; N = DATA.secciones.length; UI = DATA.interfaz;
      construir();
      LitMundo.iniciar(DATA, canvas, { alCargar: pedir });
      medir(); leerScroll(); tActual = tObjetivo;
      eventosMundo(); eventosSala(); iman();
      $("lit-cta").addEventListener("click", () => {
        const i = copiaIndice, s = DATA.secciones[i];
        if (s && s.videos && s.videos.length) {
          const k = primerPendiente(i);
          abrirSala(i, k, media.querySelector('.vcard[data-video="' + k + '"] .vcard-img') || $("lit-cta"));
        } else irA(Math.min(i + 1, N - 1));
      });
      pedir();
      window.addEventListener("scroll", () => { leerScroll(); pedir(); }, { passive: true });
      window.addEventListener("resize", () => { medir(); leerScroll(); copiaIndice = -1; pedir(); });
      mq.addEventListener && mq.addEventListener("change", () => { medir(); copiaIndice = -1; pedir(); });
      if ("IntersectionObserver" in window) {
        new IntersectionObserver((e) => { mundoVisible = e[0].isIntersecting; if (mundoVisible) pedir(); }).observe(seccionEl);
      }
      window.addEventListener("pagehide", () => guardarProgreso(true));
      // enlaces directos a una sección: alfabetizacion-ia#seccion-3
      const ancla = /^#seccion-(\d+)$/.exec(location.hash);
      if (ancla && +ancla[1] < N) {
        requestAnimationFrame(() => { window.scrollTo({ top: posicion(+ancla[1]), behavior: "instant" }); leerScroll(); tActual = tObjetivo; pedir(); });
      }
      // Para pruebas: instante del recorrido (0 … nº de secciones) y apertura directa de la sala
      window.litRender = (T) => { tObjetivo = tActual = T; pedir(); };
      window.litSala = (i, k) => abrirSala(i, k || 0, null);
    })
    .catch(() => {
      const aviso = document.createElement("p");
      aviso.className = "lit-error"; aviso.setAttribute("role", "alert");
      aviso.textContent = "No se ha podido cargar el recorrido. Recarga la página.";
      document.body.appendChild(aviso);
    });
})();
