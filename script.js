(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('.main-nav');
  const dialog = document.querySelector('#resource-dialog');
  const dialogClose = document.querySelector('.dialog-close');
  const resourceButtons = document.querySelectorAll('.resource-button');
  const selectedResourceName = document.querySelector('#selected-resource-name');
  const resourceNameInput = document.querySelector('#resource-name');
  const form = document.querySelector('#resource-form');
  const formStatus = document.querySelector('#form-status');
  const submitButton = document.querySelector('.submit-resource');
  const toast = document.querySelector('#toast');
  const year = document.querySelector('#current-year');
  let resourceUrl = '';
  let toastTimer;

  if (year) {
    year.textContent = '2024';
  }

  if (menuButton && navigation) {
    menuButton.addEventListener('click', () => {
      const isOpen = navigation.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });

    navigation.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navigation.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.prepend(progress);

  const updateScrollProgress = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const value = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
    progress.style.setProperty('--scroll-progress', value.toFixed(4));
  };

  let scrollFrame = 0;
  window.addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(() => {
      updateScrollProgress();
      scrollFrame = 0;
    });
  }, { passive: true });
  updateScrollProgress();

  const sceneDefinitions = [
    ['#proposito', '#064bae'],
    ['#agentes', '#ffe500'],
    ['#areas', '#064bae'],
    ['#recursos', '#ff1738'],
    ['#estandar-nullgen', '#064bae'],
    ['#articulos', '#064bae'],
    ['#licencia', '#ffe500'],
    ['#definicion', '#ffe500'],
    ['#controles', '#064bae'],
    ['#madurez', '#ff1738'],
    ['#aplicacion', '#064bae']
  ];

  const sceneSections = sceneDefinitions
    .map(([selector, color], index) => {
      const section = document.querySelector(selector);
      if (!section) return null;
      section.classList.add('scroll-scene');
      if (index % 2) section.classList.add('flow-reversed');
      section.style.setProperty('--scene-color', color);

      const flow = document.createElement('div');
      flow.className = 'section-flow';
      flow.setAttribute('aria-hidden', 'true');
      flow.innerHTML = `
        <div class="flow-canvas">
          <svg viewBox="0 0 420 190" preserveAspectRatio="none">
            <path class="flow-line flow-line-main" pathLength="1" d="M-22 118 C72 18 198 176 442 42"></path>
            <path class="flow-line flow-line-soft" pathLength="1" d="M-18 150 C118 48 226 198 438 82"></path>
          </svg>
          <i class="flow-glint"></i>
          <span class="flow-bars"><i></i><i></i><i></i><i></i></span>
        </div>`;
      section.append(flow);
      return section;
    })
    .filter(Boolean);

  const updateScrollAtmosphere = () => {
    const available = document.documentElement.scrollHeight - window.innerHeight;
    const value = available > 0 ? Math.min(1, Math.max(0, window.scrollY / available)) : 0;
    document.documentElement.style.setProperty('--page-progress', value.toFixed(4));
    document.documentElement.style.setProperty('--flow-shift', `${((value - 0.5) * 90).toFixed(1)}px`);
  };
  window.addEventListener('scroll', updateScrollAtmosphere, { passive: true });
  updateScrollAtmosphere();

  if ('IntersectionObserver' in window) {
    const sceneObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-discovered');
      });
    }, { threshold: 0.06, rootMargin: '-10% 0px -26% 0px' });
    sceneSections.forEach((section) => sceneObserver.observe(section));
  } else {
    sceneSections.forEach((section) => section.classList.add('is-discovered'));
  }

  const revealTargets = document.querySelectorAll([
    '.purpose-grid',
    '.section-heading',
    '.agents-panel',
    '.section-kicker',
    '.area-card',
    '.resource-heading',
    '.resource-item',
    '.nullgen-grid',
    '.articles-heading',
    '.article-card',
    '.license-grid',
    '.ng-definition-grid',
    '.ng-control-card',
    '.ng-maturity-heading',
    '.ng-matrix',
    '.ng-level',
    '.ng-application-grid',
    '.ng-open-note .container'
  ].join(','));

  document.body.classList.add('motion-ready');
  revealTargets.forEach((target, index) => {
    target.classList.add('reveal-target');
    if (target.classList.contains('resource-item')) target.classList.add('reveal-left');
    target.style.setProperty('--reveal-delay', `${(index % 4) * 70}ms`);
  });

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach((target) => revealObserver.observe(target));
  } else {
    revealTargets.forEach((target) => target.classList.add('is-visible'));
  }

  const heroBoard = document.querySelector('.hero-board');
  if (heroBoard && !reducedMotion) {
    heroBoard.addEventListener('pointermove', (event) => {
      if (event.pointerType === 'touch') return;
      const rect = heroBoard.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      heroBoard.style.setProperty('--board-ry', `${(x * 3.2).toFixed(2)}deg`);
      heroBoard.style.setProperty('--board-rx', `${(-y * 3.2).toFixed(2)}deg`);
    });
    heroBoard.addEventListener('pointerleave', () => {
      heroBoard.style.setProperty('--board-ry', '0deg');
      heroBoard.style.setProperty('--board-rx', '0deg');
    });
  }

  const agentsPanel = document.querySelector('.agents-panel');
  if (agentsPanel && !reducedMotion) {
    agentsPanel.addEventListener('pointermove', (event) => {
      const rect = agentsPanel.getBoundingClientRect();
      agentsPanel.style.setProperty('--panel-x', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
      agentsPanel.style.setProperty('--panel-y', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
    });
  }

  document.querySelectorAll('.area-card, .ng-system').forEach((card) => {
    if (reducedMotion) return;
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      const x = `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`;
      const y = `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`;
      card.style.setProperty(card.classList.contains('ng-system') ? '--ng-x' : '--card-x', x);
      card.style.setProperty(card.classList.contains('ng-system') ? '--ng-y' : '--card-y', y);
    });
  });

  const showToast = () => {
    if (!toast) return;
    window.clearTimeout(toastTimer);
    toast.classList.add('is-visible');
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 4200);
  };

  const openResourceDialog = (button) => {
    const name = button.dataset.resource || 'Recurso de CibersegurIA';
    resourceUrl = button.dataset.url || '';
    form.reset();
    formStatus.textContent = '';
    selectedResourceName.textContent = name;
    resourceNameInput.value = name;
    dialog.showModal();
  };

  resourceButtons.forEach((button) => {
    button.addEventListener('click', () => openResourceDialog(button));
  });

  if (dialogClose) {
    dialogClose.addEventListener('click', () => dialog.close());
  }

  if (dialog) {
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  }

  if (form) {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!form.reportValidity() || !resourceUrl) return;

      const accessWindow = window.open('', '_blank');
      if (accessWindow) {
        accessWindow.document.title = 'Preparando recurso | CibersegurIA';
        accessWindow.document.body.innerHTML = '<p style="font:16px system-ui;padding:32px;color:#052f70">Registrando la finalidad y preparando el recurso…</p>';
      }

      submitButton.disabled = true;
      submitButton.textContent = 'Registrando el uso…';
      formStatus.textContent = '';

      const formData = new FormData(form);
      formData.append('_subject', `Uso de recurso CibersegurIA: ${resourceNameInput.value}`);
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');

      try {
        const response = await fetch(form.action, {
          method: 'POST',
          body: formData,
          headers: { Accept: 'application/json' }
        });

        if (!response.ok) throw new Error('No se pudo registrar el formulario');

        dialog.close();
        showToast();
        if (accessWindow) {
          accessWindow.opener = null;
          accessWindow.location.href = resourceUrl;
        } else {
          window.location.assign(resourceUrl);
        }
        form.reset();
      } catch (error) {
        if (accessWindow) accessWindow.close();
        const subject = encodeURIComponent(`Uso de recurso CibersegurIA: ${resourceNameInput.value}`);
        formStatus.innerHTML = `No hemos podido registrar el formulario. <a href="mailto:ciberseguria@gmail.com?subject=${subject}">Informa del uso por correo</a> para solicitar el acceso.`;
      } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Informar y acceder al recurso';
      }
    });
  }
})();
