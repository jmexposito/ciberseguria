/* eunomIA · 03 Pliego — cláusulas para contratar sistemas de IA
 * Sector público (pliego, LCSP) o privado (contrato entre empresas).
 * Inspirado en las cláusulas contractuales tipo de la UE para la contratación
 * de IA y adaptado al RIA (con el Ómnibus), el RGPD, el ENS y la LCSP.
 * Todo en memoria. Los huecos van entre corchetes y se resaltan.
 */
(() => {
  "use strict";
  const X = () => window.EuExportar;
  const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const c = { ambito: "publico", organo: "", objeto: "", tipo: "alto", modalidad: "saas", datos: true, ens: "media", soberania: "eee" };
  const elegidos = {};   // decisiones manuales sobre bloques: id → true/false

  function terminos() {
    return c.ambito === "publico"
      ? { org: "el órgano de contratación", Org: "El órgano de contratación", cta: "el contratista", Cta: "El contratista", doc: "el presente pliego", Doc: "El presente pliego" }
      : { org: "el Cliente", Org: "El Cliente", cta: "el Proveedor", Cta: "El Proveedor", doc: "el presente contrato", Doc: "El presente contrato" };
  }

  /* ---------- biblioteca de cláusulas ---------- */
  const BLOQUES = [
    { id: "objeto", titulo: "Objeto, definiciones y normativa aplicable", fijo: true, fuente: "Art. 3 RIA",
      txt: (t) => [
        `${t.Doc} regula las condiciones de cumplimiento normativo, seguridad y gobierno del sistema de inteligencia artificial incluido en ${c.objeto.trim() ? "el contrato «" + c.objeto.trim() + "»" : "el contrato [OBJETO DEL CONTRATO]"} (en adelante, «el Sistema»), ${{ medida: "desarrollado a medida para " + t.org, saas: "prestado como servicio en la nube", servicio: "integrado en el servicio contratado" }[c.modalidad]}.`,
        `Los términos «sistema de IA», «proveedor», «responsable del despliegue», «finalidad prevista», «modificación sustancial» e «incidente grave» tienen el significado que les da el artículo 3 del Reglamento (UE) 2024/1689 de Inteligencia Artificial (RIA).`,
        `${t.Cta} cumplirá durante toda la ejecución el RIA, en su versión modificada por el Reglamento (UE) 2026/1744, el Reglamento (UE) 2016/679 (RGPD), la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales${c.ens !== "no" ? ", el Esquema Nacional de Seguridad (Real Decreto 311/2022)" : ""}${c.ambito === "publico" ? " y la Ley 9/2017 de Contratos del Sector Público (LCSP)" : ""}, así como la normativa que los desarrolle o sustituya.`] },

    { id: "clasificacion", titulo: "Clasificación del Sistema y cumplimiento del RIA", fijo: true, esencial: true, fuente: "Arts. 5, 6 y 43 a 49 RIA",
      txt: (t) => [
        c.tipo === "alto" ? `${t.Cta} declara que el Sistema es de alto riesgo conforme al artículo 6 del RIA para la finalidad prevista por ${t.org}: [DESCRIBIR LA FINALIDAD Y EL PUNTO DEL ANEXO III O I APLICABLE].`
          : c.tipo === "general" ? `${t.Cta} identificará en su oferta el modelo o los modelos de IA de uso general que integra el Sistema, su proveedor y su versión, y declarará la clasificación del Sistema según el RIA para la finalidad prevista por ${t.org}: [DESCRIBIR LA FINALIDAD].`
            : `${t.Cta} declara que el Sistema, para la finalidad prevista por ${t.org} ([DESCRIBIR LA FINALIDAD]), no es de alto riesgo, y aporta la justificación por escrito. Si la clasificación se apoya en el artículo 6.3 del RIA, entregará la evaluación documentada y acreditará su registro en la base de datos de la UE.`,
        `${t.Cta} garantiza que el Sistema no incurre en ninguna de las prácticas prohibidas por el artículo 5 del RIA.`,
        c.tipo === "alto" && `Antes de la puesta en servicio, ${t.cta} acreditará la evaluación de la conformidad, la declaración UE de conformidad, el marcado CE y el registro del Sistema en la base de datos de la UE (artículos 43, 47, 48 y 49 del RIA).`,
        `Si durante la ejecución cambia la clasificación del Sistema o su finalidad, ${t.cta} lo comunicará por escrito a ${t.org} en un plazo máximo de [10] días.`] },

    { id: "documentacion", titulo: "Documentación técnica e instrucciones de uso", fijo: true, fuente: "Arts. 11, 13 y 26 RIA",
      txt: (t) => [
        `${t.Cta} entregará antes de la puesta en servicio, en castellano [y en las lenguas cooficiales que procedan], las instrucciones de uso del Sistema con, al menos: su finalidad prevista, el nivel de precisión y sus métricas, las limitaciones conocidas, las circunstancias que puedan generar riesgos, las medidas de supervisión humana, los requisitos de los datos de entrada y la forma de interpretar sus resultados.`,
        c.tipo === "alto" ? `${t.Cta} facilitará a ${t.org} la información necesaria para cumplir sus obligaciones como responsable del despliegue (artículo 26 del RIA) y para elaborar la evaluación de impacto en los derechos fundamentales (artículo 27 del RIA) y la evaluación de impacto en protección de datos (artículo 35 del RGPD).`
          : `${t.Cta} facilitará una ficha técnica del Sistema que describa el modelo empleado, el origen y el tipo de los datos de entrenamiento en la medida en que los conozca, las pruebas realizadas y sus limitaciones.`,
        `La documentación se actualizará con cada nueva versión del Sistema y se entregará sin coste adicional.`] },

    { id: "riesgos", titulo: "Gestión de riesgos", def: () => c.tipo === "alto", fuente: "Art. 9 RIA",
      txt: (t) => [
        c.tipo === "alto" ? `${t.Cta} mantendrá un sistema de gestión de riesgos durante todo el ciclo de vida del Sistema (artículo 9 del RIA) y entregará a ${t.org} un resumen actualizado de los riesgos identificados, su evaluación y las medidas adoptadas con periodicidad [semestral].`
          : `${t.Cta} aportará un análisis de los riesgos del Sistema para la salud, la seguridad y los derechos fundamentales en el uso previsto por ${t.org}, con las medidas de mitigación, y lo actualizará ante cualquier cambio relevante.`,
        `${t.Cta} informará a ${t.org} de cualquier riesgo nuevo que detecte en un plazo máximo de [5] días hábiles.`] },

    { id: "datos", titulo: "Datos, sesgos y uso de la información", def: () => true, fuente: "Arts. 4 bis y 10 RIA",
      txt: (t) => [
        (c.tipo === "alto" || c.modalidad === "medida") && `Los conjuntos de datos de entrenamiento, validación y prueba serán pertinentes, suficientemente representativos y, en la mayor medida posible, completos y sin errores, y se examinarán para detectar y corregir sesgos (artículo 10 del RIA). El tratamiento de categorías especiales de datos con ese fin solo se hará con las condiciones del artículo 4 bis del RIA.`,
        `${t.Cta} documentará las pruebas de sesgo y de no discriminación realizadas sobre el Sistema en el contexto de uso de ${t.org} y sus resultados.`,
        `${t.Cta} no utilizará los datos, documentos, instrucciones ni resultados generados en la ejecución del contrato para entrenar, ajustar o mejorar modelos, propios o de terceros, sin autorización previa, expresa y por escrito de ${t.org}.`] },

    { id: "registros", titulo: "Registros de funcionamiento (logs)", def: () => true, fuente: "Arts. 12, 19 y 26.6 RIA",
      txt: (t) => [
        `El Sistema registrará automáticamente${c.tipo === "alto" ? "" : ", en la medida técnicamente posible,"} los eventos relevantes de su funcionamiento —al menos la fecha y la hora de uso, los datos de entrada que hayan dado lugar a un resultado, los resultados y las personas que intervienen en su verificación—, de forma que se pueda rastrear su comportamiento (artículo 12 del RIA).`,
        `Los registros se conservarán durante [seis meses como mínimo], se protegerán frente a manipulaciones y estarán a disposición de ${t.org} en un formato estructurado y exportable.`] },

    { id: "supervision", titulo: "Supervisión humana", def: () => true, esencial: true, fuente: "Art. 14 RIA · art. 22 RGPD",
      txt: (t) => [
        `El Sistema permitirá que las personas designadas por ${t.org} comprendan sus capacidades y limitaciones, interpreten correctamente sus resultados, decidan no usarlos, los anulen o reviertan, y lo detengan de forma segura en cualquier momento (artículo 14 del RIA).`,
        `Ninguna decisión que produzca efectos jurídicos o afecte significativamente a las personas se adoptará de forma exclusivamente automatizada sin la intervención humana prevista por ${t.org}${c.ambito === "publico" ? " y sin cumplir los requisitos del artículo 41 de la Ley 40/2015 sobre actuación administrativa automatizada" : ""}.`,
        `${t.Cta} formará a las personas encargadas de la supervisión antes de la puesta en servicio, con un mínimo de [N] horas.`] },

    { id: "transparencia", titulo: "Transparencia y explicabilidad", def: () => true, fuente: "Arts. 50 y 86 RIA",
      txt: (t) => [
        `Cuando el Sistema interactúe con personas o genere contenido sintético, ${t.cta} garantizará el cumplimiento de los deberes de información y marcado del artículo 50 del RIA y facilitará a ${t.org} los textos de aviso.`,
        `${t.Cta} proporcionará los medios para explicar, en términos comprensibles, el papel del Sistema en cada resultado o decisión, de modo que ${t.org} pueda atender el derecho a explicación de las personas afectadas (artículo 86 del RIA) y sus deberes de información.`] },

    { id: "precision", titulo: "Precisión, solidez y ciberseguridad", def: () => true, fuente: "Art. 15 RIA",
      txt: (t) => [
        `${t.Cta} declarará las métricas de precisión del Sistema y sus umbrales mínimos aceptables, que se verificarán en las pruebas de aceptación con datos representativos del uso real de ${t.org}: [MÉTRICAS Y UMBRALES].`,
        `El Sistema será resistente a errores, fallos e intentos de alterar su uso o funcionamiento, incluidos el envenenamiento de datos, la manipulación de entradas (inyección de instrucciones) y la extracción de información confidencial. ${t.Cta} realizará pruebas adversariales antes de la puesta en servicio y tras cada cambio relevante, y compartirá sus resultados.`,
        `${t.Cta} gestionará las vulnerabilidades del Sistema y de sus componentes, aplicará las actualizaciones de seguridad en un plazo máximo de [N] días y comunicará cualquier incidente de seguridad que afecte al Sistema o a los datos en un plazo máximo de [24] horas desde su detección.`] },

    { id: "ens", titulo: "Esquema Nacional de Seguridad", disponible: () => c.ens !== "no", def: () => c.ens !== "no", fuente: "Real Decreto 311/2022 (ENS)",
      txt: (t) => [
        `El Sistema y los servicios asociados cumplirán el Esquema Nacional de Seguridad para la categoría ${{ basica: "BÁSICA", media: "MEDIA", alta: "ALTA" }[c.ens] || "[CATEGORÍA]"} (Real Decreto 311/2022). ${t.Cta} acreditará la conformidad mediante ${c.ens === "basica" ? "declaración o certificación" : "certificación"} de conformidad con el ENS antes de ${c.ambito === "publico" ? "la formalización del contrato" : "la puesta en servicio"}.`,
        `${t.Cta} indicará si los productos y servicios de seguridad empleados figuran en el Catálogo de Productos y Servicios de Seguridad de las TIC (CPSTIC) del Centro Criptológico Nacional.`] },

    { id: "proteccion", titulo: "Protección de datos personales", disponible: () => c.datos, def: () => c.datos, esencial: true, fuente: c => c.ambito === "publico" ? "Art. 28 RGPD · art. 122.2 LCSP" : "Art. 28 RGPD",
      txt: (t) => [
        `${t.Cta} tratará los datos personales por cuenta de ${t.org} como encargado del tratamiento, conforme al artículo 28 del RGPD y al acuerdo de encargo que figura como anexo [N].`,
        c.ambito === "publico"
          ? `De acuerdo con el artículo 122.2 de la LCSP: a) la finalidad para la que se ceden los datos es [FINALIDAD DEL TRATAMIENTO]; b) ${t.cta} se somete en todo caso a la normativa nacional y de la Unión Europea en materia de protección de datos; c) antes de la formalización del contrato, presentará una declaración en la que indique dónde estarán ubicados los servidores y desde dónde se prestarán los servicios asociados; d) comunicará cualquier cambio de esa información durante la ejecución; y e) los licitadores indicarán en su oferta si prevén subcontratar los servidores o los servicios asociados y, en tal caso, el nombre o el perfil empresarial de los subcontratistas. Estas obligaciones tienen carácter esencial a efectos del artículo 211.1.f) de la LCSP.`
          : `${t.Cta} indicará antes de la firma dónde estarán ubicados los servidores y desde dónde se prestarán los servicios asociados, y comunicará cualquier cambio. Cualquier subencargo requerirá autorización previa y por escrito de ${t.org}.`,
        `${t.Cta} colaborará con ${t.org} en la evaluación de impacto en protección de datos (artículo 35 del RGPD) y en la atención de los derechos de las personas interesadas.`] },

    { id: "ubicacion", titulo: "Ubicación de los datos y soberanía", def: () => true, esencial: true, fuente: "Cap. V RGPD",
      nota: (t) => c.ambito === "publico" && c.soberania !== "eee" ? "Nota para quien redacta: justifica en el expediente la necesidad y la proporcionalidad de estas exigencias, para no restringir la competencia sin motivo." : "",
      txt: (t) => [
        `Los datos de ${t.org}, los registros y los resultados del Sistema se almacenarán y tratarán exclusivamente en el Espacio Económico Europeo. Cualquier transferencia internacional requerirá autorización previa y por escrito de ${t.org} y las garantías del capítulo V del RGPD.`,
        c.soberania !== "eee" && `Ni ${t.cta} ni sus subcontratistas accederán a esos datos desde fuera del Espacio Económico Europeo, incluido el soporte técnico remoto, salvo autorización previa y por escrito de ${t.org}.`,
        c.soberania === "soberano" && `Los servicios se prestarán por entidades establecidas en la Unión Europea, con una infraestructura y una operación no sujetas a legislación de terceros países que pueda obligar a ceder datos sin las garantías del Derecho de la Unión. ${t.Cta} lo acreditará mediante declaración responsable [y la documentación que se indique].`] },

    { id: "propiedad", titulo: "Propiedad de los datos y de los resultados", def: () => true, fuente: c => c.ambito === "publico" ? "Art. 308 LCSP" : "Propiedad intelectual",
      txt: (t) => [
        `Los datos facilitados por ${t.org}, los datos de entrada, los resultados generados y los registros pertenecen a ${t.org}, que podrá usarlos libremente.`,
        c.modalidad === "medida"
          ? `${t.Cta} cede a ${t.org} los derechos de explotación sobre los desarrollos específicos realizados para el contrato, [en exclusiva], para todo el mundo y por el plazo máximo legal, y entregará su código fuente${c.ambito === "publico" ? " [con licencia libre que permita su reutilización por otras administraciones]" : ""}.`
          : `${t.Cta} garantiza que dispone de los derechos necesarios sobre el Sistema, los modelos y los datos de entrenamiento, y mantendrá indemne a ${t.org} frente a reclamaciones de terceros por infracción de derechos de propiedad intelectual o industrial.`] },

    { id: "reversibilidad", titulo: "Reversibilidad y salida del proveedor", def: () => true, esencial: true, fuente: "Reglamento (UE) 2023/2854, cap. VI",
      txt: (t) => [
        `${t.Cta} presentará, antes de la puesta en servicio, un plan de reversibilidad que permita a ${t.org} cambiar de proveedor o asumir el servicio sin pérdida de datos ni interrupción.`,
        `Al terminar el contrato, por cualquier causa, ${t.cta} entregará en un plazo máximo de [30] días, sin coste adicional, todos los datos, registros, configuraciones, instrucciones de sistema (prompts), conjuntos de prueba y documentación, en formatos abiertos, estructurados y legibles por máquina.`,
        `${t.Cta} prestará asistencia en la transición durante [3] meses y, cuando ${t.org} lo confirme, suprimirá los datos y entregará un certificado de borrado.`,
        c.modalidad === "saas" && `Se aplicarán, además, los derechos de cambio de proveedor de servicios de tratamiento de datos del capítulo VI del Reglamento (UE) 2023/2854 (Reglamento de Datos).`] },

    { id: "cambios", titulo: "Cambios en el Sistema y nuevas versiones", def: () => true, fuente: "Arts. 3.23 y 43.4 RIA",
      txt: (t) => [
        `${t.Cta} comunicará con al menos [30] días de antelación cualquier cambio del modelo, de su proveedor, de su versión o del funcionamiento del Sistema que pueda afectar a sus resultados, a su clasificación o al cumplimiento.`,
        `${t.Org} podrá probar las nuevas versiones antes de su despliegue y rechazar las que reduzcan la precisión, la seguridad o el cumplimiento acreditados.`,
        c.tipo === "alto" && `Si un cambio constituye una modificación sustancial (artículo 3.23 del RIA), ${t.cta} repetirá la evaluación de la conformidad cuando proceda y actualizará la documentación.`] },

    { id: "incidentes", titulo: "Incidentes y vigilancia", def: () => true, esencial: true, fuente: "Arts. 26.5, 72 y 73 RIA",
      txt: (t) => [
        `${t.Cta} comunicará a ${t.org} cualquier incidente grave o mal funcionamiento del Sistema en un plazo máximo de [24] horas desde que tenga conocimiento, con la información disponible y las medidas adoptadas.`,
        c.tipo === "alto" && `${t.Cta} notificará los incidentes graves a la autoridad de vigilancia del mercado en los plazos del artículo 73 del RIA y mantendrá informado a ${t.org}.`,
        `Ambas partes cooperarán en la investigación de los incidentes y en las medidas correctoras, incluida la suspensión del uso del Sistema cuando sea necesario.`] },

    { id: "auditoria", titulo: "Auditoría y evidencias de cumplimiento", def: () => true, fuente: "Arts. 21 y 74 RIA",
      txt: (t) => [
        `${t.Org}, directamente o mediante terceros independientes, podrá auditar el cumplimiento de estas cláusulas con un preaviso de [15] días, y ${t.cta} facilitará el acceso a la documentación, los registros y las pruebas necesarias.`,
        `${t.Cta} entregará con periodicidad [semestral] un informe con el estado de las obligaciones de estas cláusulas, los incidentes y las métricas de funcionamiento.`,
        `${t.Cta} cooperará con las autoridades competentes, incluida la Agencia Española de Supervisión de la Inteligencia Artificial (AESIA), y les facilitará la información que requieran.`] },

    { id: "alfabetizacion", titulo: "Formación y alfabetización en IA", def: () => true, fuente: "Art. 4 RIA",
      txt: (t) => [
        `${t.Cta} formará al personal de ${t.org} que vaya a usar o supervisar el Sistema sobre su funcionamiento, sus límites, sus riesgos y la supervisión humana, con un mínimo de [N] horas, y entregará los materiales en castellano.`,
        `El personal propio de ${t.cta} que intervenga en la ejecución contará con un nivel suficiente de alfabetización en IA, conforme al artículo 4 del RIA.`] },

    { id: "fria", titulo: "Evaluación de impacto en los derechos fundamentales", def: () => c.ambito === "publico" && c.tipo === "alto", fuente: "Art. 27 RIA",
      txt: (t) => [
        `${t.Cta} colaborará con ${t.org} en la evaluación de impacto en los derechos fundamentales (artículo 27 del RIA) y le facilitará la información sobre el Sistema, los colectivos afectados, los riesgos y las medidas de supervisión necesaria para elaborarla y mantenerla actualizada.`] },

    { id: "gpai", titulo: "Modelos de IA de uso general integrados", def: () => c.tipo === "general", fuente: "Arts. 53 y 55 RIA",
      txt: (t) => [
        `${t.Cta} identificará los modelos de IA de uso general que integra el Sistema, su proveedor, su versión y el lugar donde se procesan los datos, y comunicará cualquier sustitución con la antelación prevista para los cambios.`,
        `${t.Cta} obtendrá y pondrá a disposición de ${t.org} la información que los proveedores de esos modelos deben facilitar a quienes los integran (artículo 53.1.b y anexo XII del RIA), así como su política de derechos de autor y el resumen del contenido usado para entrenarlos.`,
        `${t.Cta} aplicará salvaguardas frente a respuestas inexactas, contenidos ilícitos y fugas de información en el uso previsto por ${t.org}, y documentará las pruebas realizadas.`] },

    { id: "esenciales", titulo: c => c.ambito === "publico" ? "Obligaciones esenciales y penalidades" : "Incumplimiento y responsabilidad", def: () => true, fuente: c => c.ambito === "publico" ? "Arts. 192 y 211 LCSP" : "Código Civil",
      txt: (t, nums) => c.ambito === "publico" ? [
        `Las obligaciones de las cláusulas ${nums} tienen el carácter de obligaciones contractuales esenciales a efectos del artículo 211.1.f) de la LCSP, y su incumplimiento podrá dar lugar a la resolución del contrato.`,
        `El cumplimiento defectuoso o la demora en el cumplimiento de estas cláusulas dará lugar a las penalidades previstas en el artículo 192 de la LCSP: [CUANTÍAS O PORCENTAJES], sin perjuicio de la indemnización de daños y perjuicios.`
      ] : [
        `El incumplimiento de las obligaciones de las cláusulas ${nums} se considerará incumplimiento grave y facultará a ${t.org} para resolver el contrato, sin perjuicio de la indemnización de daños y perjuicios.`,
        `${t.Cta} mantendrá indemne a ${t.org} de las sanciones y reclamaciones derivadas de un incumplimiento del RIA que le sea imputable.`] },

    { id: "criterios", titulo: "Anexo · Criterios de adjudicación orientativos", disponible: () => c.ambito === "publico", def: () => false, anexo: true, fuente: "Art. 145 LCSP",
      nota: () => "Nota para quien redacta: los criterios deben estar vinculados al objeto del contrato, ser proporcionados y garantizar la igualdad de trato (art. 145 LCSP).",
      txt: () => [
        "Calidad de la documentación técnica y de las instrucciones de uso: hasta [N] puntos.",
        "Explicabilidad: capacidad de explicar el papel del Sistema en cada resultado: hasta [N] puntos.",
        "Resultados de pruebas de precisión y de sesgo con datos representativos: hasta [N] puntos.",
        "Tratamiento de los datos en el Espacio Económico Europeo sin acceso desde terceros países: hasta [N] puntos.",
        "Portabilidad: formatos abiertos, entrega del código fuente o licencia libre de los desarrollos: hasta [N] puntos.",
        "Horas y calidad de la formación ofrecida al personal: hasta [N] puntos."] }
  ];

  function disponible(b) { return !b.disponible || b.disponible(); }
  function activo(b) {
    if (!disponible(b)) return false;
    if (b.fijo) return true;
    if (b.id in elegidos) return elegidos[b.id];
    return b.def ? b.def() : false;
  }
  const valor = (v) => (typeof v === "function" ? v(c) : v);

  function documento() {
    const t = terminos(), activos = BLOQUES.filter(activo);
    const principales = activos.filter((b) => !b.anexo), anexos = activos.filter((b) => b.anexo);
    const num = {}; principales.forEach((b, i) => { num[b.id] = i + 1; });
    const ess = principales.filter((b) => b.esencial).map((b) => num[b.id]);
    const nums = ess.length > 1 ? ess.slice(0, -1).join(", ") + " y " + ess[ess.length - 1] : ess.join("");
    const salida = [];
    principales.concat(anexos).forEach((b) => {
      const ps = b.txt(t, nums).filter(Boolean);
      salida.push({ id: b.id, n: b.anexo ? "" : num[b.id], titulo: valor(b.titulo), fuente: valor(b.fuente), parrafos: ps, nota: b.nota ? b.nota(t) : "", anexo: !!b.anexo });
    });
    return salida;
  }

  function bloquesExport() {
    const d = documento(), B = [];
    B.push({ t: "titulo", x: c.ambito === "publico" ? "Cláusulas sobre inteligencia artificial para el pliego" : "Cláusulas sobre inteligencia artificial para el contrato" });
    B.push({ t: "meta", x: `eunomIA · Pliego · ${X().hoy()}` });
    B.push({ t: "p", x: `**Contrato:** ${c.objeto.trim() || "[OBJETO DEL CONTRATO]"}` });
    B.push({ t: "p", x: `**${c.ambito === "publico" ? "Órgano de contratación" : "Entidad contratante"}:** ${c.organo.trim() || "[NOMBRE DEL ÓRGANO O ENTIDAD]"}` });
    d.forEach((cl) => {
      B.push({ t: "h1", x: cl.anexo ? cl.titulo : `Cláusula ${cl.n}. ${cl.titulo}` });
      cl.parrafos.forEach((p, i) => B.push({ t: cl.anexo ? "li" : "p", x: cl.anexo ? p : `${cl.n}.${i + 1}. ${p}` }));
      if (cl.nota) B.push({ t: "nota", x: cl.nota });
    });
    B.push({ t: "nota", x: "Fuentes: Reglamento (UE) 2024/1689 (RIA) modificado por el Reglamento (UE) 2026/1744; RGPD; " + (c.ambito === "publico" ? "Ley 9/2017 (LCSP); " : "") + (c.ens !== "no" ? "Real Decreto 311/2022 (ENS); " : "") + "cláusulas contractuales tipo de la UE para la contratación de IA. Los textos entre corchetes son huecos para completar." });
    return B;
  }

  /* ---------- interfaz ---------- */
  let raiz;
  function radio(name, val, txt, sub) {
    return `<label class="pl-op"><input type="radio" name="${name}" value="${val}"${String(c[name]) === String(val) ? " checked" : ""}><span><b>${txt}</b>${sub ? `<small>${sub}</small>` : ""}</span></label>`;
  }
  function pintar() {
    raiz.innerHTML = `<div class="pl-marco">
      <form class="pl-config" autocomplete="off">
        <fieldset><legend><b>1</b> Ámbito</legend><div class="pl-ops pl-dos">${radio("ambito", "publico", "Sector público", "Pliego conforme a la LCSP")}${radio("ambito", "privado", "Sector privado", "Contrato entre empresas")}</div></fieldset>
        <fieldset><legend><b>2</b> Contrato</legend>
          <label class="pl-campo"><span>${c.ambito === "publico" ? "Órgano de contratación" : "Entidad contratante"} <em>opcional</em></span><input type="text" name="organo" value="${esc(c.organo)}" maxlength="120" placeholder="Ej.: Ayuntamiento de Ejemplo"></label>
          <label class="pl-campo"><span>Objeto del contrato <em>opcional</em></span><input type="text" name="objeto" value="${esc(c.objeto)}" maxlength="160" placeholder="Ej.: asistente virtual de atención ciudadana"></label>
        </fieldset>
        <fieldset><legend><b>3</b> Sistema</legend>
          <div class="pl-ops">${radio("tipo", "alto", "De alto riesgo", "Anexo III o producto del Anexo I")}${radio("tipo", "noalto", "No de alto riesgo", "Incluida la excepción del art. 6.3")}${radio("tipo", "general", "Basado en IA de uso general", "Chatbot, LLM corporativo, asistente")}</div>
          <a class="pl-ayuda" href="#balanza">¿No lo sabes? Pásalo por la Balanza <span aria-hidden="true">↑</span></a>
          <div class="pl-ops pl-tres">${radio("modalidad", "medida", "A medida", "")}${radio("modalidad", "saas", "En la nube", "SaaS")}${radio("modalidad", "servicio", "Servicio", "con IA integrada")}</div>
        </fieldset>
        <fieldset><legend><b>4</b> Datos y seguridad</legend>
          <label class="pl-check"><input type="checkbox" name="datos"${c.datos ? " checked" : ""}><span>Trata datos personales</span></label>
          <label class="pl-campo"><span>Esquema Nacional de Seguridad</span><select name="ens">${[["no", "No aplica"], ["basica", "Categoría básica"], ["media", "Categoría media"], ["alta", "Categoría alta"]].map(([v, x]) => `<option value="${v}"${c.ens === v ? " selected" : ""}>${x}</option>`).join("")}</select></label>
          <p class="pl-sub">Soberanía de los datos</p>
          <div class="pl-ops">${radio("soberania", "eee", "Datos en el EEE", "Almacenamiento y tratamiento en Europa")}${radio("soberania", "acceso", "EEE sin acceso exterior", "Tampoco soporte remoto desde fuera")}${radio("soberania", "soberano", "Proveedor europeo", "Sin sujeción a leyes de terceros países")}</div>
        </fieldset>
        <fieldset class="pl-bloques"><legend><b>5</b> Cláusulas</legend><div class="pl-lista"></div></fieldset>
      </form>
      <div class="pl-salida">
        <div class="pl-acciones">
          <button type="button" class="button button-primary" data-accion="docx">Descargar Word</button>
          <button type="button" class="button bz-boton-borde" data-accion="pdf">PDF</button>
          <button type="button" class="button bz-boton-borde" data-accion="copiar">Copiar</button>
          <span class="pl-cuenta"></span>
        </div>
        <article class="pl-papel" aria-live="polite"></article>
      </div>
    </div>`;
    const form = raiz.querySelector(".pl-config");
    form.addEventListener("input", (e) => leer(form, e));
    form.addEventListener("change", (e) => leer(form, e));
    raiz.querySelector('[data-accion="docx"]').addEventListener("click", () => X().docx(bloquesExport(), `eunomia-pliego-clausulas-ia-${X().hoyArchivo()}.docx`, "Cláusulas sobre IA"));
    raiz.querySelector('[data-accion="pdf"]').addEventListener("click", () => X().imprimir(bloquesExport(), "Cláusulas IA - eunomIA"));
    raiz.querySelector('[data-accion="copiar"]').addEventListener("click", () => X().copiar(X().textoPlano(bloquesExport())));
    lista(); papel();
  }
  function lista() {
    raiz.querySelector(".pl-lista").innerHTML = BLOQUES.filter(disponible).map((b) =>
      `<label class="pl-bloque${b.fijo ? " is-fijo" : ""}"><input type="checkbox" data-b="${b.id}"${activo(b) ? " checked" : ""}${b.fijo ? " disabled" : ""}><span>${esc(valor(b.titulo))}</span>${b.esencial && c.ambito === "publico" ? '<em title="Obligación esencial">E</em>' : ""}</label>`).join("");
  }
  function leer(form, e) {
    const t = e.target;
    if (t.dataset && t.dataset.b) { elegidos[t.dataset.b] = t.checked; papel(); return; }
    const fd = new FormData(form), ambitoAntes = c.ambito;
    c.ambito = fd.get("ambito"); c.organo = fd.get("organo") || ""; c.objeto = fd.get("objeto") || "";
    c.tipo = fd.get("tipo"); c.modalidad = fd.get("modalidad"); c.datos = fd.has("datos"); c.ens = fd.get("ens"); c.soberania = fd.get("soberania");
    if (c.ambito !== ambitoAntes) {
      if (c.ambito === "privado" && c.ens === "media" && !("ens" in elegidos)) c.ens = "no";
      pintar(); return;
    }
    if (t.name !== "organo" && t.name !== "objeto") lista();
    papel();
  }
  function papel() {
    const d = documento(), cont = raiz.querySelector(".pl-papel");
    const html = (s) => X().htmlEnLinea(s);
    cont.innerHTML = `<header><p class="pl-papel-meta">EUNOMIA · PLIEGO · ${esc(X().hoy())}</p>
      <h3>Cláusulas sobre inteligencia artificial</h3>
      <dl><div><dt>Contrato</dt><dd>${html(c.objeto.trim() || "[OBJETO DEL CONTRATO]")}</dd></div><div><dt>${c.ambito === "publico" ? "Órgano de contratación" : "Entidad contratante"}</dt><dd>${html(c.organo.trim() || "[NOMBRE DEL ÓRGANO O ENTIDAD]")}</dd></div></dl></header>
      ${d.map((cl) => `<section class="pl-clausula${cl.anexo ? " is-anexo" : ""}"><h4>${cl.anexo ? "" : `<span>Cláusula ${cl.n}.</span> `}${esc(cl.titulo)}</h4>
        ${cl.anexo ? `<ul>${cl.parrafos.map((p) => `<li>${html(p)}</li>`).join("")}</ul>` : cl.parrafos.map((p, i) => `<p><b>${cl.n}.${i + 1}.</b> ${html(p)}</p>`).join("")}
        ${cl.nota ? `<p class="pl-nota">${esc(cl.nota)}</p>` : ""}<p class="pl-fuente">${esc(cl.fuente)}</p></section>`).join("")}`;
    const huecos = (cont.textContent.match(/\[[^\]]+\]/g) || []).length;
    raiz.querySelector(".pl-cuenta").innerHTML = `<b>${d.filter((x) => !x.anexo).length}</b> cláusulas · <b>${huecos}</b> huecos por completar`;
  }

  function iniciar() { raiz = document.getElementById("pliego-app"); if (raiz) pintar(); }
  function preseleccionar(o) {
    if (!raiz) return;
    if (o.tipo === "alto") c.tipo = "alto"; else if (o.tipo === "noalto" && c.tipo === "alto") c.tipo = "noalto";
    if (o.ambito) c.ambito = o.ambito;
    if (c.ambito === "privado" && c.ens === "media") c.ens = "no";
    pintar();
  }
  window.EuPliego = { iniciar, preseleccionar, _c: c, _doc: documento };
})();
