document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initScenariosSlider();
  initFaqAccordion();
  initFaqParallax();
  initTrustParallax();
  initTelegramLeads();
  initFormsUX();

  if (isDev()) {
    console.log('[fraud/script.js] All initialization functions completed');
  }
});


/* ==========================================================
   HELPER: Check if in development mode
   ========================================================== */
function isDev() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/* ==========================================================
   FORMS UX: placeholder typing + subtle CTA pulse + pressed state
   ========================================================== */
function initFormsUX() {
  const forms = document.querySelectorAll('form.hero-form');
  if (!forms.length) return;

  const mapPhrases = {
    name: [
      'Иван Петров',
      'Евгений, добрый день',
      'Как к вам обращаться?'
    ],
    phone: [
      '+7 900 123-45-67',
      '+7 ___ ___-__-__',
      'Укажите номер для связи'
    ],
    message: [
      'Кратко: перевёл деньги, вывести не дают…',
      'Опишите, что произошло и когда',
      'Какая сумма и куда переводили?'
    ],
    question: [
      'Опишите, что произошло и когда',
      'Какая сумма и куда переводили?',
      'Что отвечает банк/получатель?'
    ],
    text: [
      'Кратко опишите ситуацию',
      'Что произошло?',
      'Какие есть доказательства?'
    ]
  };

  const startTyping = (el, phrases) => {
    if (!el || !phrases?.length) return;

    let phraseIdx = 0;
    let typingTimer = null;

    const canAnimate = () =>
      document.activeElement !== el &&
      (el.value || '').trim() === '';

    const setPh = (s) => {
      if (!canAnimate()) return;
      el.setAttribute('placeholder', s);
    };

    const typeOnce = (phrase) => {
      if (!canAnimate()) return;

      let i = 0;
      setPh('');
      el.classList.add('is-typing');

      if (typingTimer) clearInterval(typingTimer);
      typingTimer = setInterval(() => {
        if (!canAnimate()) {
          clearInterval(typingTimer);
          typingTimer = null;
          el.classList.remove('is-typing');
          return;
        }

        i += 1;
        setPh(phrase.slice(0, i));

        if (i >= phrase.length) {
          clearInterval(typingTimer);
          typingTimer = null;
          setTimeout(() => {
            if (canAnimate()) el.classList.remove('is-typing');
          }, 600);
        }
      }, 42);
    };

    const tick = () => {
      if (!canAnimate()) return;
      const phrase = phrases[phraseIdx % phrases.length];
      phraseIdx += 1;
      typeOnce(phrase);
    };

    // старт + каждые 3 секунды
    tick();
    const intervalId = setInterval(tick, 3000);

    el.addEventListener('focus', () => el.classList.remove('is-typing'));
    el.addEventListener('input', () => {
      if ((el.value || '').trim() !== '') el.classList.remove('is-typing');
    });

    // если нужно будет отписаться — можно хранить intervalId, но сейчас не требуется
  };

  forms.forEach((form) => {
    form.querySelectorAll('input, textarea').forEach((el) => {
      const n = (el.getAttribute('name') || '').trim();
      if (!n || !mapPhrases[n]) return;
      startTyping(el, mapPhrases[n]);
    });

    const submitBtn = form.querySelector('button[type="submit"], .btn-primary');
    if (submitBtn) {
      submitBtn.classList.add('keis-cta-pulse');

      submitBtn.addEventListener('pointerdown', () => {
        submitBtn.classList.add('is-pressed');
      });

      const clear = () => submitBtn.classList.remove('is-pressed');
      submitBtn.addEventListener('pointerup', clear);
      submitBtn.addEventListener('pointercancel', clear);
      submitBtn.addEventListener('mouseleave', clear);
    }
  });
}
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
    if (!mobileMenu) return;
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
  if (!root) {
    if (isDev()) console.warn('[initScenariosSlider] .investment-scenarios section not found on this page');
    return;
  }

  const windowEl = root.querySelector('.scenarios-band-window');
  const track = root.querySelector('.scenarios-band-track');
  const prevBtn = root.querySelector('.scenarios-navbtn--prev') || document.querySelector('.investment-scenarios .scenarios-navbtn--prev');
  const nextBtn = root.querySelector('.scenarios-navbtn--next') || document.querySelector('.investment-scenarios .scenarios-navbtn--next');

  if (!windowEl || !track) {
    if (isDev()) console.warn('[initScenariosSlider] Missing required elements: windowEl or track');
    return;
  }

// Keep an immutable template of the original slides.
// IMPORTANT: backgrounds are currently assigned via CSS rules that can break
// when we clone/reorder slides for an infinite carousel. So we snapshot the
// real slide media backgrounds once and re-apply them to every clone.
const originalNodes = [...track.children];
const originalTemplates = originalNodes.map((n) => n.cloneNode(true));
const totalSlides = originalTemplates.length;
if (totalSlides < 2) return;

const templateBgs = originalNodes.map((slide) => {
  const media = slide.querySelector?.('.scenario-slide-media');
  if (!media) return '';
  const bg = getComputedStyle(media).backgroundImage;
  return bg && bg !== 'none' ? bg : '';
});

const applyBgByRealIndex = (slideEl, realIdx) => {
  if (!slideEl) return;
  const media = slideEl.querySelector?.('.scenario-slide-media');
  if (!media) return;
  const bg = templateBgs[realIdx];
  if (!bg) return;
  media.style.backgroundImage = bg;
};

const mod = (n, m) => ((n % m) + m) % m;

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
    // smooth animation for autoplay + arrow clicks
    track.style.transition = 'transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1)';
    const x = Math.round(-index * step);
    track.style.transform = `translate3d(${x}px,0,0)`;
    isAnimating = true;
  };
  
  const setTranslateNoAnim = (index) => {
    // instant jump (for build + loop normalize)
    track.style.transition = 'none';
    const x = Math.round(-index * step);
    track.style.transform = `translate3d(${x}px,0,0)`;
    track.offsetHeight; // force reflow
    track.style.transition = 'transform 520ms cubic-bezier(0.22, 0.61, 0.36, 1)';
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
      // Re-apply backgrounds after an instant jump (Safari/Chrome can drop paints on transformed parents)
      slidesAll = [...track.children];
      slidesAll.forEach((slideEl, idxAll) => {
        const realIdx = mod(idxAll - cloneCount, totalSlides);
        applyBgByRealIndex(slideEl, realIdx);
      });
      isJumping = false;
    } else if (currentIndex < firstReal) {
      isJumping = true;
      currentIndex = lastReal;
      setTranslateNoAnim(currentIndex);
      // Re-apply backgrounds after an instant jump (Safari/Chrome can drop paints on transformed parents)
      slidesAll = [...track.children];
      slidesAll.forEach((slideEl, idxAll) => {
        const realIdx = mod(idxAll - cloneCount, totalSlides);
        applyBgByRealIndex(slideEl, realIdx);
      });
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
    slidesAll.forEach((slideEl, idxAll) => {
      const realIdx = mod(idxAll - cloneCount, totalSlides);
      applyBgByRealIndex(slideEl, realIdx);
    });
    isPaused = false;
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
  if (!root) {
    if (isDev()) console.warn('[initFaqAccordion] .investment-faq section not found on this page');
    return;
  }

  const items = Array.from(root.querySelectorAll('.faq-item'));

  const closeItem = (item) => {
    if (!item) return;
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    item.classList.remove('is-open');
    // Rely on CSS for show/hide animation
    btn?.setAttribute('aria-expanded', 'false');
  };

  const openItem = (item) => {
    if (!item) return;
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    item.classList.add('is-open');
    // Rely on CSS for show/hide animation
    btn?.setAttribute('aria-expanded', 'true');
  };

  const closeAll = () => items.forEach(closeItem);

  items.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    // Start closed - CSS will handle visibility
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
   FAQ PARALLAX
   ========================================================== */
function initFaqParallax() {
  const section = document.querySelector('.investment-faq');
  if (!section) {
    if (isDev()) console.warn('[initFaqParallax] .investment-faq section not found on this page');
    return;
  }

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
}

/* ==========================================================
   TRUST PARALLAX (subtle)
   ========================================================== */
function initTrustParallax() {
  const section = document.querySelector('.trust-parallax');
  if (!section) {
    if (isDev()) console.warn('[initTrustParallax] .trust-parallax section not found on this page');
    return;
  }

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

/* ==========================================================
   TELEGRAM LEADS (send forms to /fraud/api/telegram.php)
   - Works for contact modal form and hero form.
   - No layout changes; only JS submit interception.
   ========================================================== */
function initTelegramLeads() {
  // Endpoint relative to site root. For local dev and Timeweb it should work as-is.
  const ENDPOINT = '/fraud/api/telegram.php';

  const forms = new Set();

  // 1) Contact modal form
  const contactModal = document.getElementById('contactModal');
  const contactForm = contactModal?.querySelector('form');
  if (contactForm) forms.add(contactForm);

  // 2) Hero / page forms (best-effort selectors)
  document
    .querySelectorAll('form.hero-form, form.keis-form, form[data-tg-lead], .hero-form form')
    .forEach((f) => forms.add(f));

  if (!forms.size) {
    if (isDev()) console.warn('[initTelegramLeads] No forms found for Telegram submit hook');
    return;
  }

  const toFormData = (form) => {
    const fd = new FormData(form);

    // Common field normalization (don't break existing names)
    const getAny = (...keys) => {
      for (const k of keys) {
        const v = fd.get(k);
        if (typeof v === 'string' && v.trim()) return v.trim();
      }
      return '';
    };

    if (!fd.get('name')) fd.set('name', getAny('fullname', 'your_name', 'username'));
    if (!fd.get('phone')) fd.set('phone', getAny('tel', 'phone_number'));
    if (!fd.get('message')) fd.set('message', getAny('question', 'text', 'comment', 'situation'));

    // Helpful meta
    if (!fd.get('page')) fd.set('page', window.location.href);

    // Honeypot (must stay empty)
    if (!fd.get('website')) fd.set('website', '');

    return fd;
  };

  const setBtnState = (btn, state) => {
    if (!btn) return;
    if (!btn.dataset._origText) btn.dataset._origText = btn.textContent || '';

    if (state === 'loading') {
      btn.disabled = true;
      btn.textContent = 'Отправляем…';
    } else if (state === 'success') {
      btn.disabled = true;
      btn.textContent = 'Отправлено';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = btn.dataset._origText;
      }, 1800);
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset._origText;
    }
  };

  forms.forEach((form) => {
    // Avoid double binding
    if (form.dataset.tgBound === '1') return;
    form.dataset.tgBound = '1';

    form.addEventListener('submit', async (e) => {
      // Let browser validation run
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) return;

      e.preventDefault();

      const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
      setBtnState(submitBtn, 'loading');

      try {
        const fd = toFormData(form);

        // prefer explicit form action if present (safer for subpath deployments)
        const endpoint = form.getAttribute('action') || ENDPOINT;
        const res = await fetch(endpoint, {
          method: 'POST',
          body: fd,
        });

        const json = await res.json().catch(() => ({}));

        if (!res.ok || !json.ok) {
          if (isDev()) console.error('[initTelegramLeads] send failed', res.status, json);
          setBtnState(submitBtn, 'idle');
          return;
        }

        setBtnState(submitBtn, 'success');
        // keep UX: clear only message fields (do not nuke phone/name if user reopens)
        ['message', 'question', 'text', 'comment', 'situation'].forEach((k) => {
          const el = form.querySelector(`[name="${k}"]`);
          if (el && 'value' in el) el.value = '';
        });

        // If contact modal is open, close it after success
        const modal = document.getElementById('contactModal');
        if (modal?.classList.contains('is-open')) {
          setTimeout(() => {
            modal.classList.remove('is-open');
            modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('modal-open');
          }, 650);
        }
      } catch (err) {
        if (isDev()) console.error('[initTelegramLeads] exception', err);
        setBtnState(submitBtn, 'idle');
      }
    });
  });
}