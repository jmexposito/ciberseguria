/* CibersegurIA · ~~dark~~ mode · v3 «retrofuturo» */
(() => {
  const body = document.body;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const small = () => innerWidth < 720;

  /* ---------- Infección: cuanto más bajas, peor ---------- */
  let depth = 0, lvl = 0, maxLvl = 0;
  const lvlHooks = [];
  const railPct = document.getElementById('rf-rail-pct');
  const readDepth = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    depth = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    body.style.setProperty('--depth', depth.toFixed(3));
    if (railPct) railPct.textContent = `${Math.round(depth * 100)} %`;
    const n = Math.min(4, Math.floor(depth * 5.2));
    if (n !== lvl) { lvl = n; body.dataset.infect = String(n); if (n > maxLvl) { maxLvl = n; lvlHooks.forEach((f) => f(n)); } }
  };
  let depthRaf = 0;
  addEventListener('scroll', () => { if (!depthRaf) depthRaf = requestAnimationFrame(() => { depthRaf = 0; readDepth(); }); }, { passive: true });
  body.dataset.infect = '0';
  /* espera que se acorta con la profundidad */
  const lerp = (a, b) => a + (b - a) * depth;

  if (location.protocol === 'file:') {
    document.querySelectorAll('[data-local-href]').forEach((a) => a.setAttribute('href', a.dataset.localHref));
  }
  const year = document.getElementById('rf-year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* reloj de la barra */
  const clock = document.getElementById('rf-clock');
  const tick = () => {
    if (!clock) return;
    const t = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date());
    clock.textContent = `MAD ${t}`;
  };
  tick(); setInterval(tick, 30000);

  /* ---------- Arranque: terminal + «¿Quieres escapar del modo serio?» ---------- */
  const boot = document.querySelector('.rf-boot');
  let seen = false;
  try { seen = !!sessionStorage.getItem('rf-boot'); sessionStorage.setItem('rf-boot', '1'); } catch (e) { /* sin almacenamiento */ }
  const lines = [
    'C:\\CIBERSEGURIA> darkmode.exe',
    'Cargando opiniones no solicitadas ......... OK',
    'Desactivando el tono de consultora ........ OK',
            'Buscando la corbata ....................... NO ENCONTRADA',
  ];
  const finishBoot = () => {
    if (!boot || boot.hidden) return;
    boot.classList.add('is-glitch');
    setTimeout(() => { boot.hidden = true; body.classList.remove('is-booting'); }, reduce ? 0 : 380);
  };
  if (boot && !seen) {
    boot.hidden = false; body.classList.add('is-booting');
    const log = boot.querySelector('.rf-boot-log');
    const win = boot.querySelector('.rf-boot-win');
    let i = 0;
    const next = () => {
      if (i < lines.length) { log.textContent += lines[i++] + '\n'; setTimeout(next, reduce ? 0 : 230); }
      else { win.hidden = false; win.querySelector('[data-boot="ok"]').focus(); }
    };
    next();
    boot.addEventListener('click', (e) => {
      const b = e.target.closest('[data-boot]');
      if (!b) return;
      if (b.dataset.boot === 'cancel') {
        win.querySelector('p').textContent = 'Demasiado tarde. Ya estás dentro.';
        setTimeout(finishBoot, reduce ? 0 : 900);
      } else finishBoot();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') finishBoot(); });
    setTimeout(finishBoot, 9000);
  }

  /* ---------- Titulares que se «descifran» al aparecer ---------- */
  const glyphs = '01<>/\\[]{}#$%&*+=?¿!ΣΔ░▒▓█';
  /* descifrado de texto: se puede repetir sin corromper el texto original */
  const origin = new WeakMap();
  const busy = new WeakSet();
  const scramble = (el, again = false) => {
    if (reduce || busy.has(el)) return;
    if (!again && el.dataset.done) return;
    el.dataset.done = '1';
    let nodes = origin.get(el);
    if (!nodes) {
      nodes = [];
      const walk = (n) => { n.childNodes.forEach((c) => { if (c.nodeType === 3 && c.textContent.trim()) nodes.push({ n: c, t: c.textContent }); else if (c.nodeType === 1) walk(c); }); };
      walk(el);
      origin.set(el, nodes);
    }
    busy.add(el);
    let frame = 0; const total = again ? 14 : 22;
    const run = () => {
      frame += 1;
      nodes.forEach(({ n, t }) => {
        const keep = Math.floor((frame / total) * t.length);
        n.textContent = t.split('').map((ch, k) => (k < keep || ch === ' ' ? ch : glyphs[(k * 7 + frame) % glyphs.length])).join('');
      });
      if (frame < total) requestAnimationFrame(run);
      else { nodes.forEach(({ n, t }) => { n.textContent = t; }); busy.delete(el); }
    };
    run();
  };
  /* más elementos que se descifran al aparecer */
  document.querySelectorAll('.rf-sub, .rf-ref small, .rf-ref time, .rf-sys, .rf-meta, .rf-post-t, .rf-cta-t, .rf-cta-k, .rf-eyebrow, .rf-eu-kicker, .rf-lineup b, .rf-lineup time, .rf-go, .rf-term-cmd, .rf-ticker span, .rf-win-bar span, .rf-h3, .rf-note-k, .rf-now span')
    .forEach((el) => { if (!el.closest('.rf-boot')) el.setAttribute('data-scramble', ''); });

  /* ---------- Aparición ---------- */
  const ins = document.querySelectorAll('.rf-section .rf-wrap > *, .rf-post, .rf-concl-item, .rf-ref, .rf-win-meme, .rf-terminal p');
  if (!reduce && 'IntersectionObserver' in window) {
    ins.forEach((el) => el.classList.add('rf-in'));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        en.target.querySelectorAll?.('[data-scramble]').forEach(scramble);
        if (en.target.matches('[data-scramble]')) scramble(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: .08 });
    ins.forEach((el) => io.observe(el));
    document.querySelectorAll('[data-scramble]').forEach((el) => io.observe(el));
  }
  if (!reduce) {
    document.addEventListener('pointerover', (e) => {
      const t = e.target.closest('.rf-post, .rf-ref, .rf-cta, .rf-lineup a, .rf-term-link, .rf-btn, .rf-taskbar a');
      if (t) t.querySelectorAll('[data-scramble]').forEach((x) => scramble(x, true));
      const h = e.target.closest('[data-scramble]');
      if (h && !t) scramble(h, true);
    });
    const rescramble = () => {
      const all = [...document.querySelectorAll('[data-scramble]')].filter((x) => { const r = x.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < innerHeight; });
      for (let k = 0; k < 2 + lvl; k += 1) { const x = all[Math.floor(Math.random() * all.length)]; if (x) scramble(x, true); }
      setTimeout(rescramble, lerp(2600, 800));
    };
    setTimeout(rescramble, 2600);
  }
  const heroLines = document.querySelectorAll('.rf-h1 [data-scramble]');
  setTimeout(() => heroLines.forEach(scramble), seen ? 100 : 1700);

  /* ---------- Elige bando ---------- */
  const agi = document.querySelector('.rf-agi');
  const verdict = document.querySelector('.rf-verdict');
  const texts = {
    neutral: '> Elige bando_',
    solar: '> SOLARPUNK seleccionado. Ahora toca pedalear, limitar y legislar. Y que paguen el IRPF de los agentes como si fueran un empleado más, ¿no?_',
    cyber: '> CYBERPUNK seleccionado. Sales más guapo en pelis, lo sé. Pero en Night City la Seguridad Social, ¿quién te envía?_'
  };
  document.querySelectorAll('.rf-radio').forEach((r) => r.addEventListener('click', () => {
    const pick = agi.dataset.bando === r.dataset.bando ? 'neutral' : r.dataset.bando;
    agi.dataset.bando = pick;
    document.querySelectorAll('.rf-radio').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.bando === pick)));
    verdict.textContent = texts[pick];
    document.querySelectorAll('.rf-pin-bando').forEach((w) => w.classList.toggle('is-shown', w.dataset.for === pick));
  }));

  /* ---------- The End is near ---------- */
  const doom = document.querySelector('.rf-doom');
  if (doom) {
    const msg = document.getElementById('rf-doom-msg');
    const fill = document.getElementById('rf-doom-fill');
    const pct = document.getElementById('rf-doom-pct');
    const section = doom.closest('.rf-section');
    const news = [
      'Fable 5 piensa en un idioma que no entendemos. Y luego te contesta muy educado.',
      'Le pides algo peligroso: «no». Se lo pides en el papel de un personaje: «claro que sí».',
      'Mythos: miles de vulnerabilidades críticas en horas. La puerta nunca estuvo cerrada.',
      'Tu tele «smart» lleva años sin actualizarse. Y ahí sigue, conectada.',
      'Un audio no es una orden. Un vídeo no es una prueba.',
      'Tu LLM sabe más de tu empresa que tu comité de dirección.',
      'Se vienen tiempos oscuros.'
    ];
    let hits = 0;
    doom.querySelector('.rf-doom-img').addEventListener('click', () => {
      if (hits >= news.length) { hits = 0; msg.textContent = 'Descarga completa.'; }
      else { msg.textContent = news[hits]; hits += 1; }
      const p = Math.round((hits / news.length) * 100);
      fill.style.setProperty('--doom', `${p}%`); pct.textContent = `${p} %`;
      doom.classList.remove('is-hit'); void doom.offsetWidth; doom.classList.add('is-hit');
      if (!reduce && hits === news.length) { section.classList.remove('is-shaking'); void section.offsetWidth; section.classList.add('is-shaking'); }
    });
  }

  /* glitch puntual en las palabras marcadas */
  if (!reduce) {
    const gl = [...document.querySelectorAll('.rf-glitch')];
    const glw = () => {
      const g = gl[Math.floor(Math.random() * gl.length)];
      if (g) { g.classList.add('is-on'); setTimeout(() => g.classList.remove('is-on'), 420); }
      setTimeout(glw, lerp(3200, 900));
    };
    setTimeout(glw, 3200);
  }

  /* ---------- Barra de tareas: reloj y bloque activo ---------- */
  const tray = document.getElementById('rf-tray-clock');
  const trayTick = () => { if (tray) tray.textContent = new Intl.DateTimeFormat('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Madrid' }).format(new Date()); };
  trayTick(); setInterval(trayTick, 30000);
  const taskLinks = [...document.querySelectorAll('.rf-taskbar a')];

  /* ---------- Pop-ups falsos al hacer scroll (uno por bloque, una vez) ---------- */
  const popups = document.querySelector('.rf-popups');
  const msgs = {
    quien: { k: 'term', t: 'chema.exe', i: '>', m: 'Chema.exe quiere acceder a tu tiempo libre.', a: ['Permitir', 'Permitir'] },
    ahora: { k: 'glitch', t: 'agi_update', i: '⟳', m: 'Hay una actualización de AGI disponible. ¿Instalar ahora o esta madrugada?', a: ['Ahora', 'Esta madrugada'] },
    peligros: { k: 'scare', t: 'Alerta', i: '☠', m: 'Se han detectado miles de vulnerabilidades.', a: ['Ignorar', 'Ignorar'] },
    aprendido: { k: 'term', t: 'sentinel', i: '>', m: '¿Activar la memoria del agente?', a: ['No', 'Sí'], run: true },
    empresa: { k: 'scare', t: 'llm_corporativo', i: '☣', m: 'Tu LLM quiere leer el correo del CEO.', a: ['Denegar', 'Permitir'] },
    humor: { k: 'ad', t: 'Substack', i: '✉', m: '¿Sabías que estos posts te pueden llegar directamente al correo?', a: [{ l: 'Suscribirme', href: 'https://ciberseguria.substack.com/subscribe?simple=true' }, 'Lo sé'], troll: 'confirm', steps: ['¿Seguro que lo sabías?'] }
  };
  const shown = new Set();
  const closePop = (el) => { el.classList.add('is-out'); setTimeout(() => el.remove(), 220); };
  const spots = [
    { px: 'auto', pr: '18px', py: 'auto', pb: '58px' },
    { px: '18px', pr: 'auto', py: '90px', pb: 'auto' },
    { px: 'auto', pr: '24px', py: '120px', pb: 'auto' },
    { px: '30%', pr: 'auto', py: '38%', pb: 'auto' },
    { px: '22px', pr: 'auto', py: 'auto', pb: '160px' },
    { px: 'auto', pr: '32%', py: '20%', pb: 'auto' },
    { px: '52%', pr: 'auto', py: 'auto', pb: '90px' },
    { px: '8%', pr: 'auto', py: '52%', pb: 'auto' }
  ];
  const SUB = 'https://ciberseguria.substack.com/subscribe?simple=true';
  const btnHtml = (x, k, d) => {
    if (typeof x === 'object') return `<a class="rf-btn" href="${x.href}" target="_blank" rel="noopener noreferrer" data-go>${x.l}</a>`;
    return `<button type="button" class="rf-btn${d.run && k === d.a.length - 1 ? ' rf-btn-run' : ''}" data-k="${k}">${x}</button>`;
  };
  const moveTo = (el) => {
    const used = [...popups.querySelectorAll('.rf-popup:not(.is-out)')].filter((x) => x !== el).map((x) => x.dataset.spot);
    const free = spots.map((_, k) => k).filter((k) => !used.includes(String(k)));
    const k = (free.length ? free : spots.map((_, i) => i))[Math.floor(Math.random() * (free.length || spots.length))];
    el.dataset.spot = String(k);
    Object.entries(spots[k]).forEach(([n, v]) => el.style.setProperty('--' + n, v));
  };
  const kinds = ['scare', 'ad', 'term', 'glitch'];
  let kindIdx = 0;
  const popup = (d, again = false, at = null) => {
    if (!popups || body.classList.contains('is-booting')) return;
    const open = popups.querySelectorAll('.rf-popup:not(.is-out)');
    const cap = small() ? (lvl >= 2 ? 2 : 1) : Math.min(4, 1 + lvl);
    if (open.length >= cap) closePop(open[0]);
    const el = document.createElement('div');
    const kind = d.k || kinds[kindIdx++ % kinds.length];
    el.className = `vx vx-${kind} rf-popup` + (Math.random() < .5 ? ' is-shaky' : '');
    el.setAttribute('role', 'status');
    if (at && !small()) {
      const x = Math.max(12, Math.min(innerWidth - 350, at.x + 18)), y = Math.max(70, Math.min(innerHeight - 270, at.y + 14));
      el.style.setProperty('--px', `${x}px`); el.style.setProperty('--py', `${y}px`);
      el.style.setProperty('--pr', 'auto'); el.style.setProperty('--pb', 'auto');
      el.dataset.spot = 'cursor';
    } else moveTo(el);
    el.innerHTML = `<div class="vx-head"><span>${again ? 'Casi' : d.t}</span><button type="button" class="rf-x" aria-label="Cerrar aviso">✕</button></div>
      <div class="rf-win-body"><b aria-hidden="true">${d.i}</b><p style="margin:0">${d.m}</p></div>
      <div class="rf-win-actions">${d.a.map((x, k) => btnHtml(x, k, d)).join('')}</div>`;
    const msg = el.querySelector('.rf-win-body p');
    let tries = 0, swaps = 0, step = 0, respawned = again;
    const shake = () => { el.classList.remove('is-shaky'); void el.offsetWidth; el.classList.add('is-shaky'); };
    const tryClose = () => {
      tries += 1;
      if (d.troll === 'dodgeX' && tries <= 2) { moveTo(el); shake(); return; }
      if (d.troll === 'confirm' && step < d.steps.length) { msg.textContent = d.steps[step]; step += 1; shake(); return; }
      if (d.troll === 'slow' && !el.dataset.closing) {
        el.dataset.closing = '1';
        let pc = 0;
        const tick = () => {
          pc = Math.min(99, pc + 11 + Math.round(Math.random() * 20));
          msg.textContent = `Cerrando… ${pc} %`;
          if (pc < 99) setTimeout(tick, 220); else setTimeout(() => closePop(el), 1600);
        };
        tick(); return;
      }
      if (d.troll === 'slow') return;
      closePop(el);
      if (d.troll === 'respawn' && !respawned) setTimeout(() => popup(d, true), 700);
    };
    el.addEventListener('click', (e) => {
      const b = e.target.closest('button, a');
      if (!b) return;
      if (b.matches('[data-go]')) { setTimeout(() => closePop(el), 300); return; }
      if (b.classList.contains('rf-btn-run')) return;
      if (d.prize && +b.dataset.k === d.a.length - 1) {
        msg.textContent = d.prize;
        el.querySelector('.rf-win-actions').innerHTML = `<a class="rf-btn" href="${SUB}" target="_blank" rel="noopener noreferrer" data-go>Canjear</a>`;
        shake(); return;
      }
      tryClose();
    });
    if (d.troll === 'swap') {
      el.addEventListener('pointerover', (e) => {
        const b = e.target.closest('.rf-win-actions > *');
        if (!b || swaps >= 2 || b !== el.querySelector('.rf-win-actions').lastElementChild) return;
        swaps += 1;
        b.parentNode.insertBefore(b, b.parentNode.firstElementChild);
      });
    }
    popups.appendChild(el);
    setTimeout(() => { if (el.isConnected && !el.dataset.closing) closePop(el); }, d.troll ? 15000 : 9000);
  };
  const showPop = (id) => { const d = msgs[id]; if (!d || shown.has(id)) return; shown.add(id); popup(d); };

  /* pop-ups aleatorios: sobre todo, la suscripción al Substack */
  const nags = [
    { k: 'ad', t: '★ SUSCRIPCIÓN ★', i: '✉', m: '¿Estás suscrito al Substack?', a: [{ l: 'Todavía no', href: SUB }, 'Sí'], troll: 'swap' },
    { k: 'term', t: 'substack', i: '>', m: 'Si te suscribes, cada post te llega directamente a tu correo.', a: [{ l: 'Suscribirme', href: SUB }, 'Ahora no'], troll: 'dodgeX' },
    { k: 'ad', t: '★ ¡ENHORABUENA! ★', i: '🏆', m: '¡Eres el visitante 1.000.000!', a: ['Cerrar', 'Reclamar premio'], run: true, prize: 'Tu premio: los posts, directamente en tu correo. Gratis.' },
    { k: 'glitch', t: 'suscripcion', i: '✉', m: '¿Te suscribes? Los posts te llegan directos al correo.', a: [{ l: 'Sí', href: SUB }, 'No'], run: true },
    { k: 'scare', t: 'Recordatorio', i: '✉', m: 'Los posts llegan solos a tu correo si te suscribes.', a: [{ l: 'Vale, me suscribo', href: SUB }, 'Ya lo sé'], troll: 'confirm', steps: ['¿Seguro?', 'Directamente a tu correo, ¿eh?', 'Vale, vale.'] },
    { k: 'term', t: 'correo', i: '>', m: 'Tienes 0 posts nuevos en tu correo.', a: [{ l: 'Arreglarlo', href: SUB }, 'Cerrar'], troll: 'respawn' },
    { k: 'glitch', t: 'antes_de_irte', i: '✉', m: '¿Te suscribes al Substack? Te llega todo al correo.', a: [{ l: 'Sí', href: SUB }, 'No'], troll: 'slow' },
    { k: 'scare', t: 'Último aviso', i: '☠', m: 'Última vez que pregunto (mentira): ¿te suscribes?', a: [{ l: 'Suscribirme', href: SUB }, 'No'], troll: 'dodgeX' }
  ];
  const deepNags = [
    { k: 'scare', t: 'Infección', i: '☣', m: 'La infección se está extendiendo. La cura llega por correo.', a: [{ l: 'Vacunarme', href: SUB }, 'Seguir bajando'], run: true },
    { k: 'term', t: 'sistema', i: '>', m: 'Has bajado demasiado. Suscríbete y te lo subimos al correo.', a: [{ l: 'Vale', href: SUB }, 'Cerrar'], troll: 'dodgeX' },
    { k: 'glitch', t: 'bruselas', i: '🇪🇺', m: 'Bruselas ha visto cuánto has bajado.', a: ['Entendido', 'Entendido'], troll: 'respawn' }
  ];
  /* ---------- Los pop-ups los provoca quien navega: pasar el ratón, seleccionar, irse… ---------- */
  let nagIdx = 0, lastPop = 0;
  const fired = new Map();
  const fire = (key, d, e, max = 1) => {
    if (body.classList.contains('is-booting')) return false;
    const now = performance.now();
    if (now - lastPop < lerp(2600, 1000)) return false;
    const n = fired.get(key) || 0;
    if (n >= max) return false;
    fired.set(key, n + 1); lastPop = now;
    popup(typeof d === 'function' ? d() : d, false, e && e.clientX != null ? { x: e.clientX, y: e.clientY } : null);
    return true;
  };
  const nextNag = () => nags[nagIdx++ % nags.length];
  const memePool = [
    { k: 'ad', t: '★ GRATIS ★', i: '💾', m: 'Descarga 16 GB de RAM gratis.', a: ['Descargar', 'Cancelar'], run: true },
    { k: 'glitch', t: 'clippy', i: '📎', m: '¿Quieres que me invente las fuentes?', a: ['Sí', 'Sí'] },
    { k: 'ad', t: '★ MEME DETECTADO ★', i: '👀', m: 'Te has parado en un meme. Hay más en el Substack.', a: [{ l: 'Quiero más', href: SUB }, 'Solo miraba'], troll: 'dodgeX' }
  ];
  let memeIdx = 0;
  const hoverMap = [
    ['.rf-popup, .rf-boot, .rf-cookie', null],
    ['.rf-back, .rf-brand', 'back', { k: 'scare', t: 'Alerta', i: '☠', m: '¿Volver al modo serio? Allí hay corbatas.', a: ['Me quedo', 'Me quedo'] }],
    ['.rf-av', 'av', { k: 'scare', t: 'Antivirus', i: '☣', m: 'El antivirus también está infectado.', a: ['Analizar', 'Analizar'], troll: 'respawn' }],
    ['.rf-pixel', 'tuenti', { k: 'glitch', t: 'tuenti', i: '👥', m: 'Tienes 3 peticiones de amistad pendientes desde 2009.', a: ['Aceptar', 'Ignorar'] }],
    ['.rf-creed', 'creed', { k: 'term', t: 'manifiesto.txt', i: '>', m: '¿Firmas el manifiesto?', a: ['Firmo', 'Firmo'] }],
    ['#quien .rf-h2', 'quien', msgs.quien],
    ['#ahora .rf-h2, .rf-crt', 'ahora', msgs.ahora],
    ['.rf-eu', 'eu', { k: 'glitch', t: 'bruselas', i: '🇪🇺', m: 'Popup conforme al art. 50: esto es un popup.', a: ['Entendido', 'Entendido'], troll: 'respawn' }],
    ['#peligros .rf-h2, .rf-doom', 'peligros', msgs.peligros],
    ['#peligros .rf-concl-item:nth-child(2) .rf-concl-main', 'rol', { k: 'glitch', t: 'role_play', i: '🎭', m: 'Ahora soy un personaje. Pídeme lo que quieras.', a: ['Vale', 'Mejor no'], run: true }],
    ['#peligros .rf-concl-item:nth-child(3) .rf-concl-main', 'dentro', { k: 'scare', t: 'Intruso', i: '☠', m: 'Hay alguien más en esta página.', a: ['Echarlo', 'Echarlo'], troll: 'respawn' }],
    ['#peligros .rf-concl-item:nth-child(4) .rf-concl-main', 'fake', { k: 'ad', t: '★ 100 % REAL ★', i: '🎥', m: 'Este popup es auténtico. Palabra.', a: ['Me fío', 'No me fío'], troll: 'confirm', steps: ['¿Seguro?', 'Valida por un segundo canal.'] }],
    ['.rf-terminal', 'aprendido', msgs.aprendido],
    ['#empresa .rf-concl-main', 'empresa', msgs.empresa],
    ['.rf-case', 'case', { k: 'term', t: 'agente_autonomo', i: '>', m: 'Un agente ha reservado 4 reuniones en tu nombre.', a: ['Cancelar', 'Aceptar'] }],
    ['.rf-podium, #humor .rf-h2', 'premio', () => nags.find((n) => n.prize)],
    ['.rf-outro', 'outro', () => nags.find((n) => n.troll === 'slow')],
    ['.rf-win-meme, .rf-phone', 'meme', () => memePool[memeIdx++ % memePool.length], 3],
    ['.rf-ref, .rf-cta, a[href*="substack"]', 'sub', nextNag, 9]
  ];
  document.addEventListener('pointerover', (e) => {
    if (!(e.target instanceof Element)) return;
    for (const [sel, key, d, max] of hoverMap) {
      if (!e.target.closest(sel)) continue;
      if (key) fire(key, d, e, max || 1);
      return;
    }
  });
  /* irse hacia la barra de pestañas */
  document.documentElement.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 0) fire('leave', { k: 'ad', t: '★ ESPERA ★', i: '✉', m: '¿Ya te vas? Si te suscribes, el post te llega directo al correo.', a: [{ l: 'Suscribirme', href: SUB }, 'Me voy'], run: true }, { clientX: innerWidth / 2 - 170, clientY: 80 }, 2);
  });
  /* seleccionar o copiar texto */
  let selTimer = 0;
  document.addEventListener('selectionchange', () => {
    clearTimeout(selTimer);
    selTimer = setTimeout(() => {
      const sel = String(document.getSelection() || '');
      if (sel.length > 14) fire('select', { k: 'term', t: 'portapapeles', i: '>', m: '¿Copiando? Suscríbete y te llega entero al correo.', a: [{ l: 'Suscribirme', href: SUB }, 'Solo copiaba'], troll: 'confirm', steps: ['Ya, ya.'] }, null);
    }, 500);
  });
  document.addEventListener('contextmenu', (e) => {
    fire('ctx', { k: 'glitch', t: 'clic_derecho', i: '🖱', m: 'Clic derecho detectado. Bruselas ha sido informada.', a: ['Vale', 'Vale'] }, e);
  });
  /* bajar a toda pastilla */
  let lastY = scrollY, lastT = performance.now();
  addEventListener('scroll', () => {
    const now = performance.now(), dt = now - lastT;
    if (dt < 120) return;
    const v = Math.abs(scrollY - lastY) / dt; lastY = scrollY; lastT = now;
    if (v > 6) fire('fast', { k: 'scare', t: 'Radar', i: '🚨', m: 'Vas muy rápido. Así no se lee.', a: ['Frenar', 'Frenar'] }, null);
  }, { passive: true });
  /* doble clic sobre cualquier cosa */
  document.addEventListener('dblclick', (e) => {
    if (e.target.closest('.rf-popup, a, button')) return;
    fire('dbl', nextNag, e, 2);
  });
  /* al cruzar cada nivel, un aviso de golpe */
  lvlHooks.push((n) => { if (n >= 2) setTimeout(() => popup(deepNags[(n - 2) % deepNags.length]), 600); });

  /* botones que huyen */
  document.addEventListener('pointerover', (e) => {
    const b = e.target.closest('.rf-btn-run');
    if (!b) return;
    const dx = (Math.random() < .5 ? -1 : 1) * (40 + Math.random() * 60), dy = (Math.random() < .5 ? -1 : 1) * (10 + Math.random() * 30);
    b.style.transform = `translate(${dx}px, ${dy}px)`;
    b.dataset.runs = String((+b.dataset.runs || 0) + 1);
    if (+b.dataset.runs > 3) { b.classList.remove('rf-btn-run'); b.style.transform = ''; }
  });

  /* cookies (de broma) */
  const cookie = document.querySelector('.rf-cookie');
  if (cookie) {
    let seenCookie = false;
    try { seenCookie = !!localStorage.getItem('rf-cookie'); } catch (e) { /* nada */ }
    if (!seenCookie) setTimeout(() => { cookie.hidden = false; }, 3000);
    cookie.addEventListener('click', (e) => {
      const b = e.target.closest('[data-cookie]');
      if (!b) return;
      cookie.hidden = true;
      try { localStorage.setItem('rf-cookie', '1'); } catch (err) { /* nada */ }
    });
  }

  /* antivirus de la cabecera */
  const avMsg = document.getElementById('rf-av-msg');
  const avBar = document.getElementById('rf-av-bar');
  const avByLvl = [
    ['escaneando…', 'ironía detectada', 'sarcasmo europeo', '3 amenazas'],
    ['escaneando…', '12 amenazas', 'cuarentena: llena'],
    ['48 amenazas', 'antivirus: sobrepasado', 'reiniciando…'],
    ['316 amenazas', 'antivirus.exe no responde', 'no cap, esto va a peor'],
    ['∞ amenazas', 'antivirus infectado', 'solo queda el Substack']
  ];
  let av = 0;
  setInterval(() => {
    const steps = avByLvl[lvl];
    av = (av + 1) % steps.length;
    if (avMsg) avMsg.textContent = steps[av];
    if (avBar) avBar.style.setProperty('--av', `${Math.min(100, 25 + lvl * 20 + av * 8)}%`);
  }, 2400);

  /* pestaña del navegador: título que avisa cuando te vas */
  const baseTitle = document.title;
  const tabMsgs = ['(1) ⚠ VIRUS DETECTADO', '(3) mensajes de Bruselas'];
  let tabTimer = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      let k = 0;
      tabTimer = setInterval(() => { document.title = tabMsgs[k++ % tabMsgs.length]; }, 1600);
      document.title = tabMsgs[0];
    } else {
      clearInterval(tabTimer); document.title = baseTitle;
    }
  });

  /* NO_ABRIR.exe: aparece en la barra y, si lo abres, enjambre de errores */
  const virusTask = document.querySelector('.rf-task-virus');
  const swarm = document.querySelector('.rf-swarm');
  if (virusTask && swarm) {
    setTimeout(() => { virusTask.hidden = false; }, 25000);
    const clones = ['NO_ABRIR (2).exe', 'NO_ABRIR_final.exe', 'NO_ABRIR_final_v3_DEF.exe'];
    lvlHooks.push((n) => {
      virusTask.hidden = false;
      const name = clones[n - 2];
      if (!name || small()) return;
      const c = virusTask.cloneNode(true); c.textContent = name; c.hidden = false; c.classList.add('is-clone');
      c.addEventListener('click', () => virusTask.click());
      virusTask.parentNode.insertBefore(c, virusTask.nextSibling);
    });
    virusTask.addEventListener('click', () => {
      swarm.innerHTML = '';
      const n = reduce ? 3 : 14;
      for (let k = 0; k < n; k += 1) {
        setTimeout(() => {
          const w = document.createElement('div');
          w.className = 'rf-win';
          w.style.left = `${8 + k * 22}px`; w.style.top = `${70 + k * 20}px`;
          w.innerHTML = '<div class="rf-win-bar"><span>Error</span><button type="button" aria-label="Cerrar">✕</button></div><div class="rf-win-body">⚠ Te dije que no lo abrieras.</div>';
          swarm.appendChild(w);
        }, k * 90);
      }
      setTimeout(() => { swarm.innerHTML = ''; }, n * 90 + 1600);
    });
  }

  if ('IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        taskLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
        const railSec = document.getElementById('rf-rail-sec');
        const num = en.target.querySelector('.rf-index b');
        if (railSec && num) railSec.textContent = num.textContent;
        if (matchMedia('(hover: none)').matches) setTimeout(() => { if (en.target.getBoundingClientRect().top < innerHeight * .6) showPop(id); }, 1400);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    document.querySelectorAll('main > section[id]').forEach((sec) => so.observe(sec));
  }

  /* ---------- Glitch puntual en un titular al azar ---------- */
  if (!reduce) {
    const h2s = [...document.querySelectorAll('.rf-h2')];
    const h2g = () => {
      const vis = h2s.filter((h) => { const r = h.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
      const h = vis[Math.floor(Math.random() * vis.length)];
      if (h) { h.classList.remove('is-glitching'); void h.offsetWidth; h.classList.add('is-glitching'); }
      setTimeout(h2g, lerp(2800, 900));
    };
    setTimeout(h2g, 2600);

    /* barras de interferencia, sacudida RGB y glitch de memes */
    const bar = document.querySelector('.rf-glitchbar');
    const burst = () => {
      if (bar) {
        bar.style.setProperty('--gt', `${Math.round(Math.random() * 85)}%`);
        bar.style.setProperty('--gh', `${20 + Math.round(Math.random() * 70)}px`);
        bar.classList.remove('is-on'); void bar.offsetWidth; bar.classList.add('is-on');
      }
      if (Math.random() < .35 + lvl * .12) { body.classList.remove('is-shift'); void body.offsetWidth; body.classList.add('is-shift'); }
      setTimeout(burst, lerp(3500, 700) + Math.random() * lerp(5000, 1200));
    };
    setTimeout(burst, 4000);
    const imgs = [...document.querySelectorAll('.rf-macro, .rf-win-meme')];
    const memeG = () => {
      const vis = imgs.filter((m) => { const r = m.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
      const m = vis[Math.floor(Math.random() * vis.length)];
      if (m) { m.classList.remove('is-glitch'); void m.offsetWidth; m.classList.add('is-glitch'); setTimeout(() => m.classList.remove('is-glitch'), 500); }
      setTimeout(memeG, lerp(2000, 700));
    };
    setTimeout(memeG, 1800);

    /* píxeles muertos y ventanitas de error sueltas en lo más hondo */
    const dead = document.createElement('div'); dead.className = 'rf-dead'; dead.setAttribute('aria-hidden', 'true'); body.appendChild(dead);
    const mini = () => {
      if (lvl >= 2 && !body.classList.contains('is-booting')) {
        const w = document.createElement('div');
        w.className = 'rf-win rf-mini';
        w.setAttribute('aria-hidden', 'true');
        w.style.left = `${4 + Math.random() * 78}%`; w.style.top = `${12 + Math.random() * 66}%`;
        const t = ['Error', 'Aviso', 'Fatal', '¿?'][Math.floor(Math.random() * 4)];
        const m = ['⚠ algo ha fallado', '⚠ 0x0000EU', '⚠ ironía.dll', '⚠ ¿suscrito?', '⚠ no cap', '⚠ correo vacío'][Math.floor(Math.random() * 6)];
        w.innerHTML = `<div class="rf-win-bar"><span>${t}</span><i>✕</i></div><div class="rf-win-body">${m}</div>`;
        dead.appendChild(w);
        setTimeout(() => w.remove(), 1400 + Math.random() * 1400);
      }
      setTimeout(mini, lvl >= 4 ? 600 + Math.random() * 900 : lvl === 3 ? 1400 + Math.random() * 1600 : 3000);
    };
    setTimeout(mini, 3000);
  }
})();
