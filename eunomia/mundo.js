/* eunomIA · la polis isométrica (Canvas 2D)
 * Motor de dibujo del recorrido: una isla con el ágora y tres edificios,
 * uno por herramienta (Balanza, Faro, Pliego). No sabe nada del scroll ni del
 * DOM: app.js le pide fotogramas con EuMundo.dibujar(T, extra), donde T va de
 * 0 (vista general) a 4 (vista final) pasando por las tres paradas.
 * Mismo lenguaje visual que el recorrido de Alfabetización (isométrica, papel,
 * azul, amarillo y rojo en dosis mínimas). Sin librerías.
 */
(function () {
  "use strict";

  var C30 = Math.cos(Math.PI / 6), K = 1.2247449, KY = 0.7071068;
  var C = { blue: "#064bae", blueDark: "#052f70", blueSoft: "#eaf2ff", ink: "#111820", muted: "#56616f", line: "#d8dee7", paper: "#f6f8fb", white: "#ffffff", red: "#ff1738", yellow: "#ffe500" };
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  var COND = '"Arial Narrow", "Roboto Condensed", Impact, sans-serif';
  var BORDE = "rgba(17,24,32,0.11)";
  var TONO_ARBOL, TONO_ROCA, TONO_CABEZA;

  var canvas, ctx, W = 0, H = 0, DPR = 1, movil = false, reducido = false, modo = "recorrido";
  var cajasHit = [];

  /* ---------- utilidades ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeBack(x) { var c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function hex(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mezcla(h, d, k) { return "rgb(" + hex(h).map(function (v) { return Math.round(v + (d - v) * k); }).join(",") + ")"; }
  function aclarar(h, k) { return mezcla(h, 255, k); }
  function oscurecer(h, k) { return mezcla(h, 0, k); }
  function aHex(rgb) { return "#" + rgb.match(/\d+/g).map(function (v) { v = Number(v); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function rgba(h, a) { var c = hex(h); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }
  function iso(x, y, z) { return [(x - y) * C30, (x + y) * .5 - z]; }

  TONO_ARBOL = aHex(aclarar(C.blue, .55)); TONO_ROCA = aHex(aclarar(C.line, .3)); TONO_CABEZA = aHex(aclarar(C.ink, .25));

  /* ---------- primitivas ---------- */
  function poligono(pts, relleno, trazo, ancho) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    if (relleno) { ctx.fillStyle = relleno; ctx.fill(); }
    if (trazo) { ctx.strokeStyle = trazo; ctx.lineWidth = ancho || 1.1; ctx.lineJoin = "round"; ctx.stroke(); }
  }
  function caja(S, x, y, z, w, d, h, col, trazo) {
    var t = trazo === undefined ? BORDE : trazo;
    poligono([S(x + w, y, z), S(x + w, y + d, z), S(x + w, y + d, z + h), S(x + w, y, z + h)], oscurecer(col, .2), t);
    poligono([S(x, y + d, z), S(x + w, y + d, z), S(x + w, y + d, z + h), S(x, y + d, z + h)], oscurecer(col, .08), t);
    poligono([S(x, y, z + h), S(x + w, y, z + h), S(x + w, y + d, z + h), S(x, y + d, z + h)], aclarar(col, .1), t);
  }
  function cilindro(S, esc, x, y, z, r, h, col, r1) {
    r1 = r1 == null ? r : r1;
    var b = S(x, y, z), tp = S(x, y, z + h);
    var rx0 = r * esc * K, ry0 = r * esc * KY, rx1 = r1 * esc * K, ry1 = r1 * esc * KY;
    var g = ctx.createLinearGradient(b[0] - rx0, 0, b[0] + rx0, 0);
    g.addColorStop(0, aclarar(col, .1)); g.addColorStop(.45, oscurecer(col, .02)); g.addColorStop(1, oscurecer(col, .25));
    ctx.beginPath(); ctx.ellipse(b[0], b[1], rx0, ry0, 0, 0, Math.PI, false);
    if (r1 > 0) ctx.ellipse(tp[0], tp[1], rx1, ry1, 0, Math.PI, 0, false); else ctx.lineTo(tp[0], tp[1]);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = BORDE; ctx.lineWidth = 1; ctx.stroke();
    if (r1 > 0) { ctx.beginPath(); ctx.ellipse(tp[0], tp[1], rx1, ry1, 0, 0, Math.PI * 2); ctx.fillStyle = aclarar(col, .16); ctx.fill(); ctx.stroke(); }
  }
  function disco(S, esc, x, y, z, r, col, trazo) {
    var c = S(x, y, z);
    ctx.beginPath(); ctx.ellipse(c[0], c[1], r * esc * K, r * esc * KY, 0, 0, Math.PI * 2);
    if (col) { ctx.fillStyle = col; ctx.fill(); }
    if (trazo) { ctx.strokeStyle = trazo; ctx.lineWidth = 1.2; ctx.stroke(); }
  }
  function esfera(S, esc, x, y, z, r, col) {
    var c = S(x, y, z), rr = r * esc * K;
    var g = ctx.createRadialGradient(c[0] - rr * .35, c[1] - rr * .4, rr * .1, c[0], c[1], rr);
    g.addColorStop(0, aclarar(col, .45)); g.addColorStop(1, oscurecer(col, .12));
    ctx.beginPath(); ctx.arc(c[0], c[1], rr, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  }
  function linea(S, a, b, col, ancho) {
    var p = S(a[0], a[1], a[2]), q = S(b[0], b[1], b[2]);
    ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]);
    ctx.strokeStyle = col; ctx.lineWidth = ancho; ctx.lineCap = "round"; ctx.stroke();
  }
  function etiqueta(x, y, texto, opc) {
    opc = opc || {};
    ctx.save();
    ctx.font = (opc.peso || 800) + " " + (opc.tam || 11) + "px " + MONO;
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1.2px";
    var w = ctx.measureText(texto).width, ph = (opc.tam || 11) + 12, pw = w + 20;
    var ax = opc.alinear === "derecha" ? x - pw : x, ay = y - ph / 2;
    ctx.globalAlpha *= opc.alfa == null ? 1 : opc.alfa;
    ctx.beginPath();
    var r = 9, r0 = 2;   // esquina superior izquierda casi recta: firma de la casa
    ctx.moveTo(ax + r0, ay); ctx.lineTo(ax + pw - r, ay); ctx.quadraticCurveTo(ax + pw, ay, ax + pw, ay + r);
    ctx.lineTo(ax + pw, ay + ph - r); ctx.quadraticCurveTo(ax + pw, ay + ph, ax + pw - r, ay + ph);
    ctx.lineTo(ax + r, ay + ph); ctx.quadraticCurveTo(ax, ay + ph, ax, ay + ph - r); ctx.lineTo(ax, ay + r0); ctx.closePath();
    ctx.fillStyle = opc.fondo || C.white; ctx.fill();
    if (opc.borde !== false) { ctx.strokeStyle = opc.borde || "rgba(6,75,174,.35)"; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.fillStyle = opc.color || C.ink; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(texto, ax + 10, ay + ph / 2 + .5);
    ctx.restore();
    return { x: ax, y: ay, w: pw, h: ph };
  }

  /* ---------- la polis ---------- */
  var ISLA = { x: 0, y: 0, w: 26, d: 22, alto: .7 };
  var AGORA = [13, 11];
  var BAL = { x: 6, y: 6 };          // zigurat del riesgo
  var FAR = { x: 22.2, y: 4.6 };     // faro sobre el promontorio
  var PLI = { x: 8, y: 17.2 };       // edificio público + pliego
  var CAPAS = [
    { lado: 6.2, col: C.white, txt: "01 · RIESGO MÍNIMO" },
    { lado: 4.9, col: C.yellow, txt: "02 · TRANSPARENCIA" },
    { lado: 3.6, col: C.blue, txt: "03 · ALTO RIESGO" },
    { lado: 2.3, col: C.red, txt: "04 · PROHIBIDO" }
  ];
  var ALTO_CAPA = .85;
  var CAMINOS = [
    [[13, 11], [13, 6], [9.4, 6]],
    [[13, 11], [18.5, 11], [18.5, 4.6], [20.4, 4.6]],
    [[13, 11], [13, 17.2], [11.1, 17.2]]
  ];
  var CASAS = [[16.5, 15.2, 1.4, 1.2, 1.1], [18.6, 15.4, 1.2, 1.6, 1.5], [21.2, 13.6, 1.6, 1.2, 1], [21.5, 17.4, 1.3, 1.3, 1.7], [16.6, 18.8, 1.5, 1.3, 1.2], [2.2, 11.6, 1.3, 1.5, 1.3], [3, 14.2, 1.6, 1.2, 1], [15.2, 2.2, 1.3, 1.3, 1.4], [10.8, 1.4, 1.5, 1.2, 1.1], [23.4, 10.2, 1.2, 1.4, 1.2]];
  var ARBOLES = [[15.5, 6.2], [16.4, 7.4], [15.2, 8.6], [10.6, 9.6], [9.6, 12.8], [4.2, 10.4], [1.6, 9], [2, 20.2], [4.6, 21], [12.4, 20.6], [14.6, 21.2], [19.8, 20.6], [23.6, 20.2], [24.6, 15.6], [20, 8.2], [24.2, 12.8], [7.4, 1.6], [12.6, 3.4], [1.6, 4.2], [18.2, 1.4], [11.2, 13.6], [16.2, 12.8]];
  var PERSONAS = [[14.6, 12.6, C.blue], [11.6, 9.6, C.ink], [14.2, 9.2, C.red], [11.4, 12.4, C.blueDark], [13, 13.8, C.blue], [12.2, 8.6, C.ink]];
  var NUBES = [[4, 3, 9.5, 1.3], [20, 9, 11, 1.6], [9, 21, 10, 1.1], [25, 18, 12, 1.4], [14, -2, 10.5, 1.2]];

  /* longitud y punto de una polilínea */
  function largo(pl) { var l = 0; for (var i = 1; i < pl.length; i++) l += Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]); return l; }
  function puntoEn(pl, t) {
    var L = largo(pl) * t;
    for (var i = 1; i < pl.length; i++) {
      var s = Math.hypot(pl[i][0] - pl[i - 1][0], pl[i][1] - pl[i - 1][1]);
      if (L <= s) { var k = s ? L / s : 0; return [lerp(pl[i - 1][0], pl[i][0], k), lerp(pl[i - 1][1], pl[i][1], k)]; }
      L -= s;
    }
    return pl[pl.length - 1];
  }

  /* ---------- cajas envolventes (unidades isométricas) para la cámara ---------- */
  function caja2d(pts) {
    var us = [], vs = [];
    pts.forEach(function (p) { var q = iso(p[0], p[1], p[2]); us.push(q[0]); vs.push(q[1]); });
    return { u0: Math.min.apply(null, us), u1: Math.max.apply(null, us), v0: Math.min.apply(null, vs), v1: Math.max.apply(null, vs) };
  }
  function prisma(x0, y0, x1, y1, z0, z1) { var p = []; [x0, x1].forEach(function (x) { [y0, y1].forEach(function (y) { [z0, z1].forEach(function (z) { p.push([x, y, z]); }); }); }); return p; }
  var ENCUADRES;
  function prepararEncuadres() {
    var sep = 4 * ALTO_CAPA + 3 * 1.25 + 2.2;  // zigurat abierto + balanza
    ENCUADRES = {
      general: caja2d(prisma(-1, -1, ISLA.w + 1, ISLA.d + 1, -1.6, 6)),
      balanza: caja2d(prisma(BAL.x - 3.4, BAL.y - 3.4, BAL.x + 3.4, BAL.y + 3.4, 0, sep)),
      faro: caja2d(prisma(FAR.x - 3, FAR.y - 3, FAR.x + 2.6, FAR.y + 2.6, -.4, 8.4)),
      pliego: caja2d(prisma(PLI.x - 3.2, PLI.y - 2.4, PLI.x + 3.2, PLI.y + 5.2, 0, 5.4))
    };
  }

  /* ---------- cámara ---------- */
  function encuadre(c, ancho, alto, ancla) {
    var z = Math.min(W * ancho / (c.u1 - c.u0), H * alto / (c.v1 - c.v0));
    return { foco: [(c.u0 + c.u1) / 2, (c.v0 + c.v1) / 2], z: z, ancla: ancla };
  }
  function paradas() {
    var lado = movil ? [W * .5, H * .3] : [W * .69, H * .48];
    var anchoP = movil ? .9 : .5, altoP = movil ? .5 : .8;
    var generalDer = movil ? encuadre(ENCUADRES.general, .96, .52, [W * .5, H * .33]) : encuadre(ENCUADRES.general, .5, .84, [W * .71, H * .52]);
    return [
      generalDer,
      encuadre(ENCUADRES.balanza, anchoP, altoP, lado),
      encuadre(ENCUADRES.faro, anchoP * .95, altoP, lado),
      encuadre(ENCUADRES.pliego, anchoP, altoP, lado),
      generalDer
    ];
  }
  function camara(T) {
    if (modo === "postal") return encuadre(ENCUADRES.general, .92, .9, [W * .5, H * .52]);
    var P = paradas(), n = P.length - 1;
    T = clamp(T, 0, n);
    var i = Math.min(Math.floor(T), n - 1), u = T - i;
    var a = P[i], b = P[i + 1];
    if (reducido) { var c = u < .5 ? a : b; return { foco: c.foco, z: c.z, ancla: c.ancla }; }
    var v = easeInOut(seg(u, .3, .7));
    var za = a.z * (1 + .06 * seg(u, 0, .3)), zb = b.z * (1 + .06 * (1 - seg(u, .7, 1)) * 0);
    var z = Math.exp(lerp(Math.log(za), Math.log(zb), v)) * (1 - .32 * Math.sin(Math.PI * v));
    return {
      foco: [lerp(a.foco[0], b.foco[0], v), lerp(a.foco[1], b.foco[1], v)],
      z: z,
      ancla: [lerp(a.ancla[0], b.ancla[0], v), lerp(a.ancla[1], b.ancla[1], v)]
    };
  }
  /* cuánto está «abierta» cada parada (0..1): se abre al llegar y se cierra al irse */
  function apertura(T, s) {
    if (reducido) return Math.abs(T - s) < .5 ? 1 : 0;
    return Math.min(seg(T, s - .3, s + .02), 1 - seg(T, s + .22, s + .32));
  }

  /* ---------- dibujo de cada pieza de la polis ---------- */
  function suelo(S, cam) {
    var I = ISLA;
    // zócalo de maqueta y placa principal
    caja(S, I.x - .8, I.y - .8, -1.6, I.w + 1.6, I.d + 1.6, .9, C.blueSoft, "rgba(6,75,174,.18)");
    caja(S, I.x, I.y, -I.alto, I.w, I.d, I.alto, C.white, C.line);
    // retícula fina sobre la placa
    ctx.save();
    poligono([S(0, 0, 0), S(I.w, 0, 0), S(I.w, I.d, 0), S(0, I.d, 0)], null, null);
    ctx.clip();
    ctx.strokeStyle = "rgba(6,75,174,0.06)"; ctx.lineWidth = 1; ctx.beginPath();
    for (var gx = 1; gx < I.w; gx++) { var a = S(gx, 0, 0), b = S(gx, I.d, 0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (var gy = 1; gy < I.d; gy++) { var c = S(0, gy, 0), d = S(I.w, gy, 0); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
    ctx.stroke(); ctx.restore();
    // promontorio del faro (agua alrededor)
    poligono([S(19.6, 0, 0), S(I.w, 0, 0), S(I.w, 9.4, 0), S(19.6, 9.4, 0)], rgba(C.blue, .07), null);
    // caminos
    CAMINOS.forEach(function (pl) {
      ctx.beginPath();
      pl.forEach(function (p, k) { var q = S(p[0], p[1], .01); if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); });
      ctx.strokeStyle = C.blueSoft; ctx.lineWidth = Math.max(4, cam.z * 1.05); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
      ctx.strokeStyle = "rgba(6,75,174,0.32)"; ctx.lineWidth = 1.3; ctx.setLineDash([5, 7]); ctx.stroke(); ctx.setLineDash([]);
    });
    // ágora: plaza circular con anillos
    disco(S, cam.z, AGORA[0], AGORA[1], .015, 3.1, C.blueSoft, "rgba(6,75,174,.25)");
    disco(S, cam.z, AGORA[0], AGORA[1], .02, 2.2, null, "rgba(6,75,174,.18)");
    disco(S, cam.z, AGORA[0], AGORA[1], .02, 1.3, rgba(C.yellow, .35), null);
  }

  function arbol(S, esc, x, y, k) {
    var h = 1 + (k % 3) * .25;
    cilindro(S, esc, x, y, 0, .09, .35, C.muted);
    cilindro(S, esc, x, y, .3, .48, h, k % 4 === 0 ? C.blue : TONO_ARBOL, 0);
  }
  function casa(S, esc, c) {
    var x = c[0], y = c[1], w = c[2], d = c[3], h = c[4];
    caja(S, x, y, 0, w, d, h, C.white);
    // tejado a dos aguas (cumbrera en x)
    var z0 = h, z1 = h + .55, ym = y + d / 2;
    poligono([S(x, y, z0), S(x + w, y, z0), S(x + w, ym, z1), S(x, ym, z1)], oscurecer(C.blueDark, .1), BORDE);
    poligono([S(x + w, y, z0), S(x + w, y + d, z0), S(x + w, ym, z1)], aclarar(C.blueSoft, 0), BORDE);
    poligono([S(x, y + d, z0), S(x + w, y + d, z0), S(x + w, ym, z1), S(x, ym, z1)], C.blueDark, BORDE);
    // ventana
    poligono([S(x + w, y + d * .35, h * .35), S(x + w, y + d * .65, h * .35), S(x + w, y + d * .65, h * .7), S(x + w, y + d * .35, h * .7)], rgba(C.yellow, .8), null);
  }
  function persona(S, esc, p) {
    cilindro(S, esc, p[0], p[1], 0, .13, .42, p[2]);
    esfera(S, esc, p[0], p[1], .56, .12, TONO_CABEZA);
  }

  /* ágora: monumento con el glifo de eunomIA (columna, astil y platillos) */
  function monumento(S, esc, reloj) {
    var x = AGORA[0], y = AGORA[1];
    caja(S, x - .6, y - .6, 0, 1.2, 1.2, .55, C.white);
    caja(S, x - .18, y - .18, .55, .36, .36, 2.3, C.blueDark);
    var bal = reducido ? 0 : Math.sin(reloj / 900) * .12;
    var zc = 2.75, ax = [x - 1.25, y + 1.25, zc + bal], bx = [x + 1.25, y - 1.25, zc - bal];
    linea(S, ax, bx, C.blueDark, Math.max(2, esc * .16));
    [ax, bx].forEach(function (e) {
      linea(S, e, [e[0] - .35, e[1], e[2] - .9], C.ink, 1);
      linea(S, e, [e[0], e[1] - .35, e[2] - .9], C.ink, 1);
      disco(S, esc, e[0] - .18, e[1] - .18, e[2] - .9, .42, C.yellow, oscurecer(C.yellow, .3));
    });
    esfera(S, esc, x, y, 3.05, .2, C.red);
  }

  /* 01 · Balanza: zigurat del riesgo que se despliega por capas */
  function balanza(S, esc, k, reloj, cam) {
    var x = BAL.x, y = BAL.y, z = 0, info = [];
    var abre = easeInOut(k);
    CAPAS.forEach(function (c, i) {
      var l = c.lado, sep = i * abre * 1.25;
      var zz = z + sep;
      caja(S, x - l / 2, y - l / 2, zz, l, l, ALTO_CAPA, c.col, i === 0 ? C.line : BORDE);
      // pequeño relieve: ranura bajo cada capa
      info.push({ i: i, ancla: S(x + l / 2, y, zz + ALTO_CAPA / 2), sep: sep });
      z += ALTO_CAPA;
    });
    // balanza sobre la cúspide
    var top = z + 3 * abre * 1.25;
    caja(S, x - .14, y - .14, top, .28, .28, 1.3, C.ink);
    var bal = reducido ? 0 : Math.sin(reloj / 700) * .1 * (1 - abre * .5);
    var a = [x - .95, y + .95, top + 1.25 + bal], b = [x + .95, y - .95, top + 1.25 - bal];
    linea(S, a, b, C.ink, Math.max(1.6, esc * .1));
    [a, b].forEach(function (e) {
      linea(S, e, [e[0] - .25, e[1], e[2] - .7], C.muted, 1);
      linea(S, e, [e[0], e[1] - .25, e[2] - .7], C.muted, 1);
      disco(S, esc, e[0] - .12, e[1] - .12, e[2] - .7, .32, C.yellow, oscurecer(C.yellow, .35));
    });
    // rótulos de capa con líneas guía (solo cuando está abierto)
    if (k > .05) {
      info.forEach(function (n) {
        var p = n.ancla, alfa = seg(k, .25 + n.i * .12, .6 + n.i * .12);
        if (alfa <= 0) return;
        var lx = p[0] + 30 + (3 - n.i) * 6, ly = p[1];
        ctx.save(); ctx.globalAlpha = alfa;
        ctx.strokeStyle = n.i === 3 ? C.red : C.blue; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(p[0] + 4, p[1]); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(p[0] + 4, p[1], 3, 0, Math.PI * 2); ctx.fill();
        etiqueta(lx, ly, CAPAS[n.i].txt, { tam: movil ? 9 : 10.5, color: n.i === 3 ? C.red : C.blueDark, borde: n.i === 3 ? "rgba(255,23,56,.45)" : undefined });
        ctx.restore();
      });
    }
  }

  /* 02 · Faro: torre a franjas con haz giratorio y aviso */
  function faro(S, esc, k, reloj) {
    var x = FAR.x, y = FAR.y;
    // rocas del promontorio
    caja(S, x - 2, y - 1.6, 0, 3.6, 3.2, .45, C.line);
    caja(S, x - 1.4, y - 1.2, .45, 2.6, 2.4, .35, TONO_ROCA);
    caja(S, x + 1.2, y + .9, 0, 1, .9, .3, C.line);
    var z = .8, r = .85, zt = z + 4.2, zl = zt + .6;
    // ángulo del haz: gira solo y, al abrir la parada, se queda barriendo la isla hacia la izquierda
    var giro = reducido ? 2.5 : (reloj / 2600) % (Math.PI * 2);
    var objetivo = Math.PI * .8;
    var ang = lerp(giro, objetivo + Math.round((giro - objetivo) / (Math.PI * 2)) * Math.PI * 2, easeInOut(k));
    var haz = function () {
      var ap = .2, L = 9 + k * 4;
      var c0 = S(x, y, zl);
      var p1 = S(x + Math.cos(ang - ap) * L, y + Math.sin(ang - ap) * L, zl), p2 = S(x + Math.cos(ang + ap) * L, y + Math.sin(ang + ap) * L, zl);
      var g = ctx.createRadialGradient(c0[0], c0[1], 0, c0[0], c0[1], Math.hypot(p1[0] - c0[0], p1[1] - c0[1]));
      g.addColorStop(0, rgba(C.yellow, .6)); g.addColorStop(1, rgba(C.yellow, 0));
      poligono([c0, p1, p2], g, null);
    };
    var delante = Math.cos(ang) + Math.sin(ang) > .15;
    // halo detrás de todo
    var brillo = reducido ? .4 : .3 + .25 * (Math.sin(reloj / 300) + 1) / 2;
    var cl = S(x, y, zl);
    var gl = ctx.createRadialGradient(cl[0], cl[1], 0, cl[0], cl[1], esc * 2.4);
    gl.addColorStop(0, rgba(C.yellow, brillo)); gl.addColorStop(1, rgba(C.yellow, 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cl[0], cl[1], esc * 2.4, 0, Math.PI * 2); ctx.fill();
    if (!delante) haz();
    var franjas = [C.white, C.blue, C.white, C.blue];
    franjas.forEach(function (col, i) { var r0 = r - i * .07, r1 = r - (i + 1) * .07; cilindro(S, esc, x, y, z + i * 1.05, r0, 1.05, col, r1); });
    cilindro(S, esc, x, y, zt, 1.05, .16, C.blueDark);
    cilindro(S, esc, x, y, zt + .16, .62, .9, C.yellow);
    cilindro(S, esc, x, y, zt + 1.06, .8, .75, C.blueDark, 0);
    esfera(S, esc, x, y, zt + 1.86, .1, C.red);
    if (delante) haz();
    z = zt;
    // bocadillo de aviso al abrir
    if (k > .35) {
      var a = seg(k, .35, .85);
      var q = S(x + 1.2, y + 1.2, zl + .4);
      ctx.save(); ctx.globalAlpha = a;
      var txt1 = "Estás hablando con", txt2 = "un asistente de IA.";
      var fs = movil ? 12 : 15;
      ctx.font = "700 " + fs + "px Inter, ui-sans-serif, system-ui, sans-serif";
      var w = Math.max(ctx.measureText(txt1).width, ctx.measureText(txt2).width) + 34, h = fs * 2 + 40;
      var bx = q[0] + 10 + (1 - easeBack(a)) * 20, by = q[1] - h - 6;
      ctx.shadowColor = "rgba(20,45,78,.22)"; ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
      ctx.beginPath();
      ctx.moveTo(bx + 3, by); ctx.lineTo(bx + w - 16, by); ctx.quadraticCurveTo(bx + w, by, bx + w, by + 16);
      ctx.lineTo(bx + w, by + h - 16); ctx.quadraticCurveTo(bx + w, by + h, bx + w - 16, by + h);
      ctx.lineTo(bx + 26, by + h); ctx.lineTo(bx + 4, by + h + 14); ctx.lineTo(bx + 12, by + h);
      ctx.quadraticCurveTo(bx, by + h, bx, by + h - 16); ctx.lineTo(bx, by + 3); ctx.closePath();
      ctx.fillStyle = C.white; ctx.fill(); ctx.shadowColor = "transparent";
      ctx.strokeStyle = "rgba(6,75,174,.35)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = C.blue; ctx.font = "800 " + (fs - 5) + "px " + MONO; ctx.textBaseline = "top";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
      ctx.fillText("AVISO · ART. 50 RIA", bx + 16, by + 12);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      ctx.fillStyle = C.ink; ctx.font = "700 " + fs + "px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(txt1, bx + 16, by + 14 + fs); ctx.fillText(txt2, bx + 16, by + 18 + fs * 2);
      ctx.restore();
    }
  }

  /* 03 · Pliego: edificio público con columnata, documento que se levanta y sello */
  function pliego(S, esc, k) {
    var x0 = PLI.x - 2.6, x1 = PLI.x + 2.6, y0 = PLI.y - 1.9, y1 = PLI.y + 1.9;
    // gradas
    [0, 1, 2].forEach(function (i) { var m = i * .28; caja(S, x0 - .9 + m, y0 - .9 + m, i * .22, (x1 - x0) + 1.8 - 2 * m, (y1 - y0) + 1.8 - 2 * m, .22, C.white); });
    var zb = .66, hc = 2.2;
    // columnas traseras, cella, columnas delanteras
    var cols = [], nX = 6, nY = 4, i;
    for (i = 0; i < nX; i++) cols.push([lerp(x0, x1, i / (nX - 1)), y0]);
    for (i = 1; i < nY - 1; i++) cols.push([x0, lerp(y0, y1, i / (nY - 1))]);
    var delanteras = [];
    for (i = 0; i < nX; i++) delanteras.push([lerp(x0, x1, i / (nX - 1)), y1]);
    for (i = 1; i < nY - 1; i++) delanteras.push([x1, lerp(y0, y1, i / (nY - 1))]);
    cols.forEach(function (c) { cilindro(S, esc, c[0], c[1], zb, .2, hc, C.white); });
    caja(S, x0 + .5, y0 + .5, zb, x1 - x0 - 1, y1 - y0 - 1, hc, C.blueSoft);
    poligono([S(x1 - .5, PLI.y - .45, zb), S(x1 - .5, PLI.y + .45, zb), S(x1 - .5, PLI.y + .45, zb + 1.4), S(x1 - .5, PLI.y - .45, zb + 1.4)], C.blueDark, null);
    delanteras.sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]); }).forEach(function (c) { cilindro(S, esc, c[0], c[1], zb, .2, hc, C.white); });
    // entablamento y frontón (cumbrera en x)
    var ze = zb + hc;
    caja(S, x0 - .3, y0 - .3, ze, x1 - x0 + .6, y1 - y0 + .6, .38, C.white);
    var z0 = ze + .38, z1 = z0 + 1.15, ym = PLI.y, ya = y0 - .3, yb = y1 + .3, xa = x0 - .3, xb = x1 + .3;
    poligono([S(xa, ya, z0), S(xb, ya, z0), S(xb, ym, z1), S(xa, ym, z1)], oscurecer(C.blueDark, .1), BORDE);
    poligono([S(xb, ya, z0), S(xb, yb, z0), S(xb, ym, z1)], C.white, BORDE);
    poligono([S(xb, ya + .35, z0 + .1), S(xb, yb - .35, z0 + .1), S(xb, ym, z1 - .22)], C.blueSoft, null);
    poligono([S(xa, yb, z0), S(xb, yb, z0), S(xb, ym, z1), S(xa, ym, z1)], C.blueDark, BORDE);
    // rótulo § en el frontón
    var f = S(xb, ym, z0 + .38);
    ctx.save(); ctx.fillStyle = C.blue; ctx.font = "900 " + Math.max(9, esc * .55) + "px " + COND; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("§", f[0], f[1]); ctx.restore();

    // el pliego: un documento que se levanta desde el suelo hacia quien mira
    var dx0 = PLI.x - 1.9, dx1 = PLI.x + 1.9, dy = y1 + 1.35, L = 3.1;
    var th = easeInOut(seg(k, 0, .55)) * 1.18;   // radianes (hasta ~68°)
    var P = function (xx, t, h) { return S(xx, dy + Math.cos(th) * t - Math.sin(th) * h, .02 + Math.sin(th) * t + Math.cos(th) * h); };
    // sombra
    poligono([S(dx0, dy, .01), S(dx1, dy, .01), S(dx1, dy + L * Math.cos(th) + .3, .01), S(dx0, dy + L * Math.cos(th) + .3, .01)], "rgba(17,24,32,.08)", null);
    // canto y hoja
    poligono([P(dx0, 0, 0), P(dx1, 0, 0), P(dx1, L, 0), P(dx0, L, 0)], C.white, "rgba(6,75,174,.4)", 1.2);
    // líneas de texto que se van escribiendo
    var lineas = 9, escrito = seg(k, .35, .85) * lineas;
    for (var j = 0; j < lineas; j++) {
      var t = L - .45 - j * .27, fin = clamp(escrito - j, 0, 1);
      if (fin <= 0) break;
      var largoL = (j === 0 ? .55 : j % 4 === 3 ? .5 : .82) * (dx1 - dx0 - .6);
      var a = P(dx0 + .3, t, .001), b = P(dx0 + .3 + largoL * fin, t, .001);
      ctx.strokeStyle = j === 0 ? C.blueDark : "rgba(6,75,174,.45)"; ctx.lineWidth = j === 0 ? Math.max(2, esc * .1) : Math.max(1, esc * .045);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // sello: baja, golpea y deja la marca roja
    var golpe = seg(k, .7, .88), sube = seg(k, .9, 1);
    if (golpe > 0) {
      var sx = dx1 - .75, st = .75, alto = (1 - easeOut(golpe)) * 2.2 + sube * 1.4;
      var marca = P(sx, st, .002);
      if (golpe >= 1) {
        ctx.save(); ctx.translate(marca[0], marca[1]);
        ctx.strokeStyle = C.red; ctx.lineWidth = Math.max(1.5, esc * .07);
        ctx.beginPath(); ctx.ellipse(0, 0, esc * .48, esc * .4, -.2, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = C.red; ctx.font = "900 " + Math.max(9, esc * .48) + "px " + COND; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("§", 0, 1);
        ctx.restore();
      }
      if (sube < 1) {
        ctx.save(); ctx.globalAlpha = 1 - sube;
        var base = P(sx, st, .05 + alto), bx = base;
        // mango y pieza
        cilindro(function (xx, yy, zz) { return [bx[0] + (xx - yy) * C30 * esc, bx[1] + ((xx + yy) * .5 - zz) * esc]; }, esc, 0, 0, 0, .38, .22, C.red);
        cilindro(function (xx, yy, zz) { return [bx[0] + (xx - yy) * C30 * esc, bx[1] + ((xx + yy) * .5 - zz) * esc]; }, esc, 0, 0, .22, .12, .7, C.ink);
        esfera(function (xx, yy, zz) { return [bx[0] + (xx - yy) * C30 * esc, bx[1] + ((xx + yy) * .5 - zz) * esc]; }, esc, 0, 0, 1, .22, C.ink);
        ctx.restore();
      }
    }
  }

  function paquetes(S, esc, reloj) {
    var cols = [C.yellow, C.blue, C.red];
    CAMINOS.forEach(function (pl, r) {
      for (var j = 0; j < 3; j++) {
        var t = reducido ? (j + .5) / 3 : ((reloj / (5200 + r * 900) + j / 3 + r * .17) % 1);
        var p = puntoEn(pl, t);
        caja(S, p[0] - .17, p[1] - .17, .02, .34, .34, .3, cols[(j + r) % 3]);
      }
    });
  }

  function nube(x, y, cam, n, reloj) {
    var deriva = reducido ? 0 : (reloj / 60000) % 1 * 6;
    var q = iso(n[0] + deriva, n[1] - deriva * .3, n[2]);
    var cx = (q[0] - cam.foco[0]) * cam.z + cam.ancla[0], cy = (q[1] - cam.foco[1]) * cam.z + cam.ancla[1];
    var r = n[3] * cam.z;
    // las nubes se desvanecen al acercarse mucho (sensación de atravesarlas)
    var alfa = .78 * (1 - seg(cam.z, 60, 110));
    if (alfa <= .01 || cx < -r * 3 || cx > W + r * 3 || cy < -r * 3 || cy > H + r * 3) return;
    ctx.save(); ctx.globalAlpha = alfa; ctx.fillStyle = C.white;
    ctx.shadowColor = "rgba(20,45,78,.08)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 12;
    [[0, 0, 1], [-.9, .25, .7], [.95, .2, .75], [.35, -.35, .7], [-.4, -.25, .6]].forEach(function (b) {
      ctx.beginPath(); ctx.ellipse(cx + b[0] * r, cy + b[1] * r * .55, r * b[2], r * b[2] * .55, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }

  /* ---------- fotograma ---------- */
  function dibujar(T, extra) {
    extra = extra || {};
    var reloj = extra.reloj || 0;
    var cam = camara(T);
    var S = function (x, y, z) { var q = iso(x, y, z); return [(q[0] - cam.foco[0]) * cam.z + cam.ancla[0], (q[1] - cam.foco[1]) * cam.z + cam.ancla[1]]; };
    var esc = cam.z;

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

    suelo(S, cam);

    var kB = modo === "postal" ? 0 : apertura(T, 1), kF = modo === "postal" ? 0 : apertura(T, 2), kP = modo === "postal" ? 0 : apertura(T, 3);

    // todo lo que está sobre la placa, ordenado de atrás hacia delante
    var piezas = [];
    ARBOLES.forEach(function (a, i) { piezas.push({ d: a[0] + a[1], f: function () { arbol(S, esc, a[0], a[1], i); } }); });
    CASAS.forEach(function (c) { piezas.push({ d: c[0] + c[1] + c[2] + c[3], f: function () { casa(S, esc, c); } }); });
    PERSONAS.forEach(function (p) { piezas.push({ d: p[0] + p[1], f: function () { persona(S, esc, p); } }); });
    piezas.push({ d: AGORA[0] + AGORA[1] + .5, f: function () { monumento(S, esc, reloj); } });
    piezas.push({ d: BAL.x + BAL.y + 3.4, f: function () { balanza(S, esc, kB, reloj, cam); } });
    piezas.push({ d: FAR.x + FAR.y + 1.5, f: function () { faro(S, esc, kF, reloj); } });
    piezas.push({ d: PLI.x + PLI.y + 4, f: function () { pliego(S, esc, kP); } });
    piezas.push({ d: 0, f: function () { paquetes(S, esc, reloj); } });
    piezas.sort(function (a, b) { return a.d - b.d; }).forEach(function (p) { p.f(); });

    // nubes por encima de los edificios
    NUBES.forEach(function (n) { nube(0, 0, cam, n, reloj); });

    // velo de papel bajo el texto (escritorio)
    if (!movil && modo !== "postal") {
      var vel = ctx.createLinearGradient(0, 0, W * .5, 0);
      vel.addColorStop(0, "rgba(246,248,251,0.96)"); vel.addColorStop(.7, "rgba(246,248,251,0.78)"); vel.addColorStop(1, "rgba(246,248,251,0)");
      ctx.fillStyle = vel; ctx.fillRect(0, 0, W * .5, H);
    }
    // rótulos de los edificios en las vistas generales
    cajasHit = [];
    var general = modo === "postal" ? 1 : Math.max(1 - seg(T, .1, .35), seg(T, 3.65, 3.9));
    var hitos = [
      { n: 1, txt: "01 / BALANZA", p: [BAL.x, BAL.y, 6.2] },
      { n: 2, txt: "02 / FARO", p: [FAR.x, FAR.y, 7.4] },
      { n: 3, txt: "03 / PLIEGO", p: [PLI.x, PLI.y, 5.2] }
    ];
    if (general > .02) {
      hitos.forEach(function (h) {
        var q = S(h.p[0], h.p[1], h.p[2]);
        var sobre = extra.hover === h.n;
        ctx.save(); ctx.globalAlpha = general;
        ctx.strokeStyle = sobre ? C.red : C.blue; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(q[0], q[1] - 18); ctx.stroke();
        ctx.fillStyle = ctx.strokeStyle; ctx.beginPath(); ctx.arc(q[0], q[1], 3.2, 0, Math.PI * 2); ctx.fill();
        var r = etiqueta(q[0] - 4, q[1] - 30, h.txt, { tam: movil ? 9 : 11, fondo: sobre ? C.yellow : C.white, color: C.blueDark });
        ctx.restore();
        cajasHit.push({ n: h.n, x: r.x - 14, y: r.y - 10, w: r.w + 28, h: r.h + 60 });
      });
    }


    return { general: general };
  }

  window.EuMundo = {
    PARADAS: 4,
    iniciar: function (lienzo, opc) {
      canvas = lienzo; ctx = canvas.getContext("2d");
      modo = (opc && opc.modo) || "recorrido";
      prepararEncuadres();
    },
    medir: function (esMovil, menosMovimiento) {
      var r = canvas.getBoundingClientRect();
      movil = esMovil; reducido = menosMovimiento;
      W = Math.max(1, r.width); H = Math.max(1, r.height); DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    },
    dibujar: dibujar,
    edificioEn: function (x, y) {
      for (var i = 0; i < cajasHit.length; i++) { var c = cajasHit[i]; if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return c.n; }
      return 0;
    }
  };
})();
