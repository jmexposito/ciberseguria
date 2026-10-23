/* eunomIA · exportar
 * Utilidades compartidas: copiar al portapapeles, descargar texto, imprimir
 * a PDF con el diálogo del navegador y generar un .docx de verdad sin
 * librerías (ZIP sin compresión + WordprocessingML mínimo).
 * Nada sale del navegador: los archivos se crean en memoria y se descargan.
 *
 * Formato de bloques que entienden docx() e imprimir():
 *   { t: "titulo" | "h1" | "h2" | "p" | "li" | "nota" | "meta" | "sep", x: "texto" }
 * Dentro del texto: **negrita** y [HUECO A RELLENAR] (se resalta en amarillo).
 */
(function () {
  "use strict";

  /* ---------- avisos ---------- */
  var temporizador;
  function avisar(msg) {
    var el = document.getElementById("eu-aviso");
    if (!el) return;
    el.textContent = msg; el.classList.add("is-visible");
    clearTimeout(temporizador); temporizador = setTimeout(function () { el.classList.remove("is-visible"); }, 2600);
  }

  function copiar(texto) {
    var hecho = function () { avisar("Copiado al portapapeles."); };
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(texto).then(hecho, function () { copiarViejo(texto); hecho(); });
    }
    copiarViejo(texto); hecho();
    return Promise.resolve();
  }
  function copiarViejo(texto) {
    var t = document.createElement("textarea");
    t.value = texto; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
    document.body.appendChild(t); t.select();
    try { document.execCommand("copy"); } catch (e) { /* sin portapapeles */ }
    t.remove();
  }

  function descargar(nombre, contenido, tipo) {
    var blob = contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo || "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = nombre; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 1500);
  }

  function hoy() {
    var d = new Date();
    return String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
  }
  function hoyArchivo() { var d = new Date(); return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0"); }

  /* ---------- texto con marcas → trozos ---------- */
  function trozos(texto) {
    var out = [], re = /(\*\*[^*]+\*\*|\[[^\]]+\])/g, i = 0, m;
    while ((m = re.exec(texto))) {
      if (m.index > i) out.push({ x: texto.slice(i, m.index) });
      var v = m[0];
      if (v.charAt(0) === "*") out.push({ x: v.slice(2, -2), b: true });
      else out.push({ x: v, h: true });
      i = m.index + v.length;
    }
    if (i < texto.length) out.push({ x: texto.slice(i) });
    return out;
  }
  function escHtml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function htmlEnLinea(texto) {
    return trozos(texto).map(function (t) {
      var x = escHtml(t.x);
      return t.b ? "<strong>" + x + "</strong>" : t.h ? "<mark>" + x + "</mark>" : x;
    }).join("");
  }
  function textoPlano(bloques) {
    return bloques.map(function (b) {
      var x = (b.x || "").replace(/\*\*/g, "");
      if (b.t === "titulo") return x.toUpperCase() + "\n";
      if (b.t === "h1") return "\n" + x.toUpperCase();
      if (b.t === "h2") return "\n" + x;
      if (b.t === "li") return "  • " + x;
      if (b.t === "sep") return "";
      return x;
    }).join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
  }

  /* ---------- PDF: se imprime solo el documento ---------- */
  function imprimir(bloques, titulo) {
    var caja = document.getElementById("eu-impresion");
    if (!caja) return;
    caja.innerHTML = bloques.map(function (b) {
      var x = htmlEnLinea(b.x || "");
      switch (b.t) {
        case "titulo": return "<h1>" + x + "</h1>";
        case "h1": return "<h2>" + x + "</h2>";
        case "h2": return "<h3>" + x + "</h3>";
        case "li": return "<p class=\"li\">" + x + "</p>";
        case "nota": return "<p class=\"nota\">" + x + "</p>";
        case "meta": return "<p class=\"meta\">" + x + "</p>";
        case "sep": return "<hr>";
        default: return "<p>" + x + "</p>";
      }
    }).join("") + "<p class=\"pie\">eunomIA · CibersegurIA · ciberseguria.com · Documento orientativo generado el " + hoy() + ". No sustituye al asesoramiento jurídico.</p>";
    var tituloPrevio = document.title;
    if (titulo) document.title = titulo;
    document.documentElement.classList.add("eu-imprimiendo");
    var fin = function () {
      document.documentElement.classList.remove("eu-imprimiendo");
      document.title = tituloPrevio;
      window.removeEventListener("afterprint", fin);
    };
    window.addEventListener("afterprint", fin);
    setTimeout(function () { window.print(); setTimeout(fin, 400); }, 60);
  }

  /* ---------- DOCX ---------- */
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }

  function zip(archivos) {
    var enc = new TextEncoder(), partes = [], central = [], offset = 0;
    var d = new Date(), hora = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var fecha = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    archivos.forEach(function (f) {
      var nombre = enc.encode(f.nombre), datos = enc.encode(f.datos), crc = crc32(datos);
      var lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, hora, true); lh.setUint16(12, fecha, true); lh.setUint32(14, crc, true);
      lh.setUint32(18, datos.length, true); lh.setUint32(22, datos.length, true); lh.setUint16(26, nombre.length, true); lh.setUint16(28, 0, true);
      partes.push(new Uint8Array(lh.buffer), nombre, datos);
      var ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, hora, true); ch.setUint16(14, fecha, true); ch.setUint32(16, crc, true);
      ch.setUint32(20, datos.length, true); ch.setUint32(24, datos.length, true); ch.setUint16(28, nombre.length, true);
      ch.setUint16(30, 0, true); ch.setUint16(32, 0, true); ch.setUint16(34, 0, true); ch.setUint16(36, 0, true); ch.setUint32(38, 0, true); ch.setUint32(42, offset, true);
      central.push(new Uint8Array(ch.buffer), nombre);
      offset += 30 + nombre.length + datos.length;
    });
    var tamCentral = central.reduce(function (s, p) { return s + p.length; }, 0);
    var fin = new DataView(new ArrayBuffer(22));
    fin.setUint32(0, 0x06054b50, true); fin.setUint16(4, 0, true); fin.setUint16(6, 0, true);
    fin.setUint16(8, archivos.length, true); fin.setUint16(10, archivos.length, true);
    fin.setUint32(12, tamCentral, true); fin.setUint32(16, offset, true); fin.setUint16(20, 0, true);
    return new Blob(partes.concat(central, [new Uint8Array(fin.buffer)]), { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
  }

  function escXml(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ""); }
  function runs(texto, base) {
    return trozos(texto).map(function (t) {
      var pr = (base || "") + (t.b ? "<w:b/>" : "") + (t.h ? "<w:highlight w:val=\"yellow\"/>" : "");
      return "<w:r>" + (pr ? "<w:rPr>" + pr + "</w:rPr>" : "") + "<w:t xml:space=\"preserve\">" + escXml(t.x) + "</w:t></w:r>";
    }).join("");
  }
  function parrafo(b) {
    var est = { titulo: "Title", h1: "Heading1", h2: "Heading2", li: "Lista", nota: "Nota", meta: "Meta" }[b.t];
    var x = b.t === "li" ? "•\t" + b.x : b.x || "";
    if (b.t === "sep") return "<w:p><w:pPr><w:pBdr><w:bottom w:val=\"single\" w:sz=\"6\" w:space=\"1\" w:color=\"D8DEE7\"/></w:pBdr></w:pPr></w:p>";
    return "<w:p>" + (est ? "<w:pPr><w:pStyle w:val=\"" + est + "\"/></w:pPr>" : "") + runs(x) + "</w:p>";
  }
  var ESTILOS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="21"/><w:szCs w:val="21"/><w:lang w:val="es-ES"/></w:rPr></w:rPrDefault>' +
    '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="288" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>' +
    '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:qFormat/><w:pPr><w:spacing w:after="80"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial Narrow" w:hAnsi="Arial Narrow"/><w:b/><w:caps/><w:color w:val="052F70"/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="320" w:after="120"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:rFonts w:ascii="Arial Narrow" w:hAnsi="Arial Narrow"/><w:b/><w:caps/><w:color w:val="064BAE"/><w:sz w:val="28"/><w:szCs w:val="28"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/><w:pPr><w:keepNext/><w:spacing w:before="200" w:after="80"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="111820"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Lista"><w:name w:val="Lista eunomIA"/><w:basedOn w:val="Normal"/><w:pPr><w:tabs><w:tab w:val="left" w:pos="360"/></w:tabs><w:spacing w:after="60"/><w:ind w:left="360" w:hanging="360"/></w:pPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Nota"><w:name w:val="Nota eunomIA"/><w:basedOn w:val="Normal"/><w:pPr><w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="FFE500"/></w:pBdr><w:ind w:left="200"/></w:pPr><w:rPr><w:color w:val="56616F"/><w:sz w:val="18"/><w:szCs w:val="18"/></w:rPr></w:style>' +
    '<w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta eunomIA"/><w:basedOn w:val="Normal"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:caps/><w:color w:val="064BAE"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr></w:style>' +
    '</w:styles>';

  function docx(bloques, nombreArchivo, titulo) {
    var pie = { t: "nota", x: "Generado con eunomIA (CibersegurIA · ciberseguria.com) el " + hoy() + ". Documento orientativo: revísalo con tu servicio jurídico antes de usarlo." };
    var cuerpo = bloques.concat([{ t: "sep" }, pie]).map(parrafo).join("");
    var doc = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><w:body>' + cuerpo +
      '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1418" w:right="1304" w:bottom="1418" w:left="1304" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
    var ahora = new Date().toISOString().replace(/\.\d+Z$/, "Z");
    var archivos = [
      { nombre: "[Content_Types].xml", datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>' },
      { nombre: "_rels/.rels", datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>' },
      { nombre: "docProps/core.xml", datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>' + escXml(titulo || "eunomIA") + '</dc:title><dc:creator>eunomIA · CibersegurIA</dc:creator><dc:language>es-ES</dc:language><dcterms:created xsi:type="dcterms:W3CDTF">' + ahora + '</dcterms:created></cp:coreProperties>' },
      { nombre: "word/_rels/document.xml.rels", datos: '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>' },
      { nombre: "word/styles.xml", datos: ESTILOS },
      { nombre: "word/document.xml", datos: doc }
    ];
    descargar(nombreArchivo, zip(archivos));
    avisar("Documento Word descargado.");
  }

  window.EuExportar = {
    avisar: avisar, copiar: copiar, descargar: descargar, imprimir: imprimir, docx: docx,
    textoPlano: textoPlano, htmlEnLinea: htmlEnLinea, escHtml: escHtml, hoy: hoy, hoyArchivo: hoyArchivo
  };
})();
