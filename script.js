document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initScenariosSlider();
  initFaqAccordion();
  initFaqParallax();
  initTrustParallax();
});

/* ==========================================================
   HEADER: desktop dropdown + mobile burger
   ========================================================== */
function initHeader() {
  // Make header truly sticky (fixed) and reserve space so it never “slides away”
  const header = document.querySelector('.keis-header');
  const applyHeaderOffset = () => {
    if (!header) return;
    const h = Math.round(header.getBoundingClientRect().height);
    document.documentElement.style.setProperty('--keis-header-h', `${h}px`);
  };
  applyHeaderOffset();
  window.addEventListener('resize', applyHeaderOffset);
  const burger = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const closeBtn = document.getElementById('mobileMenuClose');

  const body = document.body;

  const lockScroll = (state) => {
    body.classList.toggle('menu-open', state);
    body.classList.toggle('menu-open-no-scroll', state);
  };

  const openMobile = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger?.setAttribute('aria-expanded', 'true');
    burger?.classList.add('is-open');
    lockScroll(true);
  };

  const closeMobile = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.classList.remove('is-open');
    lockScroll(false);

    // reset submenus
    mobileMenu
      .querySelectorAll('.mobile-has-submenu.submenu-open')
      .forEach((li) => {
        li.classList.remove('submenu-open');
        const btn = li.querySelector('.mobile-submenu-toggle');
        const ul = li.querySelector('.mobile-submenu');
        btn?.setAttribute('aria-expanded', 'false');
        if (ul) {
          ul.hidden = true;
          ul.setAttribute('aria-hidden', 'true');
        }
      });
  };

  burger?.addEventListener('click', (e) => {
    e.preventDefault();
    mobileMenu.classList.contains('is-open') ? closeMobile() : openMobile();
  });

  overlay?.addEventListener('click', closeMobile);
  closeBtn?.addEventListener('click', closeMobile);

  document.querySelectorAll('#mobileMenu a[href^="#"]').forEach((link) => {
    link.addEventListener('click', closeMobile);
  });

  /* Mobile submenu */
  document
    .querySelectorAll('#mobileMenu .mobile-submenu-toggle')
    .forEach((btn) => {
      btn.addEventListener('click', () => {
        const li = btn.closest('.mobile-has-submenu');
        if (!li) return;

        const submenu = li.querySelector('.mobile-submenu');
        const isOpen = li.classList.toggle('submenu-open');

        btn.setAttribute('aria-expanded', String(isOpen));
        if (submenu) {
          submenu.hidden = !isOpen;
          submenu.setAttribute('aria-hidden', String(!isOpen));
        }
      });
    });

  /* Desktop dropdown */
  const desktopTrigger = document.querySelector(
    '.keis-header-nav [data-submenu-trigger]'
  );

  const closeDesktopDropdown = () => {
    document
      .querySelectorAll('.keis-header-nav .has-children.is-open')
      .forEach((li) => {
        li.classList.remove('is-open');
        li
          .querySelector('[aria-haspopup]')
          ?.setAttribute('aria-expanded', 'false');
      });
  };

  desktopTrigger?.addEventListener('click', (e) => {
    e.preventDefault();
    const li = desktopTrigger.closest('.has-children');
    if (!li) return;

    const open = !li.classList.contains('is-open');
    closeDesktopDropdown();
    if (open) {
      li.classList.add('is-open');
      desktopTrigger.setAttribute('aria-expanded', 'true');
    }
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.keis-header-nav')) {
      closeDesktopDropdown();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;

    // close menus
    closeMobile();
    closeDesktopDropdown();

    // close contact modal (if open)
    if (contactModal?.classList.contains('is-open')) {
      closeContactModal();
    }
  });

    /* ==========================================================
     CONTACT MODAL (opened by header CTA + FAQ button)
     ========================================================== */
  const contactModal = document.getElementById('contactModal');
  const openers = document.querySelectorAll('[data-open-contact-modal]');
  const closers = contactModal
    ? contactModal.querySelectorAll('[data-close-contact-modal]')
    : [];

  const isModalOpen = () => contactModal?.classList.contains('is-open');

  const openContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.add('is-open');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    const first = contactModal.querySelector('input, textarea, button');
    first?.focus?.();
  };

  const closeContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.remove('is-open');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };

  openers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeMobile();
      closeDesktopDropdown();
      openContactModal();
    });
  });

  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeContactModal();
    });
  });

  // Removed duplicate Escape handler for contact modal

  contactModal?.querySelector('form')?.addEventListener('submit', (e) => {
    // If the browser blocks submit due to validation, don't close the modal.
    if (!e.target.checkValidity || !e.target.checkValidity()) return;
    setTimeout(() => closeContactModal(), 0);
  });
}

/* ==========================================================
   SCENARIOS SLIDER (with autoplay, pause on hover/focus)
   ========================================================== */
function initScenariosSlider() {
  const root = document.querySelector('.investment-scenarios');
  if (!root) return;

  const windowEl = root.querySelector('.scenarios-band-window');
  const track = root.querySelector('.scenarios-band-track');
  const prevBtn = root.querySelector('.scenarios-navbtn--prev');
  const nextBtn = root.querySelector('.scenarios-navbtn--next');

  if (!windowEl || !track) return;

  // Keep an immutable template of the original slides.
  const originalTemplates = [...track.children].map((n) => n.cloneNode(true));
  const totalSlides = originalTemplates.length;
  if (totalSlides < 2) return;

  let currentIndex = 0;

  // Autoplay (smooth) + pause on hover/focus
  let autoplayId = null;
  const autoplayDelayMs = 4200;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isPaused = false;
  let isAnimating = false;

  let step = 0; // width of one slide + gap
  let gap = 0;
  let visible = 3;
  let cloneCount = 3;
  let slidesAll = [];
  let isJumping = false;

  const readVisibleFromCSS = () => {
    const v = parseInt(getComputedStyle(windowEl).getPropertyValue('--sc-visible') || '3', 10);
    return Number.isFinite(v) && v > 0 ? v : 3;
  };

  const calcMetrics = () => {
    const cs = getComputedStyle(track);
    gap = parseFloat(cs.gap || cs.columnGap || '0') || 0;

    const first = slidesAll[0];
    if (!first) return;

    step = first.offsetWidth + gap;
  };

  const setTranslate = (index) => {
    track.style.transition = '';
    const x = Math.round(-index * step);
    track.style.transform = `translate3d(${x}px,0,0)`;
    isAnimating = true;
  };

  const setTranslateNoAnim = (index) => {
    track.style.transition = 'none';
    const x = Math.round(-index * step);
    track.style.transform = `translate3d(${x}px,0,0)`;
    track.offsetHeight; // force reflow
    track.style.transition = '';
  };

  const build = () => {
    visible = readVisibleFromCSS();
    cloneCount = visible;
    track.innerHTML = '';
    const tail = originalTemplates.slice(-cloneCount).map((n) => n.cloneNode(true));
    const head = originalTemplates.slice(0, cloneCount).map((n) => n.cloneNode(true));
    tail.forEach((n) => track.appendChild(n));
    originalTemplates.forEach((n) => track.appendChild(n.cloneNode(true)));
    head.forEach((n) => track.appendChild(n));
    slidesAll = [...track.children];
    calcMetrics();
    currentIndex = cloneCount;
    setTranslateNoAnim(currentIndex);
  };

  const normalizeAfterTransition = () => {
    if (isJumping) return;
    const firstReal = cloneCount;
    const lastReal = cloneCount + totalSlides - 1;
    if (currentIndex > lastReal) {
      isJumping = true;
      currentIndex = firstReal;
      setTranslateNoAnim(currentIndex);
      isJumping = false;
    } else if (currentIndex < firstReal) {
      isJumping = true;
      currentIndex = lastReal;
      setTranslateNoAnim(currentIndex);
      isJumping = false;
    }
  };

  function stopAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  function startAutoplay() {
    if (prefersReducedMotion) return;
    if (autoplayId) return;
    autoplayId = setInterval(() => {
      if (isPaused) return;
      if (isAnimating) return;
      currentIndex += 1;
      setTranslate(currentIndex);
    }, autoplayDelayMs);
  }

  function pauseAutoplay() { isPaused = true; }
  function resumeAutoplay() { isPaused = false; }

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    isAnimating = false;
    normalizeAfterTransition();
  });

  prevBtn?.addEventListener('click', () => {
    stopAutoplay();
    if (isAnimating) return;
    currentIndex -= 1;
    setTranslate(currentIndex);
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    stopAutoplay();
    if (isAnimating) return;
    currentIndex += 1;
    setTranslate(currentIndex);
    startAutoplay();
  });

  let lastVisible = readVisibleFromCSS();
  const onResize = () => {
    const newVisible = readVisibleFromCSS();
    const real = ((currentIndex - cloneCount) % totalSlides + totalSlides) % totalSlides;
    if (newVisible !== lastVisible) {
      lastVisible = newVisible;
      build();
      currentIndex = cloneCount + real;
      setTranslateNoAnim(currentIndex);
      isAnimating = false;
    } else {
      calcMetrics();
      setTranslateNoAnim(currentIndex);
      isAnimating = false;
    }
  };
  window.addEventListener('resize', onResize);

  build();
  setTranslateNoAnim(currentIndex);
  isAnimating = false;

  windowEl.addEventListener('pointerenter', pauseAutoplay, { passive: true });
  windowEl.addEventListener('pointerleave', resumeAutoplay, { passive: true });
  windowEl.addEventListener('pointerdown', pauseAutoplay, { passive: true });
  windowEl.addEventListener('pointerup', resumeAutoplay, { passive: true });
  windowEl.addEventListener('pointercancel', resumeAutoplay, { passive: true });

  root.addEventListener('focusin', pauseAutoplay);
  root.addEventListener('focusout', resumeAutoplay);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAutoplay();
    else resumeAutoplay();
  });

  startAutoplay();
}

/* ==========================================================
   FAQ ACCORDION
   ========================================================== */
function initFaqAccordion() {
  const root = document.querySelector('.investment-faq');
  if (!root) return;

  const items = Array.from(root.querySelectorAll('.faq-item'));

  const closeItem = (item) => {
    if (!item) return;
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    item.classList.remove('is-open');
    if (panel) panel.hidden = true;
    btn?.setAttribute('aria-expanded', 'false');
  };

  const openItem = (item) => {
    if (!item) return;
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    item.classList.add('is-open');
    if (panel) panel.hidden = false;
    btn?.setAttribute('aria-expanded', 'true');
  };

  const closeAll = () => items.forEach(closeItem);

  items.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (panel) panel.hidden = true;
    btn?.setAttribute('aria-expanded', 'false');

    btn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const isOpen = item.classList.contains('is-open');
      if (isOpen) {
        closeItem(item);
        return;
      }

      closeAll();
      openItem(item);
    });

    item.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  });

  document.addEventListener('click', (e) => {
    const clickedInside = !!e.target.closest('.investment-faq .faq-item');
    if (!clickedInside) closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

/* ==========================================================
   FAQ PARALLAX - DISABLED to prevent background jumping
   Требование: При открытии/закрытии вопросов фон НЕ должен двигаться
   ========================================================== */
function initFaqParallax() {
  const section = document.querySelector('.investment-faq');
  if (!section) return;

  // DISABLED: Set parallax to 0 to prevent background movement
  section.style.setProperty('--faq-parallax-y', '0px');
  
  // Comment out the scroll listener to prevent any movement
  /* 
  const update = () => {
    const vh = window.innerHeight;
    const anchorPxFromTop = 260;
    const anchorY = section.offsetTop + anchorPxFromTop;
    const viewportCenterY = window.scrollY + vh / 2;

    const progress = (viewportCenterY - anchorY) / (vh / 2);
    const y = Math.max(-1, Math.min(1, progress)) * 18;

    section.style.setProperty('--faq-parallax-y', `${y}px`);
  };

  window.addEventListener('scroll', () => requestAnimationFrame(update));
  window.addEventListener('resize', update);
  update();
  */
}

/* ==========================================================
   TRUST PARALLAX (subtle)
   ========================================================== */
function initTrustParallax() {
  const section = document.querySelector('.trust-parallax');
  if (!section) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    section.style.setProperty('--trust-parallax-y', '0px');
    section.style.setProperty('--trust-panel-y', '0px');
    return;
  }

  let raf = 0;
  const update = () => {
    raf = 0;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;

    const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2);
    const y = Math.max(-1, Math.min(1, -progress)) * 62;
    section.style.setProperty('--trust-parallax-y', `${y}px`);

    const py = Math.max(-1, Math.min(1, -progress)) * -18;
    section.style.setProperty('--trust-panel-y', `${py}px`);
  };

  const onScroll = () => {
    if (raf) return;
    raf = requestAnimationFrame(update);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
}