/* eunomIA · 02 Faro — generador de avisos de transparencia (art. 50 RIA)
 * Escribe el aviso según el caso, el canal y el tono, lo muestra en contexto
 * y recuerda qué exige la norma. Todo en memoria.
 */
(() => {
  "use strict";
  const X = () => window.EuExportar;
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const CASOS = [
    { id: "chatbot", art: "50.1", nombre: "Chatbot o asistente", sub: "Conversa con personas por texto o voz" },
    { id: "sintetico", art: "50.2", nombre: "Contenido generado", sub: "Imagen, vídeo, audio o texto creados con IA" },
    { id: "deepfake", art: "50.4", nombre: "Ultrasuplantación", sub: "Imita a personas, lugares o hechos reales" },
    { id: "texto", art: "50.4", nombre: "Texto de interés público", sub: "Información publicada para la ciudadanía" },
    { id: "biometria", art: "50.3", nombre: "Emociones o biometría", sub: "Reconocimiento de emociones o categorización" },
    { id: "decisiones", art: "26.11", nombre: "Decisiones con IA", sub: "El sistema decide o ayuda a decidir sobre personas" }
  ];
  const CANALES = [
    ["web", "Web o sede electrónica"], ["chat", "Chat o app"], ["redes", "Redes sociales"],
    ["cartel", "Cartel o presencial"], ["voz", "Teléfono o voz"], ["documento", "Documento o correo"]
  ];
  const MEDIOS = {
    imagen: { et: "Imagen", art: "Esta imagen", min: "esta imagen", pron: "la", gen: "creada" },
    video: { et: "Vídeo", art: "Este vídeo", min: "este vídeo", pron: "lo", gen: "creado" },
    audio: { et: "Audio", art: "Este audio", min: "este audio", pron: "lo", gen: "creado" },
    texto: { et: "Texto", art: "Este texto", min: "este texto", pron: "lo", gen: "creado" }
  };

  const c = {
    caso: "chatbot", canal: "chat", tu: true, org: "", sistema: "", contacto: "", enlace: "",
    medio: "imagen", arte: false, revisado: false, bio: "emociones", finalidad: "",
    humano: true, error: true
  };

  /* ---------- redacción ---------- */
  function redactar() {
    const T = (a, b) => (c.tu ? a : b);
    const org = c.org.trim(), sis = c.sistema.trim(), contacto = c.contacto.trim(), enlace = c.enlace.trim();
    const masInfo = enlace ? `Más información: ${enlace}.` : "";
    const m = MEDIOS[c.medio];
    let v = {};
    if (c.caso === "chatbot") {
      const quien = sis ? `${sis}, un asistente` : "un asistente";
      v.breve = `${T("Estás", "Está")} hablando con un asistente de inteligencia artificial, no con una persona.`;
      v.completo = [
        `${T("Estás", "Está")} hablando con ${quien} de inteligencia artificial${org ? " de " + org : ""}.`,
        c.error && `Sus respuestas se generan de forma automática y pueden contener errores: ${T("comprueba", "compruebe")} la información importante.`,
        c.humano && (contacto ? `Si lo ${T("prefieres", "prefiere")}, ${T("puedes", "puede")} hablar con una persona: ${contacto}.` : `Si lo ${T("prefieres", "prefiere")}, ${T("pide", "pida")} hablar con una persona en cualquier momento.`),
        masInfo].filter(Boolean).join(" ");
      v.etiqueta = "Asistente de IA";
      v.locucion = `Hola. ${T("Te atiende", "Le atiende")} un asistente automático de inteligencia artificial${org ? " de " + org : ""}.` + (c.humano ? ` Si ${T("prefieres", "prefiere")} hablar con una persona, ${T("di", "diga")} «persona» en cualquier momento.` : "");
      v.cartel = { titular: "Este servicio usa un asistente de IA", texto: `Las respuestas las genera un sistema automático${c.error ? " y pueden contener errores" : ""}.` + (c.humano ? ` ${T("Pide", "Pida")} atención personal cuando lo ${T("necesites", "necesite")}${contacto ? ": " + contacto : ""}.` : "") };
    }
    if (c.caso === "sintetico") {
      v.etiqueta = `${m.et} ${m.gen} con IA`;
      v.breve = `${m.art} se ha creado con inteligencia artificial.`;
      v.completo = [
        `${m.art} se ha creado con inteligencia artificial${org ? " por " + org : ""}.`,
        c.revisado && `${org ? "El equipo de " + org : "Una persona de nuestro equipo"} ${m.pron} ha revisado antes de publicar${m.pron}.`,
        masInfo].filter(Boolean).join(" ");
      v.locucion = `${m.art === "Este audio" ? "Este audio" : "El contenido que " + T("vas", "va") + " a escuchar"} se ha creado con inteligencia artificial.`;
      v.cartel = { titular: v.etiqueta, texto: v.completo };
      if (c.medio === "imagen") v.alt = "Imagen creada con inteligencia artificial: [describe aquí lo que se ve].";
    }
    if (c.caso === "deepfake") {
      if (c.arte) {
        v.etiqueta = "Obra creada con IA";
        v.breve = `${m.art} es una obra creativa elaborada con inteligencia artificial.`;
        v.completo = [`${m.art} es una obra creativa elaborada con inteligencia artificial: las personas, voces o situaciones que aparecen no son reales.`, masInfo].filter(Boolean).join(" ");
      } else {
        v.etiqueta = "Contenido manipulado con IA";
        v.breve = `Atención: ${m.min} se ha generado o manipulado con inteligencia artificial.`;
        v.completo = [`Atención: ${m.min} se ha generado o manipulado con inteligencia artificial. Las personas, voces, lugares o hechos que aparecen pueden parecer auténticos, pero no lo son.`, org && `Lo publica ${org}.`, masInfo].filter(Boolean).join(" ");
      }
      v.locucion = `Aviso: el audio que ${T("vas", "va")} a escuchar se ha generado con inteligencia artificial y no es una grabación real.`;
      v.cartel = { titular: v.etiqueta, texto: v.completo };
    }
    if (c.caso === "texto") {
      v.etiqueta = c.revisado ? "Redactado con ayuda de IA" : "Texto generado con IA";
      v.breve = c.revisado ? "Este texto se ha elaborado con ayuda de inteligencia artificial y lo ha revisado una persona." : "Este texto se ha generado con inteligencia artificial.";
      v.completo = [c.revisado
        ? `Este texto se ha elaborado con ayuda de inteligencia artificial. ${org || "Nuestro equipo"} lo ha revisado y asume la responsabilidad editorial de su contenido.`
        : `Este texto se ha generado con inteligencia artificial y no ha pasado por una revisión editorial humana.`, masInfo].filter(Boolean).join(" ");
      v.locucion = `Este contenido se ha ${c.revisado ? "elaborado con ayuda de" : "generado con"} inteligencia artificial.`;
      v.cartel = { titular: v.etiqueta, texto: v.completo };
    }
    if (c.caso === "biometria") {
      const emo = c.bio === "emociones", tipo = emo ? "reconocimiento de emociones" : "categorización biométrica";
      v.etiqueta = emo ? "Reconocimiento de emociones con IA" : "Categorización biométrica con IA";
      v.breve = `Aquí se usa un sistema de inteligencia artificial de ${tipo}.`;
      v.completo = [
        `${org ? org + " utiliza" : "Se utiliza"} un sistema de inteligencia artificial de ${tipo} que analiza ${emo ? "la expresión, la voz o los gestos para inferir emociones" : "rasgos físicos para clasificar a las personas en categorías"}.`,
        `${T("Tus", "Sus")} datos se tratan conforme al Reglamento General de Protección de Datos.`,
        `${T("Puedes", "Puede")} pedir más información y ejercer ${T("tus", "sus")} derechos${contacto ? " en " + contacto : ""}.`,
        masInfo].filter(Boolean).join(" ");
      v.locucion = `${T("Te informamos", "Le informamos")} de que en esta llamada se usa un sistema de inteligencia artificial de ${tipo}.`;
      v.cartel = { titular: emo ? "Zona con reconocimiento de emociones por IA" : "Zona con categorización biométrica por IA", texto: v.completo };
    }
    if (c.caso === "decisiones") {
      const para = c.finalidad.trim() ? " para " + c.finalidad.trim().replace(/\.$/, "") : "";
      v.etiqueta = "Decisión con apoyo de IA";
      v.breve = `En este procedimiento se usa inteligencia artificial${para}.` + (c.humano ? " La decisión final la toma una persona." : "");
      v.completo = [
        `${org ? org + " utiliza" : "Utilizamos"} un sistema de inteligencia artificial${para}.`,
        c.humano && "La decisión final la toma y la revisa una persona.",
        `${T("Tienes", "Tiene")} derecho a recibir una explicación clara del papel del sistema en la decisión que ${T("te", "le")} afecte y a presentar alegaciones o una reclamación${contacto ? ": " + contacto : ""}.`,
        masInfo].filter(Boolean).join(" ");
      v.locucion = `${T("Te informamos", "Le informamos")} de que en este trámite se usa inteligencia artificial${para}.` + (c.humano ? " La decisión final la toma una persona." : "");
      v.cartel = { titular: "Usamos IA en este trámite", texto: v.completo };
    }
    v.html = `<p class="aviso-ia" role="note" style="display:flex;gap:.65em;align-items:flex-start;margin:0 0 1em;padding:.75em 1em;border-left:4px solid #064bae;background:#eaf2ff;color:#111820;font:inherit;line-height:1.45"><strong style="flex:none;font-size:.78em;letter-spacing:.08em">IA</strong><span>${esc(v.completo)}</span></p>`;
    return v;
  }

  const LEGAL = {
    chatbot: { art: "Art. 50.1 RIA", quien: "El proveedor debe diseñar el sistema para que las personas sepan que hablan con una IA. Si integras un asistente de terceros, comprueba que el aviso aparece donde lo usas.", cuando: "Desde el 2 de agosto de 2026.", exc: "No hace falta si es evidente para una persona razonablemente informada, ni en sistemas autorizados por ley para detectar o investigar delitos." },
    sintetico: { art: "Art. 50.2 RIA", quien: "El proveedor debe marcar los resultados en un formato legible por máquina (metadatos, marca de agua). Para quien publica, etiquetar el contenido es una buena práctica, y es obligatorio si es una ultrasuplantación.", cuando: "Desde el 2 de agosto de 2026. Los sistemas comercializados antes de esa fecha tienen hasta el 2 de diciembre de 2026.", exc: "No se aplica a funciones de edición asistida que no alteran sustancialmente el contenido." },
    deepfake: { art: "Art. 50.4 RIA (párrafo primero)", quien: "Quien despliega el sistema y publica el contenido debe revelar que se ha generado o manipulado.", cuando: "Desde el 2 de agosto de 2026.", exc: "En obras artísticas, creativas, satíricas o de ficción basta con revelarlo de forma que no estropee la obra." },
    texto: { art: "Art. 50.4 RIA (párrafo segundo)", quien: "Quien publica el texto para informar al público sobre asuntos de interés público debe revelar que se ha generado o manipulado con IA.", cuando: "Desde el 2 de agosto de 2026.", exc: "No es obligatorio si hubo revisión humana o control editorial y alguien asume la responsabilidad editorial. Aun así, avisar suma confianza." },
    biometria: { art: "Art. 50.3 RIA y RGPD", quien: "Quien despliega el sistema debe informar a las personas expuestas y tratar sus datos conforme al RGPD.", cuando: "Desde el 2 de agosto de 2026.", exc: "Ojo: reconocer emociones en el trabajo o en centros educativos está prohibido (art. 5.1.f), y deducir datos sensibles por biometría también (art. 5.1.g). Los datos biométricos son categorías especiales del RGPD (art. 9)." },
    decisiones: { art: "Arts. 26.11 y 86 RIA · art. 22 RGPD", quien: "Quien despliega un sistema de alto riesgo del Anexo III que decide o ayuda a decidir sobre personas debe informarlas, y explicar el papel del sistema si lo piden. En la administración, además, el art. 41 de la Ley 40/2015 regula la actuación administrativa automatizada.", cuando: "Obligatorio para alto riesgo desde el 2 de diciembre de 2027; el RGPD ya se aplica.", exc: "Fuera del alto riesgo no es obligatorio por el RIA, pero es la mejor forma de cumplir el deber de información del RGPD." }
  };

  /* ---------- vistas previas ---------- */
  function vista(v) {
    const org = esc(c.org.trim() || "Tu organización"), ini = esc((c.org.trim() || "T").charAt(0).toUpperCase());
    switch (c.canal) {
      case "chat": return `<div class="fr-mock fr-chat">
        <div class="fr-chat-top"><span class="fr-avatar">${ini}</span><b>${esc(c.sistema.trim() || "Asistente")}</b><em>IA</em></div>
        <div class="fr-chat-cuerpo"><p class="fr-burbuja fr-burbuja-ia"><small>Aviso</small>${esc(v.completo)}</p><p class="fr-burbuja fr-burbuja-yo">${c.tu ? "Hola, tengo una duda con mi solicitud" : "Buenos días, tengo una consulta sobre mi solicitud"}</p></div>
        <div class="fr-chat-input"><span>${c.tu ? "Escribe tu mensaje…" : "Escriba su mensaje…"}</span><i></i></div></div>`;
      case "redes": return `<div class="fr-mock fr-redes">
        <div class="fr-redes-top"><span class="fr-avatar">${ini}</span><b>${org}</b><em>· ahora</em></div>
        <div class="fr-redes-img"><span class="fr-sello">${esc(v.etiqueta)}</span></div>
        <p>${esc(v.breve)} <span>#IA #Transparencia</span></p></div>`;
      case "cartel": return `<div class="fr-mock fr-cartel"><span class="fr-cartel-ia">IA</span><h4>${esc(v.cartel.titular)}</h4><p>${esc(v.cartel.texto)}</p><footer>${org}<i>Art. 50 RIA</i></footer></div>`;
      case "voz": return `<div class="fr-mock fr-voz"><div class="fr-onda" aria-hidden="true">${Array.from({ length: 28 }, (_, i) => `<i style="--h:${20 + Math.round(Math.abs(Math.sin(i * 1.7)) * 70)}%"></i>`).join("")}</div><p class="fr-voz-txt">«${esc(v.locucion)}»</p><span class="fr-voz-meta">LOCUCIÓN · ${Math.max(3, Math.round(v.locucion.split(/\s+/).length / 2.6))} s aprox.</span></div>`;
      case "documento": return `<div class="fr-mock fr-doc"><p class="fr-doc-asunto"><b>Asunto:</b> Información sobre su ${c.caso === "decisiones" ? "solicitud" : "consulta"}</p><p class="fr-doc-linea"></p><p class="fr-doc-linea fr-corta"></p><div class="fr-doc-aviso">${esc(v.completo)}</div><p class="fr-doc-linea"></p><p class="fr-doc-firma">${org}</p></div>`;
      default: return `<div class="fr-mock fr-web"><div class="fr-web-barra"><i></i><i></i><i></i><span>${esc((c.enlace.trim() || "sede.ejemplo.es").replace(/^https?:\/\//, "").split("/")[0])}</span></div>
        <div class="fr-web-cuerpo"><p class="fr-web-titulo">${org}</p><div class="fr-web-aviso"><b>IA</b><span>${esc(v.completo)}</span></div><p class="fr-doc-linea"></p><p class="fr-doc-linea fr-corta"></p></div></div>`;
    }
  }

  /* ---------- interfaz ---------- */
  let raiz;
  function campos() {
    const extra = {
      sintetico: `<fieldset class="fr-fila"><legend>Tipo de contenido</legend>${Object.entries(MEDIOS).map(([k, m]) => `<label class="fr-chip"><input type="radio" name="medio" value="${k}"${c.medio === k ? " checked" : ""}><span>${m.et}</span></label>`).join("")}</fieldset>
        <label class="fr-check"><input type="checkbox" name="revisado"${c.revisado ? " checked" : ""}><span>Lo ha revisado una persona antes de publicarlo</span></label>`,
      deepfake: `<fieldset class="fr-fila"><legend>Tipo de contenido</legend>${["imagen", "video", "audio"].map((k) => `<label class="fr-chip"><input type="radio" name="medio" value="${k}"${c.medio === k ? " checked" : ""}><span>${MEDIOS[k].et}</span></label>`).join("")}</fieldset>
        <label class="fr-check"><input type="checkbox" name="arte"${c.arte ? " checked" : ""}><span>Es una obra artística, satírica o de ficción</span></label>`,
      texto: `<label class="fr-check"><input type="checkbox" name="revisado"${c.revisado ? " checked" : ""}><span>Hay revisión humana y alguien asume la responsabilidad editorial</span></label>`,
      biometria: `<fieldset class="fr-fila"><legend>Qué hace el sistema</legend><label class="fr-chip"><input type="radio" name="bio" value="emociones"${c.bio === "emociones" ? " checked" : ""}><span>Reconoce emociones</span></label><label class="fr-chip"><input type="radio" name="bio" value="categorizacion"${c.bio === "categorizacion" ? " checked" : ""}><span>Categoriza por biometría</span></label></fieldset>`,
      decisiones: `<label class="fr-campo"><span>¿Para qué se usa la IA?</span><input type="text" name="finalidad" value="${esc(c.finalidad)}" maxlength="140" placeholder="Ej.: ordenar las solicitudes por prioridad"></label>
        <label class="fr-check"><input type="checkbox" name="humano"${c.humano ? " checked" : ""}><span>La decisión final la toma una persona</span></label>`,
      chatbot: `<label class="fr-check"><input type="checkbox" name="humano"${c.humano ? " checked" : ""}><span>Ofrecer hablar con una persona</span></label>
        <label class="fr-check"><input type="checkbox" name="error"${c.error ? " checked" : ""}><span>Avisar de que puede equivocarse</span></label>`
    }[c.caso] || "";
    return extra;
  }

  function pintar() {
    raiz.innerHTML = `<div class="fr-marco">
      <form class="fr-config" autocomplete="off">
        <p class="fr-paso"><b>1</b> ¿Qué tienes que avisar?</p>
        <div class="fr-casos">${CASOS.map((k) => `<label class="fr-caso"><input type="radio" name="caso" value="${k.id}"${c.caso === k.id ? " checked" : ""}><span class="fr-caso-art">${k.art}</span><span class="fr-caso-txt"><b>${k.nombre}</b><small>${k.sub}</small></span></label>`).join("")}</div>
        <div class="fr-extra">${campos()}</div>
        <p class="fr-paso"><b>2</b> ¿Dónde se verá?</p>
        <div class="fr-canales">${CANALES.map(([k, t]) => `<label class="fr-chip"><input type="radio" name="canal" value="${k}"${c.canal === k ? " checked" : ""}><span>${t}</span></label>`).join("")}</div>
        <p class="fr-paso"><b>3</b> Tono y datos</p>
        <div class="fr-tono" role="radiogroup" aria-label="Tratamiento"><label><input type="radio" name="tu" value="1"${c.tu ? " checked" : ""}><span>Tú</span></label><label><input type="radio" name="tu" value="0"${!c.tu ? " checked" : ""}><span>Usted</span></label></div>
        <div class="fr-datos">
          <label class="fr-campo"><span>Organización</span><input type="text" name="org" value="${esc(c.org)}" maxlength="90" placeholder="Ej.: Ayuntamiento de Ejemplo"></label>
          <label class="fr-campo"><span>Nombre del sistema <em>opcional</em></span><input type="text" name="sistema" value="${esc(c.sistema)}" maxlength="60" placeholder="Ej.: Lúa"></label>
          <label class="fr-campo"><span>Contacto con una persona <em>opcional</em></span><input type="text" name="contacto" value="${esc(c.contacto)}" maxlength="120" placeholder="Ej.: 010 o atencion@ejemplo.es"></label>
          <label class="fr-campo"><span>Enlace a más información <em>opcional</em></span><input type="text" name="enlace" value="${esc(c.enlace)}" maxlength="160" placeholder="Ej.: ejemplo.es/ia"></label>
        </div>
      </form>
      <div class="fr-salida" aria-live="polite"></div>
    </div>`;
    const form = raiz.querySelector(".fr-config");
    form.addEventListener("input", (e) => leer(form, e));
    form.addEventListener("change", (e) => leer(form, e));
    salida();
  }

  function leer(form, e) {
    const fd = new FormData(form), casoAntes = c.caso;
    c.caso = fd.get("caso"); c.canal = fd.get("canal"); c.tu = fd.get("tu") === "1";
    ["org", "sistema", "contacto", "enlace"].forEach((k) => { c[k] = fd.get(k) || ""; });
    if (c.caso !== casoAntes) {
      // valores por defecto razonables al cambiar de caso
      if (c.caso === "chatbot") { c.humano = true; c.error = true; if (c.canal === "redes") c.canal = "chat"; }
      if (c.caso === "decisiones") { c.humano = true; c.canal = c.canal === "redes" ? "documento" : c.canal; }
      if (c.caso === "deepfake" && c.medio === "texto") c.medio = "video";
      if (c.caso === "sintetico" || c.caso === "deepfake") { if (c.canal === "chat" || c.canal === "voz") c.canal = "redes"; }
      if (c.caso === "texto") { c.medio = "texto"; if (c.canal === "chat" || c.canal === "voz") c.canal = "web"; }
      raiz.querySelector(".fr-extra").innerHTML = campos();
      raiz.querySelectorAll('input[name="canal"]').forEach((i) => { i.checked = i.value === c.canal; });
    } else {
      if (fd.has("medio")) c.medio = fd.get("medio");
      if (fd.has("bio")) c.bio = fd.get("bio");
      if (form.querySelector('[name="finalidad"]')) c.finalidad = fd.get("finalidad") || "";
      ["revisado", "arte", "humano", "error"].forEach((k) => { if (form.querySelector(`[name="${k}"]`)) c[k] = fd.has(k); });
    }
    salida();
  }

  function salida() {
    const v = redactar(), L = LEGAL[c.caso];
    const piezas = [
      ["breve", "Aviso breve", v.breve],
      ["completo", "Aviso completo", v.completo],
      ["etiqueta", "Etiqueta", v.etiqueta],
      v.alt && ["alt", "Texto alternativo", v.alt],
      ["locucion", "Locución", v.locucion],
      ["cartel", "Cartel", v.cartel.titular + "\n" + v.cartel.texto],
      ["html", "Código HTML para tu web", v.html]
    ].filter(Boolean);
    const prioridad = { chat: "completo", web: "completo", redes: "etiqueta", cartel: "cartel", voz: "locucion", documento: "completo" }[c.canal];
    piezas.sort((a, b) => (b[0] === prioridad) - (a[0] === prioridad));
    const caja = raiz.querySelector(".fr-salida");
    caja.innerHTML = `<div class="fr-vista"><p class="fr-vista-tit">VISTA PREVIA · ${esc(CANALES.find((x) => x[0] === c.canal)[1].toUpperCase())}</p>${vista(v)}</div>
      ${c.caso === "biometria" ? `<p class="fr-alerta"><b>Antes de avisar, comprueba que es legal.</b> ${esc(L.exc)}</p>` : ""}
      <div class="fr-piezas">${piezas.map(([k, t, txt]) => `<article class="fr-pieza${k === prioridad ? " is-principal" : ""}${k === "html" ? " fr-pieza-codigo" : ""}">
        <header><span>${esc(t)}</span><button type="button" class="fr-copiar" data-k="${k}">Copiar</button></header>
        ${k === "html" ? `<pre><code>${esc(txt)}</code></pre>` : `<p>${esc(txt).replace(/\n/g, "<br>")}</p>`}</article>`).join("")}</div>
      <div class="fr-legal">
        <p class="fr-legal-art">${esc(L.art)}</p>
        <dl><div><dt>Quién</dt><dd>${esc(L.quien)}</dd></div><div><dt>Cuándo</dt><dd>${esc(L.cuando)}</dd></div><div><dt>Cómo</dt><dd>De forma clara y distinguible, accesible para personas con discapacidad y, como tarde, en la primera interacción o exposición (art. 50.5).</dd></div>${c.caso !== "biometria" ? `<div><dt>Excepciones</dt><dd>${esc(L.exc)}</dd></div>` : ""}</dl>
        <button type="button" class="button bz-boton-borde fr-todo">Descargar todos los textos (.txt)</button>
      </div>`;
    const textos = Object.fromEntries(piezas.map((p) => [p[0], p[2]]));
    caja.querySelectorAll(".fr-copiar").forEach((b) => b.addEventListener("click", () => X().copiar(textos[b.dataset.k])));
    caja.querySelector(".fr-todo").addEventListener("click", () => {
      const txt = `AVISOS DE TRANSPARENCIA · eunomIA (CibersegurIA)\nCaso: ${CASOS.find((k) => k.id === c.caso).nombre} · ${L.art}\nGenerado el ${X().hoy()}\n\n` + piezas.map((p) => `— ${p[1].toUpperCase()} —\n${p[2]}\n`).join("\n") + `\nQuién: ${L.quien}\nCuándo: ${L.cuando}\nExcepciones: ${L.exc}\n\nTextos orientativos. Revísalos con tu servicio jurídico o tu delegado de protección de datos.\n`;
      X().descargar(`eunomia-faro-avisos-${X().hoyArchivo()}.txt`, txt);
      X().avisar("Textos descargados.");
    });
  }

  function iniciar() { raiz = document.getElementById("faro-app"); if (raiz) pintar(); }
  function preseleccionar(caso) {
    const mapa = { chatbot: "chatbot", sintetico: "sintetico", emociones: "biometria", deepfake: "deepfake", texto: "texto" };
    if (!raiz || !mapa[caso]) return;
    c.caso = mapa[caso];
    c.canal = { chatbot: "chat", sintetico: "redes", biometria: "cartel", deepfake: "redes", texto: "web" }[c.caso];
    if (c.caso === "texto") c.medio = "texto";
    if (c.caso === "deepfake" && c.medio === "texto") c.medio = "video";
    pintar();
  }
  window.EuFaro = { iniciar, preseleccionar, _c: c, _redactar: redactar };
})();
