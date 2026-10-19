/* Alfabetización en IA · mundo isométrico (Canvas)
 * Motor de dibujo del recorrido: islas, piezas, ruta y pantallas con las
 * portadas de los vídeos. No sabe nada del scroll ni del DOM: app.js le pide
 * fotogramas con LitMundo.dibujar(T, extra).
 */
(function () {
  "use strict";

  var C30 = Math.cos(Math.PI / 6), K = 1.2247449;   // K: radio de un círculo en isométrica
  var PLACA = 0.14, LADO = 4.6, TAM_OBJ = 3.3;      // grosor/lado de la isla y tamaño normalizado del objeto
  var C = { blue: "#064bae", blueDark: "#052f70", ink: "#111820", muted: "#56616f", line: "#d8dee7", paper: "#f6f8fb", red: "#ff1738", yellow: "#ffe500" };
  var MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  var canvas, ctx, DATA, N, OBJ = [], W = 0, H = 0, DPR = 1, movil = false, reducido = false;
  var islasPantalla = [];   // polígonos de cada isla en pantalla, para el puntero

  /* ---------- utilidades ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function easeOut(x) { return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function easeBack(x) { var c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hex(h) { h = h.replace("#", ""); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function mezcla(h, d, k) { return "rgb(" + hex(h).map(function (v) { return Math.round(v + (d - v) * k); }).join(",") + ")"; }
  function aHex(rgb) { return "#" + rgb.match(/\d+/g).map(function (v) { v = Number(v); return (v < 16 ? "0" : "") + v.toString(16); }).join(""); }
  function aclarar(h, k) { return mezcla(h, 255, k); }
  function oscurecer(h, k) { return mezcla(h, 0, k); }
  function resolverColor(c, acento) {
    if (c === "acento") return acento;
    if (c === "acento-claro") return aHex(aclarar(acento, .5));
    if (c === "acento-oscuro") return aHex(oscurecer(acento, .35));
    return c;
  }
  function iso(x, y, z) { return [(x - y) * C30, (x + y) * .5 - z]; }

  /* ---------- geometría de piezas ---------- */
  function puntoCirculo(p, g, r) {
    var a = g * Math.PI / 180, c = p.pos;
    if (p.plano === "xz") return [c[0] + Math.cos(a) * r, c[1], c[2] + Math.sin(a) * r];
    if (p.plano === "yz") return [c[0], c[1] + Math.cos(a) * r, c[2] + Math.sin(a) * r];
    return [c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, c[2]];
  }
  function puntosPieza(p) {
    var t = p.tipo, pts = [], i, a;
    if (t === "caja") {
      [0, p.tam[0]].forEach(function (dx) { [0, p.tam[1]].forEach(function (dy) { [0, p.tam[2]].forEach(function (dz) { pts.push([p.pos[0] + dx, p.pos[1] + dy, p.pos[2] + dz]); }); }); });
    } else if (t === "cilindro" || t === "cono" || t === "tronco") {
      for (i = 0; i < 16; i++) { a = i / 16 * Math.PI * 2; pts.push([p.pos[0] + Math.cos(a) * p.radio, p.pos[1] + Math.sin(a) * p.radio, p.pos[2]]); }
      pts.push([p.pos[0], p.pos[1], p.pos[2] + p.alto]);
    } else if (t === "esfera") {
      pts.push([p.pos[0] - p.radio, p.pos[1] - p.radio, p.pos[2] - p.radio], [p.pos[0] + p.radio, p.pos[1] + p.radio, p.pos[2] + p.radio]);
    } else if (t === "poligono") { pts = p.puntos.slice(); }
    else if (t === "disco" || t === "arco") { for (i = 0; i < 16; i++) pts.push(puntoCirculo(p, i / 16 * 360, p.radio)); }
    else if (t === "linea") { pts.push(p.desde, p.hasta); }
    return pts;
  }

  /* ---------- primitivas de dibujo ---------- */
  var BORDE = "rgba(17,24,32,0.10)";
  function poligono(pts, relleno, trazo, ancho) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath(); ctx.fillStyle = relleno; ctx.fill();
    if (trazo) { ctx.strokeStyle = trazo; ctx.lineWidth = ancho || 1.2; ctx.lineJoin = "round"; ctx.stroke(); }
  }
  function caja(P, x, y, z, w, d, h, col, trazo) {
    poligono([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], oscurecer(col, .2), trazo || BORDE);
    poligono([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], oscurecer(col, .07), trazo || BORDE);
    poligono([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], aclarar(col, .12), trazo || BORDE);
  }
  function dibujarPieza(p, col, P, esc) {
    var t = p.tipo;
    if (t === "caja") { caja(P, p.pos[0], p.pos[1], p.pos[2], p.tam[0], p.tam[1], p.tam[2], col); }
    else if (t === "cilindro" || t === "cono" || t === "tronco") {
      var r0 = p.radio, r1 = t === "cilindro" ? p.radio : t === "cono" ? 0 : p.radioSuperior;
      var b = P(p.pos[0], p.pos[1], p.pos[2]), tp = P(p.pos[0], p.pos[1], p.pos[2] + p.alto);
      var rx0 = r0 * esc * K, ry0 = r0 * esc * .7071, rx1 = r1 * esc * K, ry1 = r1 * esc * .7071;
      var g = ctx.createLinearGradient(b[0] - rx0, 0, b[0] + rx0, 0);
      g.addColorStop(0, aclarar(col, .08)); g.addColorStop(.45, oscurecer(col, .02)); g.addColorStop(1, oscurecer(col, .24));
      ctx.beginPath(); ctx.ellipse(b[0], b[1], rx0, ry0, 0, 0, Math.PI, false);
      if (r1 > 0) ctx.ellipse(tp[0], tp[1], rx1, ry1, 0, Math.PI, 0, false); else ctx.lineTo(tp[0], tp[1]);
      ctx.closePath(); ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = BORDE; ctx.lineWidth = 1.2; ctx.stroke();
      if (r1 > 0) { ctx.beginPath(); ctx.ellipse(tp[0], tp[1], rx1, ry1, 0, 0, Math.PI * 2); ctx.fillStyle = aclarar(col, .14); ctx.fill(); ctx.stroke(); }
    } else if (t === "esfera") {
      var c = P(p.pos[0], p.pos[1], p.pos[2]), r = p.radio * esc * K;
      var gr = ctx.createRadialGradient(c[0] - r * .35, c[1] - r * .4, r * .1, c[0], c[1], r);
      gr.addColorStop(0, aclarar(col, .45)); gr.addColorStop(1, oscurecer(col, .12));
      ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
    } else if (t === "poligono") { poligono(p.puntos.map(function (q) { return P(q[0], q[1], q[2]); }), col); }
    else if (t === "disco") {
      var pts = []; for (var i = 0; i < 48; i++) pts.push(puntoCirculo(p, i / 48 * 360, p.radio));
      poligono(pts.map(function (q) { return P(q[0], q[1], q[2]); }), col);
    } else if (t === "arco") {
      ctx.beginPath();
      for (var k = 0; k <= 48; k++) { var q = P.apply(null, puntoCirculo(p, p.desde + (p.hasta - p.desde) * k / 48, p.radio)); if (k) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
      ctx.strokeStyle = col; ctx.lineWidth = p.grosor * esc; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
    } else if (t === "linea") {
      var d0 = P(p.desde[0], p.desde[1], p.desde[2]), d1 = P(p.hasta[0], p.hasta[1], p.hasta[2]);
      ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]);
      ctx.strokeStyle = col; ctx.lineWidth = p.grosor * esc; ctx.lineCap = "round"; ctx.stroke();
    }
  }

  /* ---------- preparación del mundo ---------- */
  // Islas en zigzag: el recorrido baja por la pantalla alternando derecha e izquierda
  function posicionIsla(i) {
    var x = 0, y = 0;
    for (var k = 1; k <= i; k++) { if (k % 2) { x += 8; y -= 4; } else { y += 6.5; } }
    return [x, y];
  }

  function preparar() {
    OBJ = DATA.secciones.map(function (s, i) {
      var pts = [];
      s.piezas.forEach(function (p) { pts = pts.concat(puntosPieza(p)); });
      var xs = pts.map(function (q) { return q[0]; }), ys = pts.map(function (q) { return q[1]; });
      var cx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2;
      var cy = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
      var pr = pts.map(function (q) { return iso(q[0], q[1], q[2]); });
      var pu = pr.map(function (q) { return q[0]; }), pv = pr.map(function (q) { return q[1]; });
      var w = Math.max.apply(null, pu) - Math.min.apply(null, pu), h = Math.max.apply(null, pv) - Math.min.apply(null, pv);
      var k = TAM_OBJ / Math.max(w, h * 1.05);
      var isla = posicionIsla(i);
      var colocados = pts.map(function (q) { return iso(isla[0] + (q[0] - cx) * k, isla[1] + (q[1] - cy) * k, PLACA + q[2] * k); });
      var cu = colocados.map(function (q) { return q[0]; }), cv = colocados.map(function (q) { return q[1]; });
      var foco = [(Math.min.apply(null, cu) + Math.max.apply(null, cu)) / 2, (Math.min.apply(null, cv) + Math.max.apply(null, cv)) / 2 + .25];
      var huella = Math.max.apply(null, xs.map(function (v) { return Math.abs(v - cx); }).concat(ys.map(function (v) { return Math.abs(v - cy); }))) * k;
      var portadas = (s.videos || []).map(function (v) {
        var img = new Image(); img.decoding = "async"; img.src = v.portada;
        img.onload = function () { if (opciones.alCargar) opciones.alCargar(); };
        return img;
      });
      return { s: s, k: k, cx: cx, cy: cy, isla: isla, foco: foco, huella: huella, portadas: portadas, alza: 0 };
    });
  }

  var opciones = {};

  /* ---------- cámara ---------- */
  function zoomInmersion() { return Math.min(H * (movil ? .34 : .44), W * (movil ? .66 : .34)) / TAM_OBJ; }
  function anclaje() { return movil ? [W * .5, H * .3] : [W * .66, H * .5]; }

  function vistaGeneral() {
    var us = [], vs = [];
    OBJ.forEach(function (o) {
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (s) { var q = iso(o.isla[0] + s[0] * LADO / 2, o.isla[1] + s[1] * LADO / 2, 0); us.push(q[0]); vs.push(q[1]); });
      vs.push(o.foco[1] - TAM_OBJ / 2);
    });
    var u0 = Math.min.apply(null, us), u1 = Math.max.apply(null, us), v0 = Math.min.apply(null, vs), v1 = Math.max.apply(null, vs);
    return { foco: [(u0 + u1) / 2, (v0 + v1) / 2], z: Math.min(W * .86 / (u1 - u0), H * .8 / (v1 - v0)) };
  }

  function camara(T, extra) {
    var Zd = zoomInmersion(), Zm = Zd * .8, Zo = Zd * .46;
    var i = clamp(Math.floor(T), 0, N - 1), u = clamp(T - i, 0, 1), ultimo = i === N - 1;
    var a = anclaje(), foco = OBJ[i].foco, z = Zd, ancla = a, viaje = 0, general = 0;

    if (!reducido) {
      z = i === 0 ? Zd : lerp(Zm, Zd, easeOut(seg(u, 0, .15)));
      if (!ultimo) {
        if (u > .62) {
          viaje = easeInOut(seg(u, .62, 1));
          var sig = OBJ[i + 1].foco;
          foco = [lerp(foco[0], sig[0], viaje), lerp(foco[1], sig[1], viaje)];
          z = u < .81 ? lerp(Zd, Zo, easeInOut(seg(u, .62, .81))) : lerp(Zo, Zm, easeInOut(seg(u, .81, 1)));
        }
      } else if (u > .6) {
        var g = vistaGeneral();
        general = easeInOut(seg(u, .6, 1));
        foco = [lerp(foco[0], g.foco[0], general), lerp(foco[1], g.foco[1], general)];
        z = lerp(Zd, g.z, general);
        ancla = [lerp(a[0], W / 2, general), lerp(a[1], H * .5, general)];
      }
    }
    // paralaje suave con el puntero (desactivada si se pide menos movimiento)
    if (extra && extra.puntero && !reducido) {
      ancla = [ancla[0] - extra.puntero[0] * 16, ancla[1] - extra.puntero[1] * 10];
    }
    return { foco: foco, z: z, ancla: ancla, i: i, u: u, viaje: viaje, general: general };
  }

  /* ---------- pantallas con las portadas ----------
   * Dos pantallas de pie sobre el borde trasero derecho de la isla (plano y = cte).
   * Se levantan girando sobre su base cuando la pieza ya está montada.
   */
  function pantallas(o, S, cam, levantar, resaltar) {
    if (!o.portadas.length || levantar <= 0) return;
    var X = o.isla[0], Y = o.isla[1], h = LADO / 2;
    var ancho = 1.5, alto = ancho * 9 / 16, hueco = .22, base = PLACA + .02;
    var y0 = Y - h + .2, x0 = X - (ancho * 2 + hueco) / 2 + .45;
    o.portadas.forEach(function (img, k) {
      var q = clamp((levantar - k * .18) / .82, 0, 1);
      if (q <= 0) return;
      var th = easeBack(q) * Math.PI / 2;                    // 0 tumbada → 90° de pie
      var up = [0, Math.cos(th), Math.sin(th)];              // tumbada sobre la isla → de pie
      var xa = x0 + k * (ancho + hueco), xb = xa + ancho;
      var p = function (x, t) { return S(x, y0 + up[1] * t, base + up[2] * t); };
      var bl = p(xa, 0), br = p(xb, 0), tl = p(xa, alto), tr = p(xb, alto);
      // marco y sombra de contacto
      ctx.save();
      ctx.globalAlpha = clamp(q * 1.6, 0, 1);
      poligono([tl, tr, br, bl], C.ink, null);
      var m = .05, bl2 = p(xa + m, m), br2 = p(xb - m, m), tl2 = p(xa + m, alto - m);
      if (img.complete && img.naturalWidth) {
        ctx.save();
        ctx.beginPath(); ctx.moveTo(tl2[0], tl2[1]); ctx.lineTo(p(xb - m, alto - m)[0], p(xb - m, alto - m)[1]); ctx.lineTo(br2[0], br2[1]); ctx.lineTo(bl2[0], bl2[1]); ctx.closePath(); ctx.clip();
        // transformación afín: imagen → paralelogramo proyectado
        var iw = img.naturalWidth, ih = img.naturalHeight;
        var ax = (p(xb - m, alto - m)[0] - tl2[0]) / iw, ay = (p(xb - m, alto - m)[1] - tl2[1]) / iw;
        var bx = (bl2[0] - tl2[0]) / ih, by = (bl2[1] - tl2[1]) / ih;
        ctx.transform(ax, ay, bx, by, tl2[0], tl2[1]);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      } else {
        poligono([tl2, p(xb - m, alto - m), br2, bl2], C.blueDark, null);
      }
      // número del vídeo en la peana
      var pe = p(xa, 0);
      ctx.font = "800 " + clamp(cam.z * .14, 8, 12) + "px " + MONO;
      ctx.fillStyle = resaltar ? C.blue : C.muted; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(o.s.videos[k].numero, pe[0] + 2, pe[1] + 4);
      ctx.restore();
    });
  }

  /* ---------- fotograma ---------- */
  function dibujar(T, extra) {
    extra = extra || {};
    var cam = camara(T, extra);
    var S = function (x, y, zz) { var q = iso(x, y, zz); return [(q[0] - cam.foco[0]) * cam.z + cam.ancla[0], (q[1] - cam.foco[1]) * cam.z + cam.ancla[1]]; };

    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);

    // suelo: retícula isométrica fina (se desplaza con la cámara)
    var inv = function (sx, sy) { var u = (sx - cam.ancla[0]) / cam.z + cam.foco[0], v = (sy - cam.ancla[1]) / cam.z + cam.foco[1]; return [(u / C30 + 2 * v) / 2, (2 * v - u / C30) / 2]; };
    var esq = [inv(0, 0), inv(W, 0), inv(0, H), inv(W, H)];
    var x0 = Math.floor(Math.min.apply(null, esq.map(function (q) { return q[0]; }))), x1 = Math.ceil(Math.max.apply(null, esq.map(function (q) { return q[0]; })));
    var y0 = Math.floor(Math.min.apply(null, esq.map(function (q) { return q[1]; }))), y1 = Math.ceil(Math.max.apply(null, esq.map(function (q) { return q[1]; })));
    var paso = cam.z < 45 ? 2 : 1;
    ctx.strokeStyle = "rgba(6,75,174,0.055)"; ctx.lineWidth = 1; ctx.beginPath();
    for (var gx = x0 - x0 % paso; gx <= x1; gx += paso) { var a = S(gx, y0, 0), b = S(gx, y1, 0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    for (var gy = y0 - y0 % paso; gy <= y1; gy += paso) { var c = S(x0, gy, 0), d = S(x1, gy, 0); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); }
    ctx.stroke();

    // ruta entre islas: discontinua pendiente (con hormigas en marcha), sólida recorrida
    var recorrido = cam.i + (cam.u > .62 && cam.i < N - 1 ? cam.viaje : 0);
    var fase = reducido ? 0 : -(extra.reloj || 0) * 0.02;
    for (var r = 0; r < N - 1; r++) {
      var A = OBJ[r].isla, B = OBJ[r + 1].isla, pa = S(A[0], A[1], 0), pb = S(B[0], B[1], 0);
      ctx.setLineDash([6, 8]); ctx.lineDashOffset = fase; ctx.strokeStyle = "rgba(6,75,174,0.35)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
      var hecho = clamp(recorrido - r, 0, 1);
      if (hecho > 0) {
        var pm = [lerp(pa[0], pb[0], hecho), lerp(pa[1], pb[1], hecho)];
        ctx.strokeStyle = C.blue; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pm[0], pm[1]); ctx.stroke();
        if (hecho < 1) {
          var pulso = reducido ? 0 : (Math.sin((extra.reloj || 0) / 180) + 1) / 2;
          ctx.fillStyle = "rgba(255,23,56," + (.1 + pulso * .1) + ")"; ctx.beginPath(); ctx.arc(pm[0], pm[1], 12 + pulso * 6, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(pm[0], pm[1], 6, 0, Math.PI * 2); ctx.fill();
        }
      }
    }

    // islas, de atrás hacia delante
    islasPantalla = [];
    OBJ.forEach(function (o, j) {
      var X = o.isla[0], Y = o.isla[1], h = LADO / 2;
      var actual = j === cam.i;
      var sobre = extra.hover === j;
      o.alza = reducido ? 0 : lerp(o.alza, sobre ? 1 : 0, .18);
      var dz = o.alza * .12;
      var Sz = function (x, y, zz) { return S(x, y, zz + dz); };

      caja(Sz, X - h, Y - h, 0, LADO, LADO, PLACA, "#ffffff", o.alza > .05 ? "rgba(6,75,174," + (.25 + o.alza * .5) + ")" : C.line);
      islasPantalla.push([Sz(X - h, Y - h, PLACA), Sz(X + h, Y - h, PLACA), Sz(X + h, Y + h, PLACA), Sz(X - h, Y + h, PLACA)]);
      var e = Sz(X - h, Y + h, PLACA);
      ctx.font = "800 " + clamp(cam.z * .17, 9, 13) + "px " + MONO;
      ctx.fillStyle = actual || sobre ? C.blue : C.muted; ctx.textAlign = "left"; ctx.textBaseline = "top";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "1.3px";
      // la etiqueta de la isla actual se oculta mientras su texto está en pantalla
      ctx.globalAlpha = actual && !reducido ? Math.max(cam.general, cam.viaje, 1 - seg(cam.u, 0, .12)) : actual ? 0 : 1;
      if (cam.i === 0 && actual) ctx.globalAlpha = cam.general;
      ctx.fillText(pad(j) + " / " + partirTitulo(o.s.nombre).main.toUpperCase(), e[0] + 8, e[1] + 10);
      if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
      ctx.globalAlpha = 1;

      var montaje;
      if (reducido) montaje = j <= cam.i ? 1 : 0;
      else montaje = j < cam.i || j === 0 ? 1 : j > cam.i ? 0 : seg(cam.u, 0, .5);

      if (montaje <= 0) {
        var hu = o.huella * .9;
        ctx.setLineDash([5, 6]);
        poligono([Sz(X - hu, Y - hu, PLACA), Sz(X + hu, Y - hu, PLACA), Sz(X + hu, Y + hu, PLACA), Sz(X - hu, Y + hu, PLACA)], "rgba(234,242,255,0.6)", "rgba(6,75,174,0.32)", 1.4);
        ctx.setLineDash([]);
        return;
      }

      // pantallas detrás del objeto
      var levantar = reducido ? (j <= cam.i ? 1 : 0) : (j < cam.i ? 1 : j > cam.i ? 0 : seg(cam.u, .3, .6));
      pantallas(o, Sz, cam, levantar, actual || sobre);

      var esc = cam.z * o.k, n = o.s.piezas.length;
      var cs = Sz(X, Y, PLACA), rx = o.huella * cam.z * K * 1.15 + 12, ks = .3 + .7 * easeOut(montaje);
      ctx.save(); ctx.translate(cs[0], cs[1] + rx * .08); ctx.scale(1, .42);
      var gs = ctx.createRadialGradient(0, 0, 0, 0, 0, rx * ks);
      gs.addColorStop(0, "rgba(17,24,32,0.18)"); gs.addColorStop(.6, "rgba(17,24,32,0.07)"); gs.addColorStop(1, "rgba(17,24,32,0)");
      ctx.fillStyle = gs; ctx.beginPath(); ctx.arc(0, 0, rx * ks, 0, Math.PI * 2); ctx.fill(); ctx.restore();

      o.s.piezas.forEach(function (p, k) {
        var q;
        if (montaje >= 1) q = 1;
        else { var pasoP = .7 / n, ini = k * pasoP; q = seg(montaje, ini, ini + .3); }
        if (q <= 0) return;
        var caida = (1 - easeBack(q)) * .9;
        var P = function (x, y, zz) { return Sz(X + (x - o.cx) * o.k, Y + (y - o.cy) * o.k, PLACA + (zz + caida) * o.k); };
        ctx.save();
        ctx.globalAlpha = clamp(q * 2.2, 0, 1) * (p.opacidad != null ? p.opacidad : 1);
        dibujarPieza(p, resolverColor(p.color, o.s.acento), P, esc);
        ctx.restore();
      });
    });

    // velo de papel bajo el texto (escritorio)
    var velo = 1 - cam.general;
    if (!movil && velo > 0) {
      ctx.globalAlpha = velo;
      var vel = ctx.createLinearGradient(0, 0, W * .56, 0);
      vel.addColorStop(0, "rgba(246,248,251,0.97)"); vel.addColorStop(.66, "rgba(246,248,251,0.82)"); vel.addColorStop(1, "rgba(246,248,251,0)");
      ctx.fillStyle = vel; ctx.fillRect(0, 0, W * .56, H);
      ctx.globalAlpha = 1;
    }
    return cam;
  }

  function partirTitulo(nombre) {
    var p = nombre.split(" – ");
    return p.length > 1 ? { pre: p[0], main: p.slice(1).join(" – ") } : { pre: "", main: nombre };
  }

  function dentro(pt, poly) {
    var c = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      if (((poly[i][1] > pt[1]) !== (poly[j][1] > pt[1])) && (pt[0] < (poly[j][0] - poly[i][0]) * (pt[1] - poly[i][1]) / (poly[j][1] - poly[i][1]) + poly[i][0])) c = !c;
    }
    return c;
  }

  window.LitMundo = {
    iniciar: function (data, lienzo, opc) {
      DATA = data; N = data.secciones.length; canvas = lienzo; ctx = canvas.getContext("2d"); opciones = opc || {};
      preparar();
    },
    medir: function (esMovil, menosMovimiento) {
      var r = canvas.getBoundingClientRect();
      movil = esMovil; reducido = menosMovimiento;
      W = r.width; H = r.height; DPR = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
    },
    dibujar: dibujar,
    // índice de la isla bajo el punto (coordenadas del lienzo) o -1; las de delante ganan
    islaEn: function (x, y) {
      for (var j = islasPantalla.length - 1; j >= 0; j--) if (dentro([x, y], islasPantalla[j])) return j;
      return -1;
    },
    animando: function () { return OBJ.some(function (o) { return o.alza > .01 && o.alza < .99; }); },
    partirTitulo: partirTitulo
  };
})();
