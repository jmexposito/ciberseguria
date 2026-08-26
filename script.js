(() => {
  'use strict';
  const data = window.CIBERSEGURIA_CONTENT || { templates: [], chamulleando: [], caraB: [], latest: [] };
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  const templateTrack = document.querySelector('#template-track');
  if (templateTrack) {
    templateTrack.innerHTML = data.templates.map((item, index) => `
      <article class="template-card template-card-${index + 1} tilt-card" data-template-index="${index}">
        <div class="template-card-top"><span>${escapeHTML(item.id)}</span><b>${escapeHTML(item.number)}</b></div>
        <div class="template-symbol" aria-hidden="true"><i></i><i></i><i></i></div>
        <p>${escapeHTML(item.short)}</p><h3>${escapeHTML(item.title)}</h3><small>${escapeHTML(item.description)}</small>
        <a class="template-link resource-button" href="${escapeHTML(item.url)}" target="_blank" rel="noopener noreferrer" data-resource="${escapeHTML(item.title)}" data-url="${escapeHTML(item.url)}">Solicitar plantilla <span aria-hidden="true">↗</span></a>
      </article>`).join('');
  }

  const chamulleandoGrid = document.querySelector('#chamulleando-grid');
  if (chamulleandoGrid) {
    chamulleandoGrid.innerHTML = data.chamulleando.map((post, index) => `
      <article class="cham-card cham-card-${index + 1} tilt-card">
        <a class="cham-image" href="${escapeHTML(post.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${escapeHTML(post.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>
        <div class="cham-note"><span>Selección ${escapeHTML(post.number)}</span><time datetime="${escapeHTML(post.dateTime)}">${escapeHTML(post.date)}</time></div>
        <h3><a href="${escapeHTML(post.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(post.title)}</a></h3><p>${escapeHTML(post.description)}</p>
        <a class="cham-read" href="${escapeHTML(post.url)}" target="_blank" rel="noopener noreferrer">Seguir la idea <span aria-hidden="true">↗</span></a>
      </article>`).join('');
  }

  const caraBStack = document.querySelector('#cara-b-stack');
  if (caraBStack) {
    const caraBProjects = data.caraB || [];
    caraBStack.innerHTML = caraBProjects.map((project, index) => {
      const ring = Math.floor(index / 6);
      const ringStart = ring * 6;
      const itemsInRing = Math.min(6, caraBProjects.length - ringStart);
      const slot = index - ringStart;
      const angle = (215 + slot * (360 / Math.max(1, itemsInRing)) + ring * 28) * Math.PI / 180;
      const radius = project.featured ? 250 : 295 + (slot % 2) * 25 + ring * 82;
      const openX = Math.cos(angle) * radius - (slot === 3 ? 180 : 0);
      const openY = Math.sin(angle) * radius * 0.78 - (slot === 3 ? 70 : 0);
      const stackX = ((index % 3) - 1) * 13 + Math.floor(index / 3) * 7;
      const stackY = index * 9 - 10;
      const initialRotation = ((index * 19) % 23) - 11;
      const finalRotation = ((index * 29) % 19) - 9;
      const number = String(index + 1).padStart(2, '0');
      const statusClass = project.status === 'live' ? 'is-live' : project.status === 'experiment' ? 'is-experiment' : 'is-coming-soon';
      const art = project.featured
        ? `<div class="cara-b-live-art" aria-hidden="true"><span>90:00</span><div><i></i><i></i><i></i><i></i><i></i></div><b>▶</b></div>`
        : `<div class="cara-b-placeholder-art" aria-hidden="true"><span>${number}</span><i></i><i></i><b>${escapeHTML(project.type)}</b></div>`;
      const actionLabel = project.featured ? 'Abrir 90 Minutos' : 'Abrir ejemplo';
      return `
        <div class="cara-b-positioner${project.featured ? ' is-featured' : ''}" data-cara-b-index="${index}" data-stack-x="${stackX}" data-stack-y="${stackY}" data-open-x="${openX.toFixed(2)}" data-open-y="${openY.toFixed(2)}" data-open-z="${20 + (index % 4) * 12}" data-initial-rotation="${initialRotation}" data-final-rotation="${finalRotation}" data-scale="${project.featured ? '1.08' : '1'}">
          <a class="cara-b-object cara-b-object-${(index % 4) + 1} ${statusClass}${project.featured ? ' is-featured' : ''}" href="${escapeHTML(project.url)}" target="_blank" rel="noopener noreferrer" aria-labelledby="${escapeHTML(project.id)}-title">
            <div class="cara-b-piece-top"><span>${escapeHTML(project.type)}</span><b>${project.placeholder ? 'PLACEHOLDER' : 'PROYECTO ACTIVO'} · ${number}</b></div>
            ${art}
            <div class="cara-b-object-copy"><h3 id="${escapeHTML(project.id)}-title">${escapeHTML(project.title)}</h3><p>${escapeHTML(project.description)}</p><div class="cara-b-object-actions"><span class="cara-b-state ${statusClass}">${escapeHTML(project.statusLabel)}</span><span class="cara-b-open">${actionLabel} <span aria-hidden="true">↗</span></span></div></div>
          </a>
        </div>`;
    }).join('');
  }

  const latestGrid = document.querySelector('#latest-grid');
  if (latestGrid) {
    latestGrid.innerHTML = data.latest.map((post, index) => `
      <article class="latest-card latest-card-${index + 1} tilt-card" data-position="${String(index + 1).padStart(2, '0')}">
        <span class="latest-index" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
        <a class="latest-image" href="${escapeHTML(post.url)}" target="_blank" rel="noopener noreferrer" tabindex="-1" aria-hidden="true"><img src="${escapeHTML(post.image)}" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></a>
        <div class="latest-copy"><time datetime="${escapeHTML(post.dateTime)}">${escapeHTML(post.date)}</time><h3><a href="${escapeHTML(post.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(post.title)}</a></h3><p>${escapeHTML(post.description)}</p><a class="latest-read" href="${escapeHTML(post.url)}" target="_blank" rel="noopener noreferrer" aria-label="Leer ${escapeHTML(post.title)} en Substack">↗</a></div>
      </article>`).join('');
  }

  document.querySelectorAll('img').forEach((image) => image.addEventListener('error', () => image.closest('.cham-image, .latest-image')?.classList.add('image-missing'), { once: true }));
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');
  if (menuButton && navigation) {
    const menuLabel = menuButton.querySelector('.sr-only');
    const setMenuState = (open, returnFocus = false) => {
      navigation.classList.toggle('is-open', open);
      menuButton.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('menu-open', open);
      if (menuLabel) menuLabel.textContent = open ? 'Cerrar navegación' : 'Abrir navegación';
      if (returnFocus) menuButton.focus();
    };
    menuButton.addEventListener('click', () => {
      setMenuState(!navigation.classList.contains('is-open'));
    });
    navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuState(false)));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && navigation.classList.contains('is-open')) setMenuState(false, true);
    });
    window.addEventListener('resize', () => { if (window.innerWidth >= 900) setMenuState(false); });
  }

  const progress = document.createElement('div');
  progress.className = 'scroll-progress'; progress.setAttribute('aria-hidden', 'true'); document.body.prepend(progress);
  const chapters = [...document.querySelectorAll('.chapter[id]')];
  const railLinks = [...document.querySelectorAll('[data-rail-target]')];
  if ('IntersectionObserver' in window && chapters.length) {
    const chapterObserver = new IntersectionObserver((entries) => {
      const active = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!active) return;
      document.body.dataset.chapter = active.target.dataset.chapter || '';
      railLinks.forEach((link) => link.classList.toggle('is-active', link.dataset.railTarget === active.target.id));
    }, { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.1, 0.5] });
    chapters.forEach((chapter) => chapterObserver.observe(chapter));
  }
  const agentsOpening = document.querySelector('.agents-opening');
  const agentsTitle = document.querySelector('.agents-title');
  const templateStory = document.querySelector('.template-story');
  const templateViewport = document.querySelector('.template-viewport');
  const templateProgress = document.querySelector('#template-progress');
  const templateCurrent = document.querySelector('#template-current');
  const caraBStory = document.querySelector('.cara-b');
  const caraBTitle = document.querySelector('.cara-b-title');
  const caraBPositioners = [...document.querySelectorAll('.cara-b-positioner')];
  let frame = 0;
  const updateScroll = () => {
    frame = 0;
    const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    progress.style.setProperty('--scroll-progress', Math.min(1, Math.max(0, window.scrollY / available)).toFixed(4));
    document.documentElement.style.setProperty('--page-y', `${Math.round(window.scrollY * 0.035)}px`);
    if (agentsOpening && agentsTitle && !reducedMotionQuery.matches) {
      const agentsRect = agentsOpening.getBoundingClientRect();
      const reveal = Math.min(1, Math.max(0, (window.innerHeight - agentsRect.top) / (window.innerHeight * 0.72)));
      const firstWord = Math.min(1, reveal * 1.24);
      const secondWord = Math.min(1, Math.max(0, (reveal - 0.16) * 1.38));
      agentsTitle.style.setProperty('--agents-one-y', `${((1 - firstWord) * 48).toFixed(2)}px`);
      agentsTitle.style.setProperty('--agents-one-opacity', firstWord.toFixed(4));
      agentsTitle.style.setProperty('--agents-one-clip', `${((1 - firstWord) * 100).toFixed(2)}%`);
      agentsTitle.style.setProperty('--agents-two-y', `${((1 - secondWord) * 54).toFixed(2)}px`);
      agentsTitle.style.setProperty('--agents-two-opacity', secondWord.toFixed(4));
      agentsTitle.style.setProperty('--agents-two-clip', `${((1 - secondWord) * 100).toFixed(2)}%`);
      agentsTitle.style.setProperty('--agents-line-scale', secondWord.toFixed(4));
    }
    const desktopMotion = window.innerWidth >= 900 && !reducedMotionQuery.matches;
    if (templateStory && templateTrack && templateViewport && desktopMotion) {
      const distance = Math.max(1, templateStory.offsetHeight - window.innerHeight);
      const value = Math.min(1, Math.max(0, (window.scrollY - templateStory.offsetTop) / distance));
      const shift = Math.max(0, templateTrack.scrollWidth - templateViewport.clientWidth + 72);
      templateTrack.style.transform = `translate3d(${-value * shift}px,0,0)`;
      if (templateProgress) templateProgress.style.transform = `scaleX(${value})`;
      if (templateCurrent) templateCurrent.textContent = String(Math.min(7, Math.floor(value * 7) + 1)).padStart(2, '0');
    } else if (templateTrack) templateTrack.style.transform = '';
    if (caraBStory && caraBPositioners.length && desktopMotion) {
      const rect = caraBStory.getBoundingClientRect();
      const distance = Math.max(1, caraBStory.offsetHeight - window.innerHeight);
      const value = Math.min(1, Math.max(0, (window.scrollY - caraBStory.offsetTop) / distance));
      const entrance = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / (window.innerHeight * 0.72)));
      const rawSpread = Math.min(1, Math.max(0, (value - 0.045) / 0.57));
      const spread = rawSpread * rawSpread * (3 - 2 * rawSpread);
      const activeIndex = Math.min(caraBPositioners.length - 1, Math.floor(Math.min(0.999, value) * caraBPositioners.length));
      caraBStory.style.setProperty('--cara-b-progress', value.toFixed(4));
      caraBStory.style.setProperty('--cara-b-flip-angle', `${(entrance * 180).toFixed(2)}deg`);
      caraBTitle?.style.setProperty('--cara-b-title-y', `${((1 - entrance) * 38).toFixed(2)}px`);
      caraBPositioners.forEach((positioner, index) => {
        const stackX = Number(positioner.dataset.stackX);
        const stackY = Number(positioner.dataset.stackY);
        const openX = Number(positioner.dataset.openX);
        const openY = Number(positioner.dataset.openY);
        const openZ = Number(positioner.dataset.openZ);
        const initialRotation = Number(positioner.dataset.initialRotation);
        const finalRotation = Number(positioner.dataset.finalRotation);
        const intendedScale = Number(positioner.dataset.scale);
        const x = stackX + (openX - stackX) * spread;
        const y = stackY + (openY - stackY) * spread;
        const z = (caraBPositioners.length - index) * 18 * (1 - spread) + openZ * spread + (index === activeIndex ? 70 : 0);
        const rotation = initialRotation + (finalRotation - initialRotation) * spread;
        const rotateX = -7 * (1 - spread) + Math.cos(index * 1.7 + value * 4) * spread * 2.2;
        const rotateY = (index % 2 ? -1 : 1) * 12 * (1 - spread) + Math.sin(index + value * 3) * spread * 3.2;
        const activeBoost = index === activeIndex ? 0.055 : 0;
        const scale = 0.87 + (intendedScale - 0.87) * spread + activeBoost;
        positioner.classList.toggle('is-active', index === activeIndex);
        positioner.style.zIndex = String(index === activeIndex ? 90 : Math.round(30 + z));
        positioner.style.setProperty('--object-rotation', `${rotation.toFixed(2)}deg`);
        positioner.style.transform = `translate3d(calc(-50% + ${x.toFixed(2)}px),calc(-50% + ${y.toFixed(2)}px),${z.toFixed(2)}px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) rotateZ(${rotation.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
      });
    } else if (caraBStory) {
      caraBStory.style.removeProperty('--cara-b-progress');
      caraBStory.style.removeProperty('--cara-b-flip-angle');
      caraBTitle?.style.removeProperty('--cara-b-title-y');
      caraBPositioners.forEach((positioner) => { positioner.classList.remove('is-active'); positioner.style.transform = ''; positioner.style.zIndex = ''; positioner.style.removeProperty('--object-rotation'); });
    }
  };
  const requestScrollUpdate = () => { if (!frame) frame = window.requestAnimationFrame(updateScroll); };
  window.addEventListener('scroll', requestScrollUpdate, { passive: true }); window.addEventListener('resize', requestScrollUpdate); reducedMotionQuery.addEventListener?.('change', requestScrollUpdate); updateScroll();

  const revealTargets = document.querySelectorAll('.section-heading,.template-heading,.preflight-strip,.values-heading,.area-card,.resource-heading,.resource-item,.nullgen-grid,.chamulleando-heading,.cham-card,.articles-heading,.latest-card,.license-grid,.ng-definition-grid,.ng-control-card,.ng-maturity-heading,.ng-matrix,.ng-level,.ng-application-grid,.ng-open-note .container');
  document.body.classList.add('motion-ready');
  revealTargets.forEach((target, index) => { target.classList.add('reveal-target'); target.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`); });
  if (!reducedMotionQuery.matches && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (!entry.isIntersecting) return; entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target);
    }), { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((target) => revealObserver.observe(target));
  } else revealTargets.forEach((target) => target.classList.add('is-visible'));
  if (!reducedMotionQuery.matches) {
    const hero = document.querySelector('.hero-experience');
    hero?.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      hero.style.setProperty('--hero-x', `${((event.clientX - rect.left) / rect.width - 0.5) * 18}px`);
      hero.style.setProperty('--hero-y', `${((event.clientY - rect.top) / rect.height - 0.5) * 18}px`);
    });
    caraBStack?.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch' || window.innerWidth < 900) return;
      const rect = caraBStack.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      caraBStack.style.setProperty('--cara-b-rx', `${(-y * 2.6).toFixed(2)}deg`);
      caraBStack.style.setProperty('--cara-b-ry', `${(x * 3.8).toFixed(2)}deg`);
    });
    caraBStack?.addEventListener('pointerleave', () => { caraBStack.style.setProperty('--cara-b-rx', '0deg'); caraBStack.style.setProperty('--cara-b-ry', '0deg'); });
    document.querySelectorAll('.tilt-card').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        if (event.pointerType === 'touch') return;
        const rect = card.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width - 0.5; const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--tilt-x', `${(-y * 3).toFixed(2)}deg`); card.style.setProperty('--tilt-y', `${(x * 4).toFixed(2)}deg`); card.style.setProperty('--pointer-x', `${((x + 0.5) * 100).toFixed(1)}%`); card.style.setProperty('--pointer-y', `${((y + 0.5) * 100).toFixed(1)}%`);
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--tilt-x', '0deg'); card.style.setProperty('--tilt-y', '0deg'); });
    });
    document.querySelectorAll('.magnetic').forEach((element) => {
      element.addEventListener('pointermove', (event) => { const rect = element.getBoundingClientRect(); element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * 0.08}px,${(event.clientY - rect.top - rect.height / 2) * 0.08}px)`; });
      element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    });
  }

  const dialog = document.querySelector('#resource-dialog'); const dialogClose = document.querySelector('.dialog-close');
  const form = document.querySelector('#resource-form'); const formStatus = document.querySelector('#form-status'); const submitButton = document.querySelector('.submit-resource');
  const selectedResourceName = document.querySelector('#selected-resource-name'); const resourceNameInput = document.querySelector('#resource-name'); const toast = document.querySelector('#toast');
  let resourceUrl = ''; let toastTimer;
  const showToast = () => { if (!toast) return; clearTimeout(toastTimer); toast.classList.add('is-visible'); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 4200); };
  const openResourceDialog = (trigger) => {
    if (!dialog || !form) return;
    const name = trigger.dataset.resource || 'Recurso de CibersegurIA'; resourceUrl = trigger.dataset.url || trigger.href || '';
    form.reset(); if (formStatus) formStatus.textContent = ''; if (selectedResourceName) selectedResourceName.textContent = name; if (resourceNameInput) resourceNameInput.value = name; dialog.showModal();
  };
  document.querySelectorAll('.resource-button').forEach((trigger) => trigger.addEventListener('click', (event) => { event.preventDefault(); openResourceDialog(trigger); }));
  dialogClose?.addEventListener('click', () => dialog.close());
  dialog?.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.querySelector('#current-year')?.replaceChildren('2024');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault(); if (!form.reportValidity() || !resourceUrl) return;
    const accessWindow = window.open('', '_blank');
    if (accessWindow) { accessWindow.document.title = 'Preparando recurso | CibersegurIA'; accessWindow.document.body.innerHTML = '<p style="font:16px system-ui;padding:32px;color:#052f70">Registrando la finalidad y preparando el recurso…</p>'; }
    submitButton.disabled = true; submitButton.textContent = 'Registrando el uso…'; formStatus.textContent = '';
    const formData = new FormData(form); formData.append('_subject', `Uso de recurso CibersegurIA: ${resourceNameInput.value}`); formData.append('_template', 'table'); formData.append('_captcha', 'false');
    try {
      const response = await fetch(form.action, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error('No se pudo registrar el formulario');
      dialog.close(); showToast();
      if (accessWindow) { accessWindow.opener = null; accessWindow.location.href = resourceUrl; } else window.location.assign(resourceUrl);
      form.reset();
    } catch (error) {
      if (accessWindow) accessWindow.close();
      const subject = encodeURIComponent(`Uso de recurso CibersegurIA: ${resourceNameInput.value}`);
      formStatus.innerHTML = `No hemos podido registrar el formulario. <a href="mailto:ciberseguria@gmail.com?subject=${subject}">Informa del uso por correo</a> para solicitar el acceso.`;
    } finally { submitButton.disabled = false; submitButton.textContent = 'Informar y acceder al recurso'; }
  });
})();
