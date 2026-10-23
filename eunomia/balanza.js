/* eunomIA · 01 Balanza — clasificador de riesgo y rol según el RIA
 * Reglamento (UE) 2024/1689 con los cambios del Reglamento (UE) 2026/1744 (Ómnibus).
 * Todo ocurre en memoria: no hay envío ni almacenamiento.
 */
(() => {
  "use strict";
  const X = () => window.EuExportar;
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  /* ======================= DATOS ======================= */
  const SECTORES = [
    ["publico", "Administración u organismo público"],
    ["privado", "Empresa privada"],
    ["tercer", "Entidad sin ánimo de lucro"],
    ["otro", "Otro"]
  ];

  const AREAS = [
    { id: "1", nombre: "Biometría", usos: [
      ["1a", "Identificación biométrica remota", "No incluye la verificación de que alguien es quien dice ser (por ejemplo, desbloquear un dispositivo)."],
      ["1b", "Categorización biométrica según atributos sensibles o protegidos", "Basada en inferir esos atributos a partir de datos biométricos."],
      ["1c", "Reconocimiento de emociones", "Fuera del trabajo y de la educación, donde está prohibido."]] },
    { id: "2", nombre: "Infraestructuras críticas", usos: [
      ["2a", "Componente de seguridad de una infraestructura crítica", "Infraestructura digital crítica, tráfico rodado o suministro de agua, gas, calefacción o electricidad."]] },
    { id: "3", nombre: "Educación y formación profesional", usos: [
      ["3a", "Decidir el acceso, la admisión o la asignación a centros", ""],
      ["3b", "Evaluar resultados de aprendizaje u orientar el aprendizaje", ""],
      ["3c", "Determinar el nivel educativo que recibirá o al que accederá una persona", ""],
      ["3d", "Vigilar y detectar conductas prohibidas en exámenes", ""]] },
    { id: "4", nombre: "Empleo y gestión de trabajadores", usos: [
      ["4a", "Selección de personal", "Anuncios de empleo dirigidos, filtrado de candidaturas o evaluación de candidatos."],
      ["4b", "Decisiones laborales o evaluación de trabajadores", "Condiciones, promoción, despido, reparto de tareas según conducta o rasgos, o supervisión del rendimiento."]] },
    { id: "5", nombre: "Servicios y prestaciones esenciales", usos: [
      ["5a", "Prestaciones y servicios públicos esenciales", "Por o para una administración: decidir si alguien tiene derecho, concederlos, reducirlos, retirarlos o reclamarlos (incluidos los sanitarios)."],
      ["5b", "Solvencia o calificación crediticia de personas físicas", "Salvo la detección de fraude financiero."],
      ["5c", "Riesgos y precios en seguros de vida y de salud", ""],
      ["5d", "Emergencias", "Clasificar llamadas, despachar o priorizar servicios de emergencia, o triaje de pacientes."]] },
    { id: "6", nombre: "Garantía del cumplimiento del Derecho", usos: [
      ["6a", "Uso por autoridades policiales o en su nombre", "Riesgo de ser víctima, polígrafos, fiabilidad de pruebas, riesgo de delinquir o reincidir, o perfiles en investigaciones."]] },
    { id: "7", nombre: "Migración, asilo y fronteras", usos: [
      ["7a", "Gestión de migración, asilo o fronteras", "Polígrafos, evaluación de riesgos, examen de solicitudes de asilo, visado o residencia, o detección e identificación de personas."]] },
    { id: "8", nombre: "Justicia y procesos democráticos", usos: [
      ["8a", "Ayudar a jueces o a la resolución alternativa de litigios", "Investigar e interpretar hechos y Derecho, o aplicar la ley a unos hechos."],
      ["8b", "Influir en elecciones, referéndums o en el voto", "No incluye herramientas logísticas de campaña cuyos resultados no llegan a las personas."]] }
  ];
  const USOS = Object.fromEntries(AREAS.flatMap((a) => a.usos.map((u) => [u[0], { area: a.id, areaNombre: a.nombre, txt: u[1] }])));

  const PRACTICAS = ["manipulacion", "vulnerabilidad", "intimo", "puntuacion", "prediccion", "scraping", "emociones", "biometria", "rbi"];

  const PASOS = [
    { id: "sistema", corto: "Tu sistema", tipo: "sistema",
      pregunta: "¿Qué sistema quieres analizar?",
      ayuda: "El nombre solo sirve para el informe. El sector cambia algunas obligaciones, sobre todo en la administración pública." },

    { id: "esIA", corto: "¿Es IA?", tipo: "unica",
      pregunta: "¿Encaja en la definición de sistema de IA del Reglamento?",
      ayuda: "El RIA (art. 3.1) llama sistema de IA a un sistema basado en máquinas que funciona con cierta autonomía y que, a partir de los datos que recibe, **infiere** cómo generar resultados —predicciones, contenidos, recomendaciones o decisiones— que pueden influir en entornos físicos o virtuales. La clave es la inferencia: aprender o razonar a partir de datos, no solo ejecutar reglas escritas por personas.",
      opciones: [
        ["si", "Sí", "Usa aprendizaje automático, un modelo de lenguaje (LLM), visión artificial u otra técnica que infiere a partir de datos."],
        ["no", "No", "Solo aplica reglas, fórmulas o flujos definidos por personas, como una hoja de cálculo o un árbol de decisión fijo."],
        ["nose", "No lo sé", "Seguimos como si lo fuera y lo marcamos para revisar."]] },

    { id: "exclusiones", corto: "Exclusiones", tipo: "multiple", exclusivos: ["ninguna"],
      pregunta: "¿Se da alguno de estos casos?",
      ayuda: "El RIA no se aplica en estos supuestos (art. 2). Si ninguno encaja, marca «Ninguno de estos casos».",
      opciones: [
        ["militar", "Uso exclusivamente militar, de defensa o de seguridad nacional", ""],
        ["investigacion", "Solo para investigación y desarrollo científico", "Desarrollado y puesto en servicio con ese único fin."],
        ["pruebas", "Investigación, pruebas o desarrollo previos a su comercialización", "Aún no está en el mercado ni en servicio. Las pruebas en condiciones reales sí están reguladas."],
        ["personal", "Uso personal no profesional", "Lo usa una persona en su vida privada."],
        ["ninguna", "Ninguno de estos casos", ""]] },

    { id: "rol", corto: "Tu papel", tipo: "multiple",
      pregunta: "¿Qué papel tienes respecto a este sistema?",
      ayuda: "Puedes marcar más de uno: un ayuntamiento que desarrolla una herramienta y la usa es proveedor y responsable del despliegue a la vez.",
      opciones: [
        ["proveedor", "Proveedor", "Lo desarrollo o lo encargo, y lo comercializo o pongo en servicio con mi nombre o marca (también para uso propio). Art. 3.3."],
        ["despliegue", "Responsable del despliegue", "Lo uso bajo mi autoridad en mi actividad profesional o institucional. Art. 3.4."],
        ["importador", "Importador", "Traigo a la UE un sistema con el nombre o la marca de alguien establecido fuera de la UE. Art. 3.6."],
        ["distribuidor", "Distribuidor", "Lo comercializo sin ser proveedor ni importador. Art. 3.7."]] },

    { id: "prohibidas", corto: "Prohibiciones", tipo: "multiple", exclusivos: ["ninguna", "nose"],
      pregunta: "¿El sistema hace alguna de estas cosas?",
      ayuda: "Son las prácticas del artículo 5. Están prohibidas desde el 2 de febrero de 2025; las dos que añade el Ómnibus, desde el 2 de diciembre de 2026. Algunas tienen excepciones muy tasadas.",
      opciones: [
        ["manipulacion", "Manipula o engaña", "Técnicas subliminales, manipuladoras o engañosas que alteran el comportamiento y pueden causar un perjuicio considerable. Art. 5.1.a."],
        ["vulnerabilidad", "Explota vulnerabilidades", "Aprovecha la edad, una discapacidad o la situación social o económica para alterar el comportamiento con riesgo de perjuicio. Art. 5.1.b."],
        ["intimo", "Genera contenido sexual no consentido o de abuso infantil", "Imágenes, vídeo o audio íntimos o sexualmente explícitos de personas identificables sin su consentimiento, o material de abuso sexual infantil. Art. 5.1.ba y bb, desde el 2/12/2026."],
        ["puntuacion", "Puntuación social", "Clasifica a personas por su conducta social o rasgos personales con un trato perjudicial injustificado o en contextos ajenos. Art. 5.1.c."],
        ["prediccion", "Predice delitos por perfil", "Valora el riesgo de que alguien cometa un delito basándose solo en su perfil o rasgos de personalidad. Art. 5.1.d."],
        ["scraping", "Bases de datos faciales por rastreo masivo", "Crea o amplía bases de reconocimiento facial con imágenes extraídas sin selección de internet o de cámaras. Art. 5.1.e."],
        ["emociones", "Emociones en el trabajo o en clase", "Infiere emociones en el lugar de trabajo o en centros educativos, salvo por motivos médicos o de seguridad. Art. 5.1.f."],
        ["biometria", "Categorización biométrica sensible", "Deduce origen racial, opiniones políticas, afiliación sindical, religión, vida sexual u orientación sexual a partir de datos biométricos. Art. 5.1.g."],
        ["rbi", "Identificación biométrica en tiempo real con fines policiales", "En espacios de acceso público, salvo excepciones tasadas y con autorización. Art. 5.1.h."],
        ["ninguna", "Ninguna de estas", ""],
        ["nose", "No estoy seguro", "Seguimos y lo marcamos para revisar."]] },

    { id: "anexo1", corto: "Productos", tipo: "unica",
      pregunta: "¿Es un producto regulado, o el componente de seguridad de uno, que exige evaluación de conformidad por un tercero?",
      ayuda: "Es la vía del Anexo I (art. 6.1): productos sanitarios y de diagnóstico in vitro, juguetes, ascensores, equipos radioeléctricos, equipos a presión, vehículos, aviación civil o embarcaciones, entre otros. Tras el Ómnibus, la maquinaria queda en gran parte fuera, y un sistema que solo asiste u optimiza no es componente de seguridad si su fallo no crea riesgos para la salud o la seguridad.",
      opciones: [
        ["si", "Sí", "Forma parte de un producto regulado y su fallo afecta a la seguridad."],
        ["no", "No", "No va integrado en un producto de esa lista."],
        ["nose", "No lo sé", "Lo marcamos para revisar con el fabricante del producto."]] },

    { id: "anexo3", corto: "Usos de alto riesgo", tipo: "anexo3",
      pregunta: "¿Se usa para alguna de estas finalidades?",
      ayuda: "Son los ocho ámbitos del Anexo III (art. 6.2). Abre el que encaje y marca el uso concreto. Cuenta la finalidad para la que se usa, no la tecnología." },

    { id: "art63", corto: "Papel en la decisión", tipo: "art63",
      cuando: (r) => usosMarcados(r).length > 0,
      pregunta: "¿Qué papel tiene el sistema en la decisión?",
      ayuda: "El artículo 6.3 permite que un sistema del Anexo III no se considere de alto riesgo si no plantea un riesgo importante y su papel es limitado. Nunca se aplica si elabora perfiles de personas." },

    { id: "art25", corto: "¿Pasas a ser proveedor?", tipo: "multiple", exclusivos: ["ninguna"],
      cuando: (r) => altoProvisional(r) && !(r.rol || []).includes("proveedor"),
      pregunta: "¿Se da alguna de estas situaciones?",
      ayuda: "El artículo 25 convierte en proveedor a quien no lo era. Pasa a menudo al usar una IA de uso general —un chatbot comercial, por ejemplo— para una finalidad de alto riesgo, como filtrar currículums.",
      opciones: [
        ["marca", "He puesto mi nombre o marca a un sistema de alto riesgo ya comercializado", ""],
        ["modificacion", "He hecho una modificación sustancial a un sistema de alto riesgo", "Un cambio no previsto por el proveedor que afecta al cumplimiento o a la finalidad."],
        ["finalidad", "Lo uso para una finalidad de alto riesgo que su proveedor no previó", "Incluido un sistema o modelo de uso general."],
        ["ninguna", "Ninguna: lo uso tal y como prevé su proveedor", ""]] },

    { id: "art50", corto: "Transparencia", tipo: "multiple", exclusivos: ["ninguna"],
      pregunta: "¿El sistema hace alguna de estas cosas?",
      ayuda: "Son los deberes de transparencia del artículo 50, aplicables desde el 2 de agosto de 2026. Se suman a cualquier otro nivel de riesgo.",
      opciones: [
        ["chatbot", "Interactúa directamente con personas", "Chatbot, asistente de voz o agente que atiende al público."],
        ["sintetico", "Genera o modifica imagen, audio, vídeo o texto", "Contenido sintético que sale del sistema."],
        ["emociones", "Reconoce emociones o categoriza a personas con datos biométricos", ""],
        ["deepfake", "Crea ultrasuplantaciones (deepfakes)", "Imagen, audio o vídeo que imita a personas, lugares o hechos reales y puede pasar por auténtico."],
        ["texto", "Publica texto generado para informar sobre asuntos de interés público", ""],
        ["ninguna", "Ninguna de estas", ""]] },

    { id: "gpai", corto: "Modelo de uso general", tipo: "unica",
      cuando: (r) => (r.rol || []).includes("proveedor"),
      pregunta: "¿Desarrollas o comercializas un modelo de IA de uso general?",
      ayuda: "Hablamos del modelo, no del sistema: un modelo entrenado con grandes volúmenes de datos que sirve para muchas tareas distintas, como un LLM base, y que se ofrece para integrarlo en otros sistemas. Si solo lo usas a través de una API, no eres su proveedor.",
      opciones: [
        ["no", "No", ""],
        ["si", "Sí", "Lo ofrezco a terceros o lo integro en mis sistemas."],
        ["sistemico", "Sí, con riesgo sistémico", "Su entrenamiento superó 10²⁵ FLOP o la Comisión lo ha designado así."]] },

    { id: "contexto", corto: "Contexto de uso", tipo: "multiple", exclusivos: ["ninguno"],
      cuando: (r) => altoProvisional(r) && (rolesEfectivos(r).includes("despliegue")),
      pregunta: "¿En qué contexto lo usas?",
      ayuda: "Estas circunstancias activan obligaciones concretas del responsable del despliegue: informar a la plantilla, a las personas afectadas o evaluar el impacto en derechos fundamentales.",
      opciones: (r) => [
        ...(r.sistema?.sector !== "publico" ? [["serviciopublico", "Somos una entidad privada que presta servicios públicos", "Por concesión, encargo o contrato con una administración."]] : []),
        ["trabajadores", "Se usa en el lugar de trabajo y afecta a trabajadores", ""],
        ["decisiones", "Toma decisiones sobre personas o ayuda a tomarlas", ""],
        ["ninguno", "Ninguna de estas", ""]] }
  ];

  const FECHAS = {
    prohib: ["2025-02-02", "Prohibiciones (art. 5) y alfabetización en IA (art. 4)"],
    gpai: ["2025-08-02", "Modelos de IA de uso general, gobernanza y sanciones"],
    omnibus: ["2026-07-27", "Entra en vigor el Ómnibus: nueva redacción del art. 4 y datos sensibles para corregir sesgos (art. 4 bis)"],
    general: ["2026-08-02", "Transparencia (art. 50) y aplicación general del Reglamento"],
    nuevas: ["2026-12-02", "Nuevas prohibiciones de contenido sexual no consentido y de abuso infantil; marcado de contenido sintético para sistemas comercializados antes del 2/8/2026"],
    gpaiPrevio: ["2027-08-02", "Modelos de uso general comercializados antes del 2/8/2025"],
    anexo3: ["2027-12-02", "Obligaciones de alto riesgo para los sistemas del Anexo III"],
    anexo1: ["2028-08-02", "Obligaciones de alto riesgo para los productos del Anexo I"],
    publico2030: ["2030-08-02", "Sistemas de alto riesgo que ya usaban las autoridades públicas deben estar adaptados (art. 111.2)"]
  };

  /* ======================= LÓGICA ======================= */
  function usosMarcados(r) { return (r.anexo3 || []).filter((u) => u !== "ninguno"); }
  function anexo3Alto(r) {
    const usos = usosMarcados(r);
    if (!usos.length) return false;
    const a = r.art63 || {};
    if (a.perfil === "si" || a.perfil === "nose") return true;
    const f = (a.funciones || []).filter((x) => x !== "ninguna");
    return f.length === 0;
  }
  function altoProvisional(r) { return r.anexo1 === "si" || anexo3Alto(r); }
  function rolesEfectivos(r) {
    const roles = [...(r.rol || [])];
    const a25 = (r.art25 || []).filter((x) => x !== "ninguna");
    if (a25.length && !roles.includes("proveedor")) roles.unshift("proveedor");
    return roles;
  }
  function practicas(r) { return (r.prohibidas || []).filter((p) => PRACTICAS.includes(p)); }
  function excluido(r) { return (r.exclusiones || []).filter((x) => x !== "ninguna"); }
  function fin(r, id) {
    if (id === "esIA") return r.esIA === "no";
    if (id === "exclusiones") return excluido(r).length > 0;
    if (id === "prohibidas") return practicas(r).length > 0;
    return false;
  }
  function pasosVisibles(r) {
    const out = [];
    for (const p of PASOS) {
      if (p.cuando && !p.cuando(r)) continue;
      out.push(p);
      if (respondido(p, r) && fin(r, p.id)) break;
    }
    return out;
  }
  function opcionesDe(p, r) { return typeof p.opciones === "function" ? p.opciones(r) : p.opciones || []; }
  function respondido(p, r) {
    const v = r[p.id];
    if (p.tipo === "sistema") return !!(v && v.sector);
    if (p.tipo === "unica") return !!v;
    if (p.tipo === "multiple" || p.tipo === "anexo3") return Array.isArray(v) && v.length > 0;
    if (p.tipo === "art63") return !!(v && v.perfil && (v.perfil === "si" || (v.funciones && v.funciones.length)));
    return false;
  }

  function nivelDe(r) {
    if (r.esIA === "no") return "fuera";
    if (excluido(r).length) return "excluido";
    if (practicas(r).length) return "prohibido";
    if (altoProvisional(r)) return "alto";
    if (usosMarcados(r).length) return "exento";
    if ((r.art50 || []).some((x) => x !== "ninguna")) return "transparencia";
    return "minimo";
  }

  const NIVELES = {
    fuera: { nombre: "Fuera del RIA", sub: "Según tus respuestas no es un sistema de IA en el sentido del Reglamento.", capa: -1 },
    excluido: { nombre: "Excluido del RIA", sub: "El Reglamento no se aplica a este supuesto (art. 2).", capa: -1 },
    prohibido: { nombre: "Práctica prohibida", sub: "El artículo 5 del RIA prohíbe este uso en la Unión Europea.", capa: 3 },
    alto: { nombre: "Alto riesgo", sub: "", capa: 2 },
    exento: { nombre: "No es de alto riesgo (art. 6.3)", sub: "Está en un ámbito del Anexo III, pero su papel en la decisión es limitado. Tienes que documentarlo.", capa: 1 },
    transparencia: { nombre: "Riesgo limitado: transparencia", sub: "No es de alto riesgo, pero tiene deberes de transparencia del artículo 50.", capa: 1 },
    minimo: { nombre: "Riesgo mínimo", sub: "Sin obligaciones específicas del RIA más allá de la alfabetización en IA. Puedes adherirte a códigos de conducta voluntarios (art. 95).", capa: 0 }
  };
  const ROLES = { proveedor: "Proveedor", despliegue: "Responsable del despliegue", importador: "Importador", distribuidor: "Distribuidor" };

  function evaluar(r) {
    const nivel = nivelDe(r), roles = rolesEfectivos(r), sobrevenido = roles.includes("proveedor") && !(r.rol || []).includes("proveedor");
    const t50 = (r.art50 || []).filter((x) => x !== "ninguna");
    const usos = usosMarcados(r), alto3 = anexo3Alto(r), alto1 = r.anexo1 === "si";
    const ctx = r.contexto || [];
    const publico = r.sistema?.sector === "publico";
    const gpai = r.gpai === "si" || r.gpai === "sistemico";
    const res = { nivel, roles, sobrevenido, t50, usos, alto3, alto1, gpai, grupos: [], fechas: [], dudas: [], siguientes: [], detalle: "" };
    const G = (titulo, items) => { if (items.length) res.grupos.push({ titulo, items }); };
    const fecha = (k) => { if (!res.fechas.some((f) => f[0] === FECHAS[k][0])) res.fechas.push(FECHAS[k]); };

    if (nivel === "fuera") {
      res.detalle = "El RIA solo regula sistemas que infieren a partir de los datos que reciben. Si tienes dudas, contrasta tu caso con las directrices de la Comisión sobre la definición de sistema de IA. El RGPD y otras normas pueden seguir aplicándose.";
    } else if (nivel === "excluido") {
      const nombres = { militar: "uso exclusivamente militar, de defensa o de seguridad nacional (art. 2.3)", investigacion: "investigación y desarrollo científico exclusivos (art. 2.6)", pruebas: "investigación, pruebas o desarrollo previos a la comercialización (art. 2.8)", personal: "uso personal no profesional (art. 2.10)" };
      res.detalle = "Supuesto: " + excluido(r).map((e) => nombres[e]).join("; ") + ". Si el uso cambia —se comercializa, se pone en servicio o se usa con otros fines— vuelve a evaluarlo.";
    } else if (nivel === "prohibido") {
      const ops = Object.fromEntries(PASOS.find((p) => p.id === "prohibidas").opciones.map((o) => [o[0], o[1]]));
      res.detalle = "Has marcado: " + practicas(r).map((p) => ops[p].toLowerCase()).join("; ") + ".";
      G("Qué hacer", [
        ["No lo comercialices, pongas en servicio ni utilices en la UE. Si ya está en uso, detenlo y documenta la decisión.", "art. 5"],
        ["Comprueba si encaja en alguna excepción tasada: solo algunas letras la tienen (emociones por motivos médicos o de seguridad, etiquetado de datos biométricos adquiridos lícitamente, identificación biométrica policial con autorización…).", "art. 5"],
        ["Las multas llegan a 35 millones de euros o al 7 % del volumen de negocio mundial, la cuantía mayor; para pymes y pequeñas empresas de mediana capitalización, la menor.", "art. 99.3 y 99.6"]
      ]);
      fecha("prohib"); if (practicas(r).includes("intimo")) fecha("nuevas");
    } else {
      // detalle del nivel
      if (nivel === "alto") {
        const partes = [];
        if (alto1) partes.push("producto o componente de seguridad del Anexo I (art. 6.1)");
        if (alto3) partes.push("uso del Anexo III: " + usos.map((u) => USOS[u].txt.toLowerCase()).join("; ") + " (art. 6.2)");
        res.detalle = "Motivo: " + partes.join(" y ") + ".";
        if ((r.art63 || {}).perfil === "si" && usos.length) res.detalle += " Al elaborar perfiles de personas, la excepción del art. 6.3 no se aplica.";
      } else if (nivel === "exento") {
        res.detalle = "Ámbito: " + usos.map((u) => USOS[u].txt.toLowerCase()).join("; ") + ". La excepción depende de que su papel siga siendo limitado: si cambias la finalidad o empieza a influir en la decisión, pasa a ser de alto riesgo.";
      }

      // comunes
      const comunes = [];
      if (roles.includes("proveedor") || roles.includes("despliegue")) {
        comunes.push(["Alfabetización en IA: adopta medidas para que tu personal y quienes usan el sistema en tu nombre tengan conocimientos suficientes según su formación y el contexto de uso. Tras el Ómnibus ya no se exige garantizar un nivel concreto, pero sí actuar y poder demostrarlo.", "art. 4"]);
      }
      comunes.push(["Si trata datos personales, el RGPD se aplica a la vez: base jurídica, información a las personas, evaluación de impacto (EIPD) cuando proceda y el derecho a no ser objeto de decisiones solo automatizadas.", "RGPD, arts. 13, 22 y 35"]);
      G("Para todos los sistemas", comunes);
      fecha("prohib");

      // proveedor
      if (roles.includes("proveedor")) {
        if (nivel === "alto") {
          const it = [
            ["Sistema de gestión de riesgos durante todo el ciclo de vida.", "art. 9"],
            ["Datos de entrenamiento, validación y prueba de calidad, pertinentes y examinados para detectar sesgos. Los datos sensibles para corregir sesgos, solo con las condiciones del art. 4 bis.", "arts. 10 y 4 bis"],
            ["Documentación técnica antes de comercializarlo; las pymes y pequeñas empresas de mediana capitalización pueden usar la plantilla simplificada.", "art. 11 y anexo IV"],
            ["Registro automático de eventos (logs) y conservación de al menos seis meses.", "arts. 12 y 19"],
            ["Instrucciones de uso claras y completas para quien lo despliega.", "art. 13"],
            ["Diseño que permita una supervisión humana efectiva, incluida la posibilidad de detenerlo.", "art. 14"],
            ["Precisión, solidez y ciberseguridad adecuadas, declaradas en las instrucciones.", "art. 15"],
            ["Sistema de gestión de la calidad proporcional al tamaño y documentación conservada diez años.", "arts. 17 y 18"],
            ["Evaluación de la conformidad, declaración UE de conformidad y marcado CE.", "arts. 43, 47 y 48"],
            ["Registro en la base de datos de la UE antes de comercializarlo o ponerlo en servicio.", "art. 49"],
            ["Seguimiento poscomercialización, medidas correctoras y notificación de incidentes graves a la autoridad.", "arts. 20, 72 y 73"]
          ];
          if (alto1) it.splice(8, 1, ["Evaluación de la conformidad integrada en la del propio producto regulado, declaración UE de conformidad y marcado CE.", "arts. 43.3, 47 y 48"]);
          if (sobrevenido) it.unshift(["Asumes las obligaciones de proveedor por el art. 25. El proveedor inicial deja de serlo para ese sistema, pero debe cooperar y darte la información necesaria.", "art. 25.2"]);
          G(sobrevenido ? "Como proveedor (sobrevenido)" : "Como proveedor", it);
        } else if (nivel === "exento") {
          G("Como proveedor", [
            ["Documenta por escrito por qué no es de alto riesgo antes de comercializarlo o ponerlo en servicio, y entrégalo a la autoridad si lo pide.", "art. 6.4"],
            ["Regístralo en la base de datos de la UE aunque no sea de alto riesgo.", "art. 49.2"],
            ["Revisa la evaluación cada vez que cambie la finalidad o el funcionamiento del sistema.", "art. 6.3"]
          ]);
        } else {
          G("Como proveedor", [["Sin obligaciones específicas por nivel de riesgo. Valora adherirte a un código de conducta voluntario.", "art. 95"]]);
        }
      }

      // responsable del despliegue
      if (roles.includes("despliegue")) {
        if (nivel === "alto") {
          const it = [
            ["Usarlo conforme a las instrucciones del proveedor, con medidas técnicas y organizativas.", "art. 26.1"],
            ["Encomendar la supervisión humana a personas con competencia, formación, autoridad y apoyo suficientes.", "art. 26.2"],
            ["Si controlas los datos de entrada, que sean pertinentes y suficientemente representativos.", "art. 26.4"],
            ["Vigilar su funcionamiento; ante un riesgo, suspender el uso e informar al proveedor y a la autoridad; comunicar los incidentes graves.", "art. 26.5"],
            ["Conservar los logs bajo tu control al menos seis meses.", "art. 26.6"]
          ];
          if (ctx.includes("trabajadores") || usos.some((u) => u.startsWith("4"))) it.push(["Informar a los representantes de los trabajadores y a la plantilla afectada antes de usarlo en el trabajo.", "art. 26.7"]);
          if (publico) it.push(["Como autoridad pública, registrar tu uso en la base de datos de la UE; si el sistema no está registrado, no usarlo e informar al proveedor.", "arts. 26.8 y 49.3"]);
          it.push(["Usar la información del proveedor para la evaluación de impacto en protección de datos (EIPD) cuando proceda.", "art. 26.9"]);
          const decide = ctx.includes("decisiones") || usos.some((u) => !u.startsWith("2"));
          if (alto3 && decide) {
            it.push(["Informar a las personas afectadas de que se usa un sistema de alto riesgo para decidir sobre ellas.", "art. 26.11"]);
            it.push(["Dar una explicación clara del papel del sistema en la decisión a quien lo pida.", "art. 86"]);
          }
          const fria = alto3 && usos.some((u) => !u.startsWith("2")) && (publico || ctx.includes("serviciopublico") || usos.includes("5b") || usos.includes("5c"));
          if (fria) it.push(["Evaluación de impacto en los derechos fundamentales (FRIA) antes del primer uso, notificando el resultado a la autoridad. Puede apoyarse en la EIPD.", "art. 27"]);
          it.push(["Cooperar con las autoridades competentes.", "art. 26.12"]);
          G("Como responsable del despliegue", it);
          if (publico) fecha("publico2030");
        } else {
          G("Como responsable del despliegue", [["Sin obligaciones específicas por nivel de riesgo, más allá de la transparencia y la alfabetización. Usa el sistema conforme a sus instrucciones y vigila los resultados.", "buena práctica"]]);
        }
      }

      if (roles.includes("importador") && nivel === "alto") {
        G("Como importador", [
          ["Antes de comercializarlo, verificar que el proveedor hizo la evaluación de la conformidad y tiene documentación técnica, marcado CE, declaración UE, instrucciones y representante autorizado.", "art. 23.1"],
          ["No comercializarlo si sospechas que no es conforme, e informar al proveedor y a la autoridad.", "art. 23.2"],
          ["Indicar tu nombre y dirección en el sistema, su embalaje o su documentación.", "art. 23.3"],
          ["Conservar diez años el certificado, las instrucciones y la declaración, y cooperar con las autoridades.", "arts. 23.5 a 23.7"]
        ]);
      }
      if (roles.includes("distribuidor") && nivel === "alto") {
        G("Como distribuidor", [
          ["Verificar el marcado CE, la declaración UE de conformidad y las instrucciones, y que proveedor e importador cumplieron.", "art. 24.1"],
          ["No distribuirlo si no es conforme; adoptar medidas correctoras o retirarlo.", "arts. 24.2 y 24.4"],
          ["Mantener las condiciones de almacenamiento y transporte, y cooperar con las autoridades.", "arts. 24.3 y 24.6"]
        ]);
      }

      // transparencia
      if (t50.length) {
        const prov = roles.includes("proveedor"), desp = roles.includes("despliegue") || !prov;
        const it = [];
        if (t50.includes("chatbot")) {
          if (prov) it.push(["Diseñarlo para que las personas sepan que interactúan con una IA, salvo que sea evidente por el contexto.", "art. 50.1"]);
          if (desp) it.push(["Comprobar que el aviso llega a quien lo usa en la primera interacción, en tu web, chat o teléfono.", "art. 50.1 y 50.5"]);
        }
        if (t50.includes("sintetico")) {
          if (prov) it.push(["Marcar los resultados en un formato legible por máquina y detectable (marca de agua, metadatos). Los sistemas comercializados antes del 2/8/2026 tienen hasta el 2/12/2026.", "art. 50.2"]);
          if (desp) it.push(["Buena práctica: etiquetar el contenido generado aunque no sea una ultrasuplantación.", "art. 50"]);
          fecha("nuevas");
        }
        if (t50.includes("emociones")) it.push(["Informar a las personas expuestas y tratar sus datos conforme al RGPD. Recuerda: en el trabajo y en la educación está prohibido.", "arts. 50.3 y 5.1.f"]);
        if (t50.includes("deepfake")) it.push(["Revelar que el contenido se ha generado o manipulado. En obras artísticas, satíricas o de ficción, de forma que no estropee la obra.", "art. 50.4"]);
        if (t50.includes("texto")) it.push(["Revelar que el texto se ha generado con IA, salvo que haya revisión humana o control editorial y alguien asuma la responsabilidad editorial.", "art. 50.4"]);
        it.push(["Todo aviso: claro, distinguible, accesible y, como tarde, en la primera interacción o exposición.", "art. 50.5"]);
        G("Transparencia", it);
        fecha("general");
      }

      // modelo de uso general
      if (roles.includes("proveedor") && gpai) {
        const it = [
          ["Documentación técnica del modelo para la Oficina de IA y las autoridades.", "art. 53.1.a y anexo XI"],
          ["Información y documentación para quienes integran el modelo en sus sistemas.", "art. 53.1.b y anexo XII"],
          ["Política para cumplir los derechos de autor, incluidas las reservas de minería de textos y datos.", "art. 53.1.c"],
          ["Resumen suficientemente detallado del contenido usado para entrenarlo, con la plantilla de la Oficina de IA.", "art. 53.1.d"],
          ["Si es libre y de código abierto, quedas exento de las dos primeras salvo que tenga riesgo sistémico.", "art. 53.2"]
        ];
        if (r.gpai === "sistemico") {
          it.push(["Notificar a la Comisión que alcanza el umbral de riesgo sistémico.", "art. 52"]);
          it.push(["Evaluar el modelo con pruebas adversariales, mitigar los riesgos sistémicos, notificar incidentes graves y garantizar su ciberseguridad.", "art. 55"]);
          it.push(["El código de buenas prácticas sirve para demostrar cumplimiento.", "art. 56"]);
        }
        G("Modelo de IA de uso general", it);
        fecha("gpai"); fecha("gpaiPrevio");
      }

      if (nivel === "alto") {
        if (alto3) fecha("anexo3");
        if (alto1) fecha("anexo1");
        G("Sanciones", [["Incumplir las obligaciones de alto riesgo o de transparencia: hasta 15 millones de euros o el 3 % del volumen de negocio mundial. Información incorrecta a las autoridades: hasta 7,5 millones o el 1 %. En España supervisa la AESIA junto a otras autoridades sectoriales.", "art. 99.4 y 99.5"]]);
      }
      fecha("omnibus"); fecha("general");
    }

    res.fechas.sort((a, b) => a[0].localeCompare(b[0]));

    // dudas
    const ids = { esIA: "Comprueba con el equipo técnico si el sistema infiere a partir de datos o solo aplica reglas fijas.", prohibidas: "Revisa con el servicio jurídico las prácticas del art. 5 antes de seguir: es lo único que no admite matices.", anexo1: "Pregunta al fabricante del producto si el sistema es un componente de seguridad sujeto a evaluación de terceros." };
    Object.entries(ids).forEach(([k, txt]) => { const v = r[k]; if (v === "nose" || (Array.isArray(v) && v.includes("nose"))) res.dudas.push(txt); });
    if ((r.art63 || {}).perfil === "nose") res.dudas.push("Confirma si el sistema elabora perfiles de personas: si lo hace, es de alto riesgo sin excepción. Lo hemos tratado como alto riesgo.");

    // siguientes pasos
    if (t50.length && nivel !== "prohibido") res.siguientes.push({ href: "#faro", txt: "Prepara los avisos de transparencia", sub: "Faro", caso: t50[0] });
    if (["alto", "exento", "transparencia", "minimo"].includes(nivel)) res.siguientes.push({ href: "#pliego", txt: "Contrata o renueva este sistema con garantías", sub: "Pliego", tipo: nivel === "alto" ? "alto" : "noalto" });
    if (!["fuera", "excluido"].includes(nivel)) res.siguientes.push({ href: "alfabetizacion-ia.html", txt: "Vídeos de alfabetización en IA para tu plantilla", sub: "Alfabetización" });
    if (nivel === "alto" || nivel === "exento") res.siguientes.push({ href: "index.html#recursos", txt: "Modelos de documento técnico y de evaluación de impacto", sub: "Biblioteca" });
    return res;
  }

  /* ======================= INTERFAZ ======================= */
  const r = {};
  let actual = 0, enResultado = false, hechos = new Set(), raiz;

  function md(s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>"); }

  function opcionHTML(nombre, tipo, o, marcado, extra) {
    const [v, titulo, ayuda] = o;
    const tenue = v === "nose" || v === "ninguna" || v === "ninguno" ? " bz-op-tenue" : "";
    return `<label class="bz-op${tenue}${extra || ""}"><input type="${tipo}" name="${nombre}" value="${esc(v)}"${marcado ? " checked" : ""}><span class="bz-op-marca" aria-hidden="true"></span><span class="bz-op-texto"><b>${esc(titulo)}</b>${ayuda ? `<small>${esc(ayuda)}</small>` : ""}</span></label>`;
  }

  function cuerpoPregunta(p) {
    const v = r[p.id];
    if (p.tipo === "sistema") {
      const s = v || {};
      return `<div class="bz-campos">
        <label class="bz-campo"><span>Nombre del sistema <em>opcional</em></span><input type="text" name="nombre" maxlength="120" value="${esc(s.nombre || "")}" placeholder="Ej.: asistente virtual de la sede electrónica"></label>
        <fieldset class="bz-chips"><legend>Tipo de organización</legend>${SECTORES.map(([k, t]) => `<label class="bz-chip"><input type="radio" name="sector" value="${k}"${s.sector === k ? " checked" : ""}><span>${esc(t)}</span></label>`).join("")}</fieldset>
      </div>`;
    }
    if (p.tipo === "unica") return `<div class="bz-ops">${opcionesDe(p, r).map((o) => opcionHTML(p.id, "radio", o, v === o[0])).join("")}</div>`;
    if (p.tipo === "multiple") return `<div class="bz-ops${opcionesDe(p, r).length > 6 ? " bz-ops-dos" : ""}">${opcionesDe(p, r).map((o) => opcionHTML(p.id, "checkbox", o, (v || []).includes(o[0]))).join("")}</div>`;
    if (p.tipo === "anexo3") {
      const sel = v || [];
      return `<div class="bz-areas">${AREAS.map((a) => {
        const n = a.usos.filter((u) => sel.includes(u[0])).length;
        return `<details class="bz-area"${n ? " open" : ""}><summary><b>${a.id}</b><span>${esc(a.nombre)}</span><em>${n ? n + " marcado" + (n > 1 ? "s" : "") : ""}</em></summary>
          <div class="bz-ops">${a.usos.map((u) => opcionHTML("anexo3", "checkbox", u, sel.includes(u[0]))).join("")}</div></details>`;
      }).join("")}
      <div class="bz-ops">${opcionHTML("anexo3", "checkbox", ["ninguno", "Ninguno de estos usos", ""], sel.includes("ninguno"))}</div></div>`;
    }
    if (p.tipo === "art63") {
      const a = v || {};
      const fun = [
        ["a", "Hace una tarea procedimental limitada", "Convertir documentos, clasificar correos por tema, detectar duplicados."],
        ["b", "Mejora el resultado de una actividad humana ya terminada", "Revisar el estilo de un texto ya redactado."],
        ["c", "Detecta patrones o desviaciones respecto a decisiones previas", "Sin sustituir ni influir en la valoración humana sin una revisión adecuada."],
        ["d", "Hace una tarea preparatoria para una evaluación que hará una persona", "Ordenar, indexar o traducir expedientes."],
        ["ninguna", "Nada de eso: influye en la decisión", ""]];
      return `<p class="bz-sub">1. ¿Elabora perfiles de personas físicas?</p>
        <p class="bz-nota">Perfilar es evaluar aspectos personales —rendimiento laboral, situación económica, salud, preferencias, fiabilidad, comportamiento o ubicación— de forma automatizada.</p>
        <div class="bz-ops bz-ops-fila">${[["si", "Sí, elabora perfiles", ""], ["no", "No", ""], ["nose", "No lo sé", ""]].map((o) => opcionHTML("perfil", "radio", o, a.perfil === o[0])).join("")}</div>
        <div class="bz-63b"${a.perfil === "si" || !a.perfil ? " hidden" : ""}>
          <p class="bz-sub">2. ¿Se limita a alguna de estas funciones, sin influir de forma sustancial en el resultado?</p>
          <div class="bz-ops">${fun.map((o) => opcionHTML("funciones", "checkbox", o, (a.funciones || []).includes(o[0]))).join("")}</div>
        </div>`;
    }
    return "";
  }

  function leer(p, form) {
    const fd = new FormData(form);
    if (p.tipo === "sistema") r.sistema = { nombre: (fd.get("nombre") || "").trim(), sector: fd.get("sector") || "" };
    else if (p.tipo === "unica") r[p.id] = fd.get(p.id) || "";
    else if (p.tipo === "multiple" || p.tipo === "anexo3") r[p.id] = fd.getAll(p.tipo === "anexo3" ? "anexo3" : p.id);
    else if (p.tipo === "art63") r.art63 = { perfil: fd.get("perfil") || "", funciones: fd.get("perfil") === "si" ? [] : fd.getAll("funciones") };
  }

  function pintarPregunta(enfocar) {
    enResultado = false;
    const vis = pasosVisibles(r);
    actual = Math.min(actual, vis.length - 1);
    const p = vis[actual];
    const total = vis.length + (respondido(vis[vis.length - 1], r) && fin(r, vis[vis.length - 1].id) ? 0 : estimarRestantes(vis));
    raiz.querySelector(".bz-barra b").textContent = `PASO ${String(actual + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
    raiz.querySelector(".bz-progreso b").style.transform = `scaleX(${(actual) / Math.max(total, 1)})`;
    pintarPasos(vis);
    const zona = raiz.querySelector(".bz-zona");
    zona.innerHTML = `<form class="bz-pregunta" novalidate>
      <p class="bz-num">${String(actual + 1).padStart(2, "0")} · ${esc(p.corto.toUpperCase())}</p>
      <h3 tabindex="-1">${esc(p.pregunta)}</h3>
      ${p.ayuda ? `<details class="bz-ayuda"${p.id === "esIA" || p.id === "art63" ? " open" : ""}><summary>¿Qué significa?</summary><p>${md(p.ayuda)}</p></details>` : ""}
      ${cuerpoPregunta(p)}
      <p class="bz-error" role="alert" hidden>Elige una opción para seguir.</p>
      <div class="bz-acciones">
        <button type="button" class="button button-text bz-atras"${actual === 0 ? " disabled" : ""}><span aria-hidden="true">←</span> Atrás</button>
        <button type="submit" class="button button-primary">${esUltimo(p) ? "Ver resultado" : "Siguiente"} <span aria-hidden="true">→</span></button>
      </div>
    </form>`;
    const form = zona.querySelector("form");
    form.addEventListener("change", (e) => cambio(p, form, e));
    form.addEventListener("submit", (e) => { e.preventDefault(); avanzar(p, form); });
    form.querySelector(".bz-atras").addEventListener("click", () => { leer(p, form); actual = Math.max(0, actual - 1); pintarPregunta(true); });
    if (enfocar) form.querySelector("h3").focus({ preventScroll: true });
  }
  function estimarRestantes(vis) {
    // cuántos pasos quedan aproximadamente tras el último visible
    const ultimo = vis[vis.length - 1];
    const idx = PASOS.indexOf(ultimo);
    return PASOS.slice(idx + 1).filter((p) => !p.cuando || p.cuando(r)).length;
  }
  function esUltimo(p) {
    const vis = pasosVisibles(r);
    return vis[vis.length - 1] === p && (fin(r, p.id) || PASOS.slice(PASOS.indexOf(p) + 1).every((q) => q.cuando && !q.cuando(r)));
  }

  function cambio(p, form, e) {
    const t = e.target;
    // opciones exclusivas («Ninguna», «No lo sé»)
    if (t.type === "checkbox" && t.checked) {
      const excl = t.name === "anexo3" ? ["ninguno"] : t.name === "funciones" ? ["ninguna"] : p.exclusivos || [];
      const grupo = [...form.querySelectorAll(`input[name="${t.name}"]`)];
      if (excl.includes(t.value)) grupo.forEach((i) => { if (i !== t) i.checked = false; });
      else grupo.forEach((i) => { if (excl.includes(i.value)) i.checked = false; });
    }
    if (p.tipo === "art63" && t.name === "perfil") form.querySelector(".bz-63b").hidden = t.value === "si";
    if (p.tipo === "anexo3") form.querySelectorAll(".bz-area").forEach((d) => {
      const n = d.querySelectorAll("input:checked").length;
      d.querySelector("em").textContent = n ? n + " marcado" + (n > 1 ? "s" : "") : "";
    });
    form.querySelector(".bz-error").hidden = true;
    leer(p, form);
    const btn = form.querySelector('button[type="submit"]');
    btn.firstChild.nodeValue = (esUltimo(p) ? "Ver resultado" : "Siguiente") + " ";
    pintarPasos(pasosVisibles(r));
  }

  function avanzar(p, form) {
    leer(p, form);
    if (!respondido(p, r)) {
      const er = form.querySelector(".bz-error");
      er.textContent = p.tipo === "sistema" ? "Elige el tipo de organización para seguir." : p.tipo === "art63" ? "Responde a las preguntas para seguir." : "Elige una opción para seguir.";
      er.hidden = false; return;
    }
    if (esUltimo(p)) { pintarResultado(); return; }
    actual++;
    pintarPregunta(true);
    asomar();
  }

  function asomar() {
    const top = raiz.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * .5) raiz.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }

  function pintarPasos(vis) {
    const ol = raiz.querySelector(".bz-pasos");
    ol.innerHTML = vis.map((p, i) => {
      const est = enResultado ? "hecho" : i === actual ? "actual" : respondido(p, r) ? "hecho" : "pendiente";
      const puede = i <= actual || vis.slice(0, i).every((q) => respondido(q, r));
      return `<li class="is-${est}"><button type="button" data-i="${i}"${puede ? "" : " disabled"}><span>${String(i + 1).padStart(2, "0")}</span>${esc(p.corto)}</button></li>`;
    }).join("") + `<li class="bz-paso-final${enResultado ? " is-actual" : ""}"><button type="button" data-res${vis.every((q) => respondido(q, r)) && esUltimo(vis[vis.length - 1]) ? "" : " disabled"}><span>✓</span>Resultado</button></li>`;
  }

  /* ---------- resultado ---------- */
  function piramide(capa) {
    const cols = ["#ffffff", "#ffe500", "#064bae", "#ff1738"], nom = ["Mínimo", "Transparencia", "Alto", "Prohibido"];
    let s = `<svg viewBox="0 0 220 170" class="bz-piramide" role="img" aria-label="Pirámide de riesgo del RIA${capa >= 0 ? ": nivel " + nom[capa] : ""}">`;
    for (let i = 0; i < 4; i++) {
      const y = 132 - i * 36, w0 = 200 - i * 44, w1 = w0 - 44, x0 = 110 - w0 / 2, x1 = 110 - w1 / 2;
      const on = i === capa;
      s += `<path d="M${x0} ${y + 32}H${x0 + w0}L${x1 + w1} ${y}H${x1}Z" fill="${cols[i]}" stroke="${on ? "#111820" : "rgba(17,24,32,.18)"}" stroke-width="${on ? 2.5 : 1}" opacity="${capa < 0 || on ? 1 : .32}"/>`;
      s += `<text x="110" y="${y + 21}" text-anchor="middle" font-family="ui-monospace,Menlo,Consolas,monospace" font-size="${i === 3 ? 8 : 9}" font-weight="800" letter-spacing=".08em" fill="${i >= 2 ? "#ffffff" : "#052f70"}" opacity="${capa < 0 || on ? 1 : .55}">${nom[i].toUpperCase()}</text>`;
    }
    return s + "</svg>";
  }
  function estadoFecha(f) {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const d = new Date(f + "T00:00:00");
    return d <= hoy ? "ya" : "pronto";
  }
  function fechaBonita(f) { const [y, m, d] = f.split("-"); return `${d}/${m}/${y}`; }

  function pintarResultado() {
    enResultado = true;
    const res = evaluar(r), N = NIVELES[res.nivel];
    const vis = pasosVisibles(r);
    raiz.querySelector(".bz-barra b").textContent = "RESULTADO";
    raiz.querySelector(".bz-progreso b").style.transform = "scaleX(1)";
    pintarPasos(vis);
    let sub = N.sub;
    if (res.nivel === "alto") sub = res.alto1 && res.alto3 ? "Por el Anexo I y el Anexo III." : res.alto1 ? "Por ser un producto regulado del Anexo I (art. 6.1)." : "Por su finalidad, recogida en el Anexo III (art. 6.2).";
    let n = 0;
    const zona = raiz.querySelector(".bz-zona");
    zona.innerHTML = `<div class="bz-resultado bz-nivel-${res.nivel}">
      <div class="bz-veredicto">
        <div>
          <p class="bz-num">${r.sistema?.nombre ? esc(r.sistema.nombre).toUpperCase() + " · " : ""}RESULTADO</p>
          <h3 tabindex="-1">${esc(N.nombre)}</h3>
          <p class="bz-veredicto-sub">${esc(sub)}</p>
          ${res.detalle ? `<p class="bz-veredicto-det">${esc(res.detalle)}</p>` : ""}
          <ul class="bz-etiquetas">
            ${res.roles.map((x) => `<li>${esc(ROLES[x])}${x === "proveedor" && res.sobrevenido ? " · sobrevenido" : ""}</li>`).join("")}
            ${res.t50.length && res.nivel !== "transparencia" && !["fuera", "excluido", "prohibido"].includes(res.nivel) ? "<li class=\"is-amarillo\">Transparencia art. 50</li>" : ""}
            ${res.gpai && res.roles.includes("proveedor") ? "<li>Modelo de uso general</li>" : ""}
          </ul>
        </div>
        ${piramide(N.capa)}
      </div>
      ${res.dudas.length ? `<div class="bz-dudas"><p class="bz-sub">Para revisar</p><ul>${res.dudas.map((d) => `<li>${esc(d)}</li>`).join("")}</ul></div>` : ""}
      ${res.grupos.length ? `<div class="bz-obligaciones"><div class="bz-obl-cabecera"><p class="bz-sub">Qué tienes que hacer</p><span>Marca lo que ya tienes: se incluye en el informe.</span></div>
        ${res.grupos.map((g) => `<section><h4>${esc(g.titulo)}</h4><ul>${g.items.map((it) => { const id = "o" + (n++); return `<li><label><input type="checkbox" data-ob="${id}"${hechos.has(id) ? " checked" : ""}><span>${esc(it[0])}</span><em>${esc(it[1])}</em></label></li>`; }).join("")}</ul></section>`).join("")}
      </div>` : ""}
      ${res.fechas.length ? `<div class="bz-calendario"><p class="bz-sub">Calendario que te afecta</p><ol>${res.fechas.map((f) => `<li class="is-${estadoFecha(f[0])}"><time datetime="${f[0]}">${fechaBonita(f[0])}</time><span>${esc(f[1])}</span><em>${estadoFecha(f[0]) === "ya" ? "Ya aplica" : "Próximo"}</em></li>`).join("")}</ol></div>` : ""}
      ${res.siguientes.length ? `<div class="bz-siguientes"><p class="bz-sub">Siguientes pasos</p><div>${res.siguientes.map((s, i) => `<a href="${s.href}" data-sig="${i}"><em>${esc(s.sub)}</em><span>${esc(s.txt)}</span><i aria-hidden="true">${s.href.startsWith("#") ? "↓" : "↗"}</i></a>`).join("")}</div></div>` : ""}
      <div class="bz-descargas">
        <button type="button" class="button button-primary" data-accion="pdf">Descargar PDF</button>
        <button type="button" class="button bz-boton-borde" data-accion="docx">Descargar Word</button>
        <button type="button" class="button bz-boton-borde" data-accion="copiar">Copiar resumen</button>
        <button type="button" class="button button-text" data-accion="editar"><span aria-hidden="true">←</span> Revisar respuestas</button>
        <button type="button" class="button button-text" data-accion="reiniciar">Empezar de nuevo <span aria-hidden="true">↺</span></button>
      </div>
      <p class="bz-legal">Resultado orientativo basado en tus respuestas y en el RIA con los cambios del Reglamento (UE) 2026/1744. No sustituye al análisis jurídico de tu caso ni a las guías de la Comisión y de la AESIA.</p>
    </div>`;
    zona.querySelectorAll("[data-ob]").forEach((c) => c.addEventListener("change", () => { c.checked ? hechos.add(c.dataset.ob) : hechos.delete(c.dataset.ob); }));
    zona.querySelectorAll("[data-sig]").forEach((a) => a.addEventListener("click", () => {
      const s = res.siguientes[+a.dataset.sig];
      if (s.caso && window.EuFaro) window.EuFaro.preseleccionar(s.caso);
      if (s.tipo && window.EuPliego) window.EuPliego.preseleccionar({ tipo: s.tipo, ambito: r.sistema?.sector === "publico" ? "publico" : "privado" });
    }));
    zona.querySelector('[data-accion="pdf"]').addEventListener("click", () => X().imprimir(informe(res), "Informe RIA - eunomIA"));
    zona.querySelector('[data-accion="docx"]').addEventListener("click", () => X().docx(informe(res), `eunomia-balanza-${X().hoyArchivo()}.docx`, "Informe de clasificación RIA"));
    zona.querySelector('[data-accion="copiar"]').addEventListener("click", () => X().copiar(X().textoPlano(informe(res))));
    zona.querySelector('[data-accion="editar"]').addEventListener("click", () => { actual = 0; pintarPregunta(true); });
    zona.querySelector('[data-accion="reiniciar"]').addEventListener("click", () => { Object.keys(r).forEach((k) => delete r[k]); hechos = new Set(); actual = 0; pintarPregunta(true); asomar(); });
    zona.querySelector("h3").focus({ preventScroll: true });
    asomar();
  }

  /* ---------- informe exportable ---------- */
  function etiquetaRespuesta(p) {
    const v = r[p.id];
    if (p.tipo === "sistema") return (v.nombre ? v.nombre + " · " : "") + (SECTORES.find((s) => s[0] === v.sector) || [, ""])[1];
    if (p.tipo === "anexo3") return v.includes("ninguno") ? "Ninguno de estos usos" : v.map((u) => USOS[u] ? `${USOS[u].areaNombre}: ${USOS[u].txt}` : u).join("; ");
    if (p.tipo === "art63") {
      const perf = { si: "Sí", no: "No", nose: "No lo sé" }[v.perfil];
      const f = { a: "tarea procedimental limitada", b: "mejora una actividad humana previa", c: "detecta patrones o desviaciones", d: "tarea preparatoria", ninguna: "influye en la decisión" };
      return `Elabora perfiles: ${perf}` + (v.funciones && v.funciones.length ? ` · Funciones: ${v.funciones.map((x) => f[x]).join(", ")}` : "");
    }
    const ops = Object.fromEntries(opcionesDe(p, r).map((o) => [o[0], o[1]]));
    return Array.isArray(v) ? v.map((x) => ops[x] || x).join("; ") : ops[v] || v;
  }
  function informe(res) {
    const N = NIVELES[res.nivel], B = [];
    B.push({ t: "titulo", x: "Informe de clasificación RIA" });
    B.push({ t: "meta", x: `eunomIA · Balanza · ${X().hoy()}` });
    if (r.sistema?.nombre) B.push({ t: "p", x: `**Sistema:** ${r.sistema.nombre}` });
    B.push({ t: "h1", x: "Resultado" });
    B.push({ t: "p", x: `**${N.nombre}.** ${res.nivel === "alto" ? (res.alto1 && res.alto3 ? "Por el Anexo I y el Anexo III." : res.alto1 ? "Por ser un producto regulado del Anexo I (art. 6.1)." : "Por su finalidad, recogida en el Anexo III (art. 6.2).") : N.sub}` });
    if (res.detalle) B.push({ t: "p", x: res.detalle });
    if (res.roles.length) { B.push({ t: "h1", x: "Papel de la organización" }); res.roles.forEach((x) => B.push({ t: "li", x: ROLES[x] + (x === "proveedor" && res.sobrevenido ? " (sobrevenido, art. 25)" : "") })); }
    if (res.dudas.length) { B.push({ t: "h1", x: "Para revisar" }); res.dudas.forEach((d) => B.push({ t: "li", x: d })); }
    if (res.grupos.length) {
      B.push({ t: "h1", x: "Obligaciones y estado" });
      let n = 0;
      res.grupos.forEach((g) => { B.push({ t: "h2", x: g.titulo }); g.items.forEach((it) => { const id = "o" + (n++); B.push({ t: "li", x: `${hechos.has(id) ? "☑" : "☐"} ${it[0]} (${it[1]})` }); }); });
    }
    if (res.fechas.length) { B.push({ t: "h1", x: "Calendario" }); res.fechas.forEach((f) => B.push({ t: "li", x: `**${fechaBonita(f[0])}** · ${f[1]} — ${estadoFecha(f[0]) === "ya" ? "ya aplica" : "próximo"}` })); }
    B.push({ t: "h1", x: "Respuestas registradas" });
    pasosVisibles(r).forEach((p) => { if (respondido(p, r)) B.push({ t: "li", x: `**${p.pregunta}** ${etiquetaRespuesta(p)}` }); });
    B.push({ t: "nota", x: "Base normativa: Reglamento (UE) 2024/1689 (RIA), modificado por el Reglamento (UE) 2026/1744. Resultado orientativo: no sustituye al análisis jurídico del caso." });
    return B;
  }

  /* ---------- arranque ---------- */
  function iniciar() {
    raiz = document.getElementById("balanza-app");
    if (!raiz) return;
    raiz.innerHTML = `<div class="bz-marco">
      <div class="bz-barra"><span>EUNOMIA:/BALANZA</span><b>PASO 01</b></div>
      <div class="bz-progreso" aria-hidden="true"><b></b></div>
      <div class="bz-cuerpo">
        <nav class="bz-nav" aria-label="Pasos del clasificador"><ol class="bz-pasos"></ol></nav>
        <div class="bz-zona" aria-live="polite"></div>
      </div>
    </div>`;
    raiz.querySelector(".bz-pasos").addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b || b.disabled) return;
      const form = raiz.querySelector(".bz-pregunta");
      if (form && !enResultado) { const vis = pasosVisibles(r); leer(vis[actual], form); }
      if (b.hasAttribute("data-res")) { pintarResultado(); return; }
      actual = +b.dataset.i; pintarPregunta(true);
    });
    pintarPregunta(false);
  }
  window.EuBalanza = { iniciar, evaluar, _r: r };
})();
