(function initViewportVariable() {
  const rootEl = document.documentElement;
  if (!rootEl) return;

  const applyViewport = () => {
    const height = window.innerHeight || rootEl.clientHeight;
    if (height > 0) {
      const vhUnit = height * 0.01;
      rootEl.style.setProperty('--app-vh', `${vhUnit}px`);
      rootEl.style.setProperty('--app-viewport', `${height}px`);
    }
  };

  let pendingFrame = null;
  const schedule = () => {
    if (pendingFrame) cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(() => {
      pendingFrame = null;
      applyViewport();
    });
  };

  applyViewport();
  window.addEventListener('resize', schedule, { passive: true });
  window.addEventListener('orientationchange', schedule, { passive: true });
  window.addEventListener('pageshow', schedule, { passive: true });
})();

document.addEventListener('DOMContentLoaded', () => {
  initYandexMetrika();
  initHeader();
  initScenariosSlider();
  initFaqAccordion();
  initFaqParallax();
  initTrustParallax();
  initFindParallax();
  initTelegramLeads();
  try {
    initFormsUX();
    if (isDev()) console.log('[formsUX] started / placeholders cycle started');
  } catch (e) {
    if (isDev()) console.warn('[formsUX] error', e);
  }
  initCounterAnimation();
  initBridgeCounters();
  initTicker();
  try {
    initStripeTicker();
    if (isDev()) console.log('[stripeTicker] initialized');
  } catch (e) {
    if (isDev()) console.warn('[stripeTicker] init error', e);
  }
  initSuccessModal();
  initLeftStickyAsk();

  if (isDev()) {
    console.log('[script.js] All initialization functions completed');
  }
});


/* ==========================================================
   HELPER: Check if in development mode
   ========================================================== */
function isDev() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

function isLocalPreview() {
  return isDev() || window.location.protocol === 'file:';
}

function guardInit(key) {
  if (!key) return false;
  if (!window.__kgInitFlags) {
    window.__kgInitFlags = new Set();
  }
  if (window.__kgInitFlags.has(key)) return false;
  window.__kgInitFlags.add(key);
  return true;
}

/* keis-ticker removed: canonical items and population logic deleted */

// No-op placeholder for legacy initTicker() (keeps existing init flow stable)
function initTicker() {
  // intentionally left blank per user request
}

// Injects a lightweight running stripe ticker into the orange stripe area
function initStripeTicker() {
  if (!guardInit('stripe-ticker')) return;
  try {
    const path = window.location.pathname || '';
    const isConsumer = path.includes('/consumer-protection/');
    const isFraud = path.includes('/fraud/');
    // only on the requested sections
    if (!isConsumer && !isFraud) return;

    const firstSection = document.querySelector('body > section:first-of-type');
    if (!firstSection) return;
    if (firstSection.querySelector('.kg-stripe-ticker')) return; // already added

    const items = [
      'Узкопрофильные специалисты',
      'Представление интересов до реального результата',
      'Оплата за честный результат',
      'Знание различных схем и способов достижений поставленных целей',
      'Юрист на связи всегда',
      'Быстрая подготовка и подача первичных документов',
      'Более 30 лет опыта имеет каждый юрист компании',
      'Гибкие условия оплаты'
    ];

    const ticker = document.createElement('div');
    ticker.className = 'kg-stripe-ticker';
    ticker.setAttribute('aria-hidden', 'true');

    const track = document.createElement('div');
    track.className = 'kg-stripe-track';

    // build a long sequence by repeating the items several times (improves smooth loop)
    for (let r = 0; r < 10; r++) {
      items.forEach((txt, idx) => {
        const span = document.createElement('span');
        span.className = 'kg-stripe-item';
        span.textContent = txt;
        track.appendChild(span);

        // add separator except after last item of the sequence
        const sep = document.createElement('span');
        // use an unusual name for the separator to avoid conflicts
        sep.className = 'kg-onyx-sigil';
        track.appendChild(sep);
      });
    }

    // duplicate the track contents to enable a seamless loop (content duplicated once)
    track.innerHTML += track.innerHTML;

    ticker.appendChild(track);
    // ensure the ticker is a child so absolute positioning sits over the stripe
    firstSection.appendChild(ticker);

    // Replace CSS animation with requestAnimationFrame driven animation for pixel-perfect smoothness
    let rafId = null;
    let lastTime = null;
    let offset = 0;
    let contentWidth = 0; // full scrollWidth
    let loopWidth = 0; // half of contentWidth (since duplicated)
    let pxPerSec = 100; // default fallback
    let displayedOffset = 0; // for smoothing (lerp)

    const recalc = () => {
      contentWidth = track.scrollWidth || 0;
      loopWidth = contentWidth / 2 || contentWidth;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1200;
      // base duration between 12s and 36s for one loop (loopWidth distance) — use floats for smoothness
      let baseDuration = (loopWidth / viewportWidth) * 18 || 18;
      baseDuration = Math.max(12, Math.min(36, baseDuration));
      const speedFactor = (isConsumer || isFraud) ? 6.0 : 1.0;
      let duration = baseDuration * speedFactor;
      duration = Math.min(240, duration);
      // px to move per second = loopWidth / duration (duration in seconds)
      pxPerSec = (loopWidth > 0) ? (loopWidth / duration) : 100;
      // defensive reset of offset to stay in valid range
      if (loopWidth > 0) offset = offset % loopWidth;
    };

    const step = (ts) => {
      if (lastTime === null) lastTime = ts;
      const dt = (ts - lastTime) / 1000;
      lastTime = ts;
      offset += pxPerSec * dt;
      if (loopWidth > 0 && offset >= loopWidth) offset -= loopWidth;
      // smooth displayed offset with a small lerp to remove micro-jitter
      // choose factor small enough for responsiveness but large enough for smoothing
      const lerpFactor = 0.12;
      displayedOffset += (offset - displayedOffset) * lerpFactor;
      // apply transform using fractional pixels for subpixel-smooth movement
      track.style.transform = `translate3d(${-displayedOffset}px,0,0)`;
      rafId = requestAnimationFrame(step);
    };

    const start = () => {
      cancel();
      recalc();
      lastTime = null;
      rafId = requestAnimationFrame(step);
    };

    const cancel = () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    };

    // Start the ticker only when it is visible (IO) and when the page is visible.
    // This avoids continuous rAF when the ticker is offscreen and reduces paint churn.
    let isIntersecting = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target !== ticker) return;
        isIntersecting = entry.isIntersecting && entry.intersectionRatio > 0;
        if (isIntersecting && !document.hidden) {
          start();
          if (isDev()) console.log('[stripeTicker] started');
        } else {
          cancel();
          if (isDev()) console.log('[stripeTicker] paused');
        }
      });
    }, { root: null, threshold: 0 });

    // Observe ticker visibility and compute metrics once now
    try { recalc(); } catch (e) {}
    io.observe(ticker);

    window.addEventListener('resize', () => { recalc(); }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancel();
        if (isDev()) console.log('[stripeTicker] paused');
      } else {
        // resume only if currently intersecting the viewport
        if (isIntersecting) {
          start();
          if (isDev()) console.log('[stripeTicker] resumed');
        }
      }
    });
  } catch (e) {
    // silent fail to avoid breaking page
    console.warn('initStripeTicker error', e);
  }
}

const HERO_HAND_LAYER_DATA_KEY = '__keisHeroHandLayer';

function ensureHandLayer(container) {
  if (!container || !(container instanceof Element)) return null;
  container.classList.add('hero-hand-layer-container');
  const existing = container[HERO_HAND_LAYER_DATA_KEY];
  if (existing && existing.isConnected) return existing;
  const layer = document.createElement('div');
  layer.className = 'hero-hand-layer';
  layer.setAttribute('aria-hidden', 'true');
  container.appendChild(layer);
  container[HERO_HAND_LAYER_DATA_KEY] = layer;
  return layer;
}

function ensureHandTarget(button) {
  if (!button || !(button instanceof Element)) return null;
  button.classList.add('hero-hand-target');
  return button;
}

// Legacy hand hint + ripple logic (kept intact)
const animateButtonPress = async (btn) => {
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  if (!btn) return;
  btn.classList.add('is-pressing');
  await sleep(200);
  btn.classList.remove('is-pressing');
  await sleep(100);
};

const triggerBlockFiveLight = (btn, x, y) => {
  if (!btn) return;
  const rect = btn.getBoundingClientRect();
  const container = btn.closest('form');
  const containerRect = container ? container.getBoundingClientRect() : null;
  const fallbackX = rect.width ? rect.width * 0.62 : 0;
  const fallbackY = rect.height ? rect.height * 0.56 : 0;
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  let fx = fallbackX;
  let fy = fallbackY;

  if (typeof x === 'number' && typeof y === 'number') {
    if (containerRect) {
      fx = x - (rect.left - containerRect.left);
      fy = y - (rect.top - containerRect.top);
    } else {
      fx = x;
      fy = y;
    }
  }

  fx = clamp(fx, 6, Math.max(rect.width - 6, 6));
  fy = clamp(fy, 6, Math.max(rect.height - 6, 6));
  btn.classList.remove('kg-block5-light');
  void btn.offsetWidth;
  btn.style.setProperty('--hand-light-x', `${Math.round(fx)}px`);
  btn.style.setProperty('--hand-light-y', `${Math.round(fy)}px`);
  btn.classList.add('kg-block5-light');
};

function initHeroFormHandClickHint() {
  if (window.__heroHandHintController) return window.__heroHandHintController;

  let heroForm = document.querySelector('.hero-investment .hero-form') ||
    document.querySelector('section:first-of-type .hero-form') ||
    document.querySelector('.hero-form');
  if (!heroForm) return null;
  ensureHandLayer(heroForm);

  const buttonSelector = 'button[type="submit"], .btn-primary, .challenges-cta__btn, .faq-ask-btn';
  let heroButton = heroForm.querySelector(buttonSelector);
  if (!heroButton) return null;

  const ensureRipples = (btn) => {
    if (!btn) return;
    if (!btn.querySelector('.hero-hand-ripple--large')) {
      const large = document.createElement('span');
      large.className = 'hero-hand-ripple hero-hand-ripple--large';
      large.setAttribute('aria-hidden', 'true');
      btn.appendChild(large);
    }
    if (!btn.querySelector('.hero-hand-ripple--small')) {
      const small = document.createElement('span');
      small.className = 'hero-hand-ripple hero-hand-ripple--small';
      small.setAttribute('aria-hidden', 'true');
      btn.appendChild(small);
    }
  };

  ensureRipples(heroButton);

  const normalizePlayArgs = (btnOrOptions, opts = {}) => {
    const isElement = typeof Element !== 'undefined' && btnOrOptions instanceof Element;
    if (btnOrOptions && typeof btnOrOptions === 'object' && !isElement) {
      return btnOrOptions;
    }
    return { button: btnOrOptions, ...opts };
  };

  const handEl = document.createElement('div');
  handEl.className = 'hero-hand-hint hero-hand-hint--fixed';
  handEl.setAttribute('aria-hidden', 'true');

  const handImg = document.createElement('img');
  handImg.src = '/assets/icons/hand_s.png';
  handImg.alt = '';
  handEl.appendChild(handImg);

  document.body.appendChild(handEl);

  const prefersReducedMotion = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false;
  const moveDuration = prefersReducedMotion ? 0 : 380; // align with CSS transition (~360ms) to avoid early tap
  const tapDuration = prefersReducedMotion ? 0 : 160;
  const fadeDuration = prefersReducedMotion ? 120 : 260;

  const state = { timeouts: [], activeButton: null };

  const clearTimers = () => {
    state.timeouts.forEach((id) => clearTimeout(id));
    state.timeouts.length = 0;
    if (state.activeButton) {
      state.activeButton.classList.remove('is-pressed');
      state.activeButton.classList.remove('hero-hand-press');
      state.activeButton = null;
    }
  };

  const schedule = (cb, delay) => {
    const id = window.setTimeout(() => {
      state.timeouts = state.timeouts.filter((storedId) => storedId !== id);
      cb();
    }, delay);
    state.timeouts.push(id);
    return id;
  };

  const resolveButton = () => {
    if (heroButton && heroButton.isConnected) {
      ensureRipples(heroButton);
      return heroButton;
    }
    heroButton = heroForm.querySelector(buttonSelector);
    ensureRipples(heroButton);
    return heroButton;
  };

  const play = (targetBtnOrOptions, opts = {}) => new Promise((resolve) => {
    let settled = false;
    let fallbackId = null;
    const settle = () => {
      if (settled) return;
      settled = true;
      if (fallbackId) window.clearTimeout(fallbackId);
      resolve();
    };
    const playOptions = normalizePlayArgs(targetBtnOrOptions, opts) || {};
    let btn = null;
    if (playOptions && playOptions.button) {
      btn = playOptions.button;
    } else {
      btn = resolveButton();
    }
    if (!btn) {
      resolve();
      return;
    }
    btn = ensureHandTarget(btn) || btn;

    const isModalBtn = !!btn.closest('.hero-form--modal');
    if (isModalBtn) {
      handEl.classList.add('hero-hand-hint--modal');
    } else {
      handEl.classList.remove('hero-hand-hint--modal');
    }

    const targetXPct = typeof playOptions.targetXPct === 'number' ? playOptions.targetXPct : 0.85;
    const targetYPct = typeof playOptions.targetYPct === 'number' ? playOptions.targetYPct : 0.55;
    const startOffsetX = typeof playOptions.startOffsetX === 'number' ? playOptions.startOffsetX : 26;
    const startOffsetY = typeof playOptions.startOffsetY === 'number' ? playOptions.startOffsetY : 18;
    const visibleOpacity = typeof playOptions.visibleOpacity === 'number' ? playOptions.visibleOpacity : null;
    if (visibleOpacity !== null) {
      handEl.style.setProperty('--hero-hand-opacity', String(visibleOpacity));
    } else {
      handEl.style.removeProperty('--hero-hand-opacity');
    }

    try { ensureRipples(btn); } catch (e) {}

    clearTimers();
    handEl.classList.remove('is-visible');
    handEl.classList.remove('is-tap');
    state.activeButton = null;

    const rect = btn.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      resolve();
      return;
    }

    const overlayTarget = document.body;
    if (!overlayTarget) {
      resolve();
      return;
    }

    if (handEl.parentElement !== overlayTarget) {
      handEl.style.position = 'fixed';
      handEl.classList.add('hero-hand-hint--fixed');
      overlayTarget.appendChild(handEl);
    } else {
      handEl.style.position = 'fixed';
      handEl.classList.add('hero-hand-hint--fixed');
    }

    const viewportTargetX = rect.left + rect.width * targetXPct;
    const viewportTargetY = rect.top + rect.height * targetYPct;
    const HAND_SHIFT_X = 8;
    const targetX = Math.round(viewportTargetX + HAND_SHIFT_X);
    const targetY = Math.round(viewportTargetY);
    const startX = Math.round(viewportTargetX + startOffsetX + HAND_SHIFT_X);
    const startY = Math.round(viewportTargetY + startOffsetY);

    handEl.style.opacity = '0';
    handEl.classList.add('is-start');

    const prevTransition = handEl.style.transition || '';
    handEl.style.transition = 'none';

    handEl.style.left = `${startX}px`;
    handEl.style.top = `${startY}px`;

    void handEl.offsetWidth;

    requestAnimationFrame(() => {
      handEl.style.transition = prevTransition || '';
      handEl.classList.add('is-visible');
      handEl.classList.remove('is-start');
      handEl.style.left = `${targetX}px`;
      handEl.style.top = `${targetY}px`;
      handEl.style.opacity = '';
      state.activeButton = btn;

      schedule(() => {
        handEl.classList.add('is-tap');
        btn.classList.add('is-pressed');
        btn.classList.add('hero-hand-press');

        if (typeof playOptions.onTap === 'function') {
          try {
            playOptions.onTap({ button: btn, targetX, targetY });
          } catch (e) {}
        }

        const isModal = !!btn.closest('.hero-form--modal') || !!(btn.closest('form') && btn.closest('form').classList && btn.closest('form').classList.contains('hero-form--modal'));
        if (isModal) {
          try {
            const bRect = btn.getBoundingClientRect();
            const rx = Math.round(bRect.width * 0.85);
            const ry = Math.round(bRect.height * 0.55);
            btn.style.setProperty('--ripple-x', `${rx}px`);
            btn.style.setProperty('--ripple-y', `${ry}px`);
            btn.classList.add('typing-complete');
          } catch (e) {}
        }

        schedule(() => {
          handEl.classList.remove('is-tap');
          btn.classList.remove('is-pressed');
          btn.classList.remove('hero-hand-press');
          state.activeButton = null;
          handEl.classList.remove('is-visible');
          handEl.style.removeProperty('--hero-hand-opacity');
            handEl.classList.remove('hero-hand-hint--modal');

          if (btn.classList.contains('typing-complete')) {
            btn.classList.remove('typing-complete');
          }

          schedule(() => {
            settle();
          }, fadeDuration);
        }, tapDuration);
      }, moveDuration);
    });

    const fallbackMs = Math.max(moveDuration + tapDuration + fadeDuration + 180, 900);
    fallbackId = window.setTimeout(() => {
      if (settled) return;
      try {
        btn.classList.add('is-pressed');
        btn.classList.add('hero-hand-press');
      } catch (e) {}
      settle();
    }, fallbackMs);
  });

  const controller = { form: heroForm, play };
  window.__heroHandHintController = controller;
  controller.playTestSequence = async () => {
    const seq = [];
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    try {
      const heroBtn = heroForm ? heroForm.querySelector('button[type="submit"], .btn-primary') : null;
      if (heroBtn) seq.push(() => play(heroBtn));
    } catch (e) {}
    try {
      const modalForm = document.querySelector('.hero-form--modal');
      if (modalForm) {
        const mBtn = modalForm.querySelector('button[type="submit"], .btn-primary, .challenges-cta__btn');
        if (mBtn) seq.push(() => play(mBtn));
      }
    } catch (e) {}
    try {
      const blockForm = document.querySelector('.challenges-cta__form');
      if (blockForm) {
        const bBtn = blockForm.querySelector('button[type="submit"], .challenges-cta__btn');
        if (bBtn) seq.push(() => play(bBtn));
      }
    } catch (e) {}

    for (let fn of seq) {
      await sleep(350);
      await fn();
    }
  };
  return controller;
}

/* ==========================================================
   FORMS UX: placeholder typing + subtle CTA pulse + pressed state
   ========================================================== */
function initFormsUX() {
  if (!guardInit('forms-ux')) return;
  const BASE_PLACEHOLDERS = {
    name: 'Как вас зовут?',
    phone: 'Ваш номер',
    message: 'Опишите кратко свою ситуацию'
  };

  const COMMON_PHONE_TEXT = '+7 987 654 32 10';
  const TYPING_SETS = {
    'medical-malpractice': {
      name: ['Ирина Власова'],
      phone: [COMMON_PHONE_TEXT],
      message: ['После лечения стало хуже, нужна помощь разобраться с врачом']
    },
    'poor-quality-services': {
      name: ['Алексей Синицын'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Услугу оказали плохо, хочу вернуть деньги и исправить ситуацию']
    },
    'forced-insurance': {
      name: ['Мария Руднева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Навязали страховку при оформлении, хочу её отменить']
    },
    'furniture-defects': {
      name: ['Владислав Крылов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Мебель пришла с дефектами, продавец не решает вопрос']
    },
    'defective-apartment-renovation': {
      name: ['Ольга Зуева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Ремонт сделали плохо, нужен возврат и переделка']
    },
    'consumer-goods-refund': {
      name: ['Сергей Козлов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Купил товар с браком, магазин отказывается вернуть деньги']
    },
    'construction-contract': {
      name: ['Дмитрий Орлов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Подрядчик сорвал сроки и качество работ, нужен возврат']
    },
    'complaint-against-lawyer': {
      name: ['Наталья Лебедева'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Заплатила юристу, результата нет, хочу подать жалобу']
    },
    default: {
      name: ['Антон Смирнов'],
      phone: [COMMON_PHONE_TEXT],
      message: ['Коротко опишите вашу ситуацию']
    }
  };

  initHeroFormHandClickHint();

  if (!window.__keisFormControllers || !(window.__keisFormControllers instanceof WeakMap)) {
    window.__keisFormControllers = new WeakMap();
  }

  const controllers = window.__keisFormControllers;
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  const pageKey = (document.body && document.body.dataset && document.body.dataset.page) || 'default';
  const pageTexts = TYPING_SETS[pageKey] || TYPING_SETS.default;
  const defaultTexts = TYPING_SETS.default;

  const resolveFieldKey = (el) => {
    const nameAttr = (el.getAttribute('name') || '').toLowerCase();
    if (/name|fullname|your_name/.test(nameAttr)) return 'name';
    if (/phone|tel|phone_number/.test(nameAttr)) return 'phone';
    return 'message';
  };

  const getTexts = (key) => {
    const current = pageTexts[key];
    if (Array.isArray(current) && current.length) return current;
    return Array.isArray(defaultTexts[key]) ? defaultTexts[key] : [];
  };

  const heroSection = document.querySelector('body > section:first-of-type');
  const allForms = Array.from(document.querySelectorAll('form'));
  const eligibleForms = allForms
    .map((form) => {
      const fields = Array.from(form.querySelectorAll('input[type="text"], input[type="tel"], textarea'))
        .filter((el) => {
          const type = (el.getAttribute('type') || '').toLowerCase();
          if (type === 'hidden' || type === 'submit' || type === 'checkbox' || type === 'radio') return false;
          return !el.disabled && !el.hidden;
        });
      const submit = form.querySelector('button[type="submit"], input[type="submit"]');
      const isHero = !!heroSection && (heroSection.contains(form) || form.classList.contains('hero-form'));
      return { form, fields, submit, isHero };
    })
    .filter(({ fields, submit }) => fields.length >= 2 && !!submit)
    .sort((a, b) => Number(b.isHero) - Number(a.isHero));

  if (!eligibleForms.length) return;

  eligibleForms.forEach(({ form, fields, submit, isHero }) => {
    if (controllers.has(form)) return;

    const fieldStates = fields.map((el) => ({
      el,
      key: resolveFieldKey(el),
      idx: -1
    }));

    fieldStates.forEach((fs) => {
      const baseText = BASE_PLACEHOLDERS[fs.key] || '';
      fs.el.setAttribute('placeholder', baseText);
    });

    const submitButton = submit || form.querySelector('button[type="submit"], .btn-primary, .challenges-cta__btn, .faq-ask-btn');

    const state = {
      running: false,
      stopped: false,
      userInteracted: false,
      restartTimer: null
    };

    const gateByViewport = form.classList.contains('challenges-cta__form') || !!form.closest('.challenges-cta__form') || form.classList.contains('kg-glass__form');
    let isIntersecting = !gateByViewport;

    const tapSubmit = async () => {
      if (!submitButton) return;
      if (state.stopped || state.userInteracted) return;
      const hero = window.__heroHandHintController;
      if (hero && typeof hero.play === 'function') {
        const failSafe = sleep(1200).then(() => animateButtonPress(submitButton));
        await Promise.race([hero.play(submitButton), failSafe]);
      } else {
        await animateButtonPress(submitButton);
      }
    };

    const resetPlaceholdersAnimated = async () => {
      const emptyFields = fieldStates.map((fs) => fs.el).filter((el) => el && !(el.value && String(el.value).trim()));
      if (!emptyFields.length) return;
      emptyFields.forEach((el) => {
        el.classList.remove('ux-typing');
        el.classList.add('ux-resetting');
      });
      await sleep(140);
      emptyFields.forEach((el) => {
        const key = resolveFieldKey(el);
        const base = BASE_PLACEHOLDERS[key] || '';
        el.setAttribute('placeholder', base);
      });
      await new Promise(requestAnimationFrame);
      emptyFields.forEach((el) => {
        el.classList.remove('ux-resetting');
      });
    };

    const enforceBasePlaceholders = () => {
      fieldStates.forEach((fs) => {
        if (!fs.el) return;
        const key = resolveFieldKey(fs.el);
        const base = BASE_PLACEHOLDERS[key] || '';
        if (!fs.el.value || !String(fs.el.value).trim()) {
          fs.el.setAttribute('placeholder', base);
        }
      });
    };

    const stopTyping = () => {
      state.stopped = true;
      state.userInteracted = true;
      clearTimeout(state.restartTimer);
      form.classList.remove('ux-typing-active');
      fieldStates.forEach((fs) => fs.el.classList.remove('ux-typing'));
    };

    const nextText = (fs) => {
      const texts = getTexts(fs.key);
      if (!texts.length) return '';
      fs.idx = (fs.idx + 1) % texts.length;
      return texts[fs.idx];
    };

    const typePlaceholder = async (fs) => {
      const el = fs.el;
      if (!el || state.stopped) return false;
      if (el.value && String(el.value).trim()) return false;
      const text = nextText(fs);
      if (!text) return false;

      el.classList.add('ux-typing');
      el.setAttribute('placeholder', '');

      for (let i = 0; i < text.length; i++) {
        if (state.stopped || state.userInteracted) break;
        if (el.value && String(el.value).trim()) break;
        el.setAttribute('placeholder', text.slice(0, i + 1));
        await sleep(randomBetween(35, 60));
      }

      el.classList.remove('ux-typing');
      return true;
    };

    const runCycle = async () => {
      if (state.running) return;
      state.running = true;
      state.stopped = false;
      enforceBasePlaceholders();

      while (!state.stopped) {
        form.classList.add('ux-typing-active');

        let lastAnimated = null;

        for (const fs of fieldStates) {
          if (state.stopped) break;
          if (fs.el.value && String(fs.el.value).trim()) continue;
          if (state.userInteracted) {
            state.stopped = true;
            break;
          }
          const didType = await typePlaceholder(fs);
          if (didType) lastAnimated = fs;
          if (state.stopped) break;
          await sleep(randomBetween(240, 420));
        }

        if (!state.stopped && !state.userInteracted && lastAnimated) {
          await sleep(randomBetween(260, 480));
          await tapSubmit();
          await resetPlaceholdersAnimated();
          enforceBasePlaceholders();
          form.classList.remove('ux-typing-active');
          if (state.stopped || state.userInteracted) break;
          await sleep(randomBetween(2000, 2600));
          continue;
        }

        form.classList.remove('ux-typing-active');
        if (state.stopped || state.userInteracted) break;
        await sleep(randomBetween(1500, 2500));
      }

      form.classList.remove('ux-typing-active');
      await resetPlaceholdersAnimated();
      enforceBasePlaceholders();
      state.running = false;
      if (!state.userInteracted) {
        scheduleStart(2200);
      }
    };

    const scheduleStart = (delayMs) => {
      clearTimeout(state.restartTimer);
      state.restartTimer = setTimeout(() => {
        if (!state.running && !state.userInteracted) {
          if (gateByViewport && !isIntersecting) return;
          runCycle();
        }
      }, delayMs);
    };

    fieldStates.forEach((fs) => {
      const el = fs.el;

      const interruptAndReset = async () => {
        stopTyping();
        await resetPlaceholdersAnimated();
      };

      el.addEventListener('pointerdown', () => {
        interruptAndReset();
      });

      el.addEventListener('focus', () => {
        interruptAndReset();
      });

      el.addEventListener('input', (e) => {
        if (e && !e.isTrusted) return;
        stopTyping();
      });

      el.addEventListener('blur', () => {
        clearTimeout(state.restartTimer);
        const focusInside = form.contains(document.activeElement);
        if (focusInside) return;
        const hasValue = fieldStates.some((f) => f.el.value && String(f.el.value).trim());
        if (hasValue) return;
        state.stopped = false;
        state.userInteracted = false;
        scheduleStart(2000);
      });
    });

    const controller = {
      form,
      fields: fieldStates.map((fs) => fs.el),
      start: () => {
        state.stopped = false;
        state.userInteracted = false;
        if (!state.running) runCycle();
      },
      stop: stopTyping
    };

    controllers.set(form, controller);

    const initialDelay = gateByViewport ? null : 3200;
    if (initialDelay !== null) scheduleStart(initialDelay);

    // Fail-safe: ensure hero form cycles start even if timers were canceled or skipped
    if (isHero) {
      setTimeout(() => {
        if (state.running || state.userInteracted) return;
        if (gateByViewport && !isIntersecting) return;
        runCycle();
      }, gateByViewport ? 5200 : 4200);
    }

    if (gateByViewport && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          isIntersecting = entry.isIntersecting;
          if (!entry.isIntersecting || state.userInteracted) return;
          state.stopped = false;
          state.userInteracted = false;
          clearTimeout(state.restartTimer);
          resetPlaceholdersAnimated().then(() => scheduleStart(3200));
        });
      }, { threshold: 0.35 });
      io.observe(form);
    } else if (gateByViewport) {
      isIntersecting = true;
      scheduleStart(3200);
    }
  });
}
/* ==========================================================
   HEADER: desktop dropdown + mobile burger
   ========================================================== */
function initHeader() {
  if (window.__headerInitialized) return;
  if (!guardInit('header')) return;
  window.__headerInitialized = true;

  // Measure header height and expose it via CSS var
  const header = document.querySelector('.keis-header');
  let headerMeasureRaf = null;
  const measureHeaderHeight = () => {
    if (!header) return;
    const h = Math.round(header.offsetHeight || header.getBoundingClientRect().height || 0);
    if (h > 0) {
      document.documentElement.style.setProperty('--keis-header-h', `${h}px`);
    }
  };
  const scheduleHeaderMeasure = () => {
    if (headerMeasureRaf) cancelAnimationFrame(headerMeasureRaf);
    headerMeasureRaf = requestAnimationFrame(() => {
      headerMeasureRaf = null;
      measureHeaderHeight();
    });
  };
  measureHeaderHeight();
  window.addEventListener('resize', scheduleHeaderMeasure, { passive: true });
  window.addEventListener('orientationchange', scheduleHeaderMeasure, { passive: true });
  const burger = document.getElementById('burgerBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const overlay = document.getElementById('mobileMenuOverlay');
  const closeBtn = document.getElementById('mobileMenuClose');

  const body = document.body;

  // TASK 5: Removed scroll lock - page must be scrollable when burger menu is open
  const lockScroll = (state) => {
    body.classList.toggle('menu-open', state);
    // TASK 5: Do NOT toggle menu-open-no-scroll (removed scroll lock)
    // body.classList.toggle('menu-open-no-scroll', state); // DISABLED
  };

  const openMobile = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.add('is-open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    burger?.setAttribute('aria-expanded', 'true');
    burger?.classList.add('is-open');
    lockScroll(true);
    scheduleHeaderMeasure();
  };

  const closeMobile = () => {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('is-open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    burger?.setAttribute('aria-expanded', 'false');
    burger?.classList.remove('is-open');
    lockScroll(false);
    scheduleHeaderMeasure();

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
  
  // ЗАДАЧА 2: Сохраняем scrollY при открытии попапа
  let savedScrollY = 0;

  const openContactModal = () => {
    if (!contactModal) return;
    
    // Сохраняем текущую позицию скролла
    savedScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

    // Prevent global `scroll-behavior: smooth` from animating any restore scroll
    document.documentElement.classList.add('no-smooth-scroll');
    
    contactModal.classList.add('is-open');
    contactModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    
    // Блокируем скролл фона (iOS-safe)
    document.body.style.position = 'fixed';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.width = '100%';

    // TASK 2: Ensure typewriter works for popup form when modal opens
    const modalForm = contactModal.querySelector('form.hero-form--modal');
    if (modalForm && window.__keisFormControllers) {
      const controller = window.__keisFormControllers.get(modalForm);
      if (controller && typeof controller.start === 'function') {
        setTimeout(() => controller.start(), 120);
      }
    }

    // Also trigger hero-hand hint animation for the modal submit button
    // Only trigger here when the form controller is NOT present — otherwise
    // the controller restart will handle user guidance itself.
    try {
      const heroController = window.__heroHandHintController;
      if (heroController && modalForm) {
        const modalBtn = modalForm.querySelector('button[type="submit"], .btn-primary, .challenges-cta__btn, .faq-ask-btn');
        const hasController = window.__keisFormControllers && window.__keisFormControllers.get && window.__keisFormControllers.get(modalForm);
        if (modalBtn && !hasController) {
          // small delay to allow modal open animation and layout to settle
          setTimeout(() => {
            try { heroController.play(modalBtn); } catch (e) { /* noop */ }
          }, 240);
        }
      }
    } catch (e) {
      // noop
    }

    const first = contactModal.querySelector('input, textarea, button');
    first?.focus?.();
  };

  const closeContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.remove('is-open');
    contactModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    
    // ЗАДАЧА 2: Восстанавливаем scrollY без анимации
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo({ top: savedScrollY, left: 0, behavior: 'auto' });
    savedScrollY = 0;

    // Restore smooth scrolling for the rest of the page interactions
    document.documentElement.classList.remove('no-smooth-scroll');
  };

  window.__keisOpenContactModal = openContactModal;
  window.__keisCloseContactModal = closeContactModal;
  window.__keisIsContactModalOpen = isModalOpen;

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
  if (window.__scenariosSliderInitialized) return;
  window.__scenariosSliderInitialized = true;

  const root = document.querySelector('.investment-scenarios');
  if (!root) {
    if (isDev()) console.warn('[initScenariosSlider] .investment-scenarios section not found on this page');
    return;
  }

  // Slider enabled: autoplay + pause on hover/focus, looped.

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

  const mobileMedia = window.matchMedia('(max-width: 980px)');

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
    slidesAll.forEach((slideEl, idxAll) => {
      const realIdx = mod(idxAll - cloneCount, totalSlides);
      applyBgByRealIndex(slideEl, realIdx);
    });
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

  let hoverResumeTimeout = null;
  const scheduleResume = (delayMs = 900) => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    hoverResumeTimeout = setTimeout(() => {
      hoverResumeTimeout = null;
      resumeAutoplay();
      startAutoplay();
    }, delayMs);
  };

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName !== 'transform') return;
    isAnimating = false;
    normalizeAfterTransition();
  });

  const goToPrev = () => {
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
  };

  const goToNext = () => {
    stopAutoplay();
    if (isAnimating) return;
    currentIndex += 1;
    setTranslate(currentIndex);
    startAutoplay();
  };

  prevBtn?.addEventListener('click', goToPrev);
  nextBtn?.addEventListener('click', goToNext);

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

  windowEl.addEventListener('pointerenter', () => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    pauseAutoplay();
  }, { passive: true });
  windowEl.addEventListener('pointerleave', () => scheduleResume(900), { passive: true });
  windowEl.addEventListener('pointerdown', () => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    pauseAutoplay();
  }, { passive: true });
  windowEl.addEventListener('pointerup', () => scheduleResume(900), { passive: true });
  windowEl.addEventListener('pointercancel', () => scheduleResume(900), { passive: true });

  root.addEventListener('focusin', () => {
    if (hoverResumeTimeout) {
      clearTimeout(hoverResumeTimeout);
      hoverResumeTimeout = null;
    }
    pauseAutoplay();
  });
  root.addEventListener('focusout', () => scheduleResume(900));

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseAutoplay();
    else resumeAutoplay();
  });

  startAutoplay();

  const addMqChangeListener = (mq, handler) => {
    if (!mq || typeof handler !== 'function') return;
    if (typeof mq.addEventListener === 'function') {
      mq.addEventListener('change', handler);
      return;
    }
    if (typeof mq.addListener === 'function') {
      mq.addListener(handler);
    }
  };

  // --- Swipe gestures for <=980px ---
  const swipeState = {
    active: false,
    locked: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    deltaX: 0,
  };
  let swipeHandlersAttached = false;

  const resetSwipeState = () => {
    swipeState.active = false;
    swipeState.locked = false;
    swipeState.pointerId = null;
    swipeState.startX = 0;
    swipeState.startY = 0;
    swipeState.deltaX = 0;
  };

  const onSwipePointerDown = (event) => {
    if (!mobileMedia.matches) return;
    if (!event.isPrimary) return;
    if (swipeState.active) return;
    if (event.pointerType === 'mouse' && event.buttons !== 1) return;

    swipeState.active = true;
    swipeState.pointerId = event.pointerId;
    swipeState.startX = event.clientX;
    swipeState.startY = event.clientY;
    swipeState.deltaX = 0;
  };

  const onSwipePointerMove = (event) => {
    if (!swipeState.active) return;
    if (event.pointerId !== swipeState.pointerId) return;

    const dx = event.clientX - swipeState.startX;
    const dy = event.clientY - swipeState.startY;

    if (!swipeState.locked) {
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (absDy > absDx && absDy > 18) {
        resetSwipeState();
        return;
      }
      if (absDx > 18 && absDx > absDy * 1.2) {
        swipeState.locked = true;
      }
    }

    if (swipeState.locked) {
      event.preventDefault();
      swipeState.deltaX = dx;
    }
  };

  const finishSwipe = () => {
    if (!swipeState.locked) {
      resetSwipeState();
      return;
    }

    if (swipeState.deltaX <= -40) {
      goToNext();
    } else if (swipeState.deltaX >= 40) {
      goToPrev();
    }

    resetSwipeState();
  };

  const onSwipePointerUp = (event) => {
    if (!swipeState.active) return;
    if (event.pointerId !== swipeState.pointerId) return;
    finishSwipe();
  };

  const onSwipePointerCancel = (event) => {
    if (!swipeState.active) return;
    if (event.pointerId !== swipeState.pointerId) return;
    resetSwipeState();
  };

  const attachSwipeHandlers = () => {
    if (swipeHandlersAttached) return;
    windowEl.addEventListener('pointerdown', onSwipePointerDown, { passive: false });
    window.addEventListener('pointermove', onSwipePointerMove, { passive: false });
    window.addEventListener('pointerup', onSwipePointerUp);
    window.addEventListener('pointercancel', onSwipePointerCancel);
    swipeHandlersAttached = true;
  };

  const detachSwipeHandlers = () => {
    if (!swipeHandlersAttached) return;
    windowEl.removeEventListener('pointerdown', onSwipePointerDown, { passive: false });
    window.removeEventListener('pointermove', onSwipePointerMove, { passive: false });
    window.removeEventListener('pointerup', onSwipePointerUp);
    window.removeEventListener('pointercancel', onSwipePointerCancel);
    swipeHandlersAttached = false;
    resetSwipeState();
  };

  const evaluateSwipeSupport = () => {
    if (mobileMedia.matches) attachSwipeHandlers();
    else detachSwipeHandlers();
  };

  evaluateSwipeSupport();
  addMqChangeListener(mobileMedia, evaluateSwipeSupport);

  // --- Swipe hint overlay ---
  const hintState = {
    container: null,
    timeouts: [],
    isRunning: false,
    observer: null,
  };
  let isHintTargetVisible = false;
  const HINT_LEFT_DURATION = 900;
  const HINT_RIGHT_DURATION = 900;
  const HINT_SHORT_PAUSE = 1000;
  const HINT_LONG_PAUSE = 3000;

  const ensureHintElements = () => {
    if (hintState.container) return hintState.container;
    const controls = root.querySelector('.scenarios-band-controls');
    if (!controls) return null;

    const hintEl = document.createElement('div');
    hintEl.className = 'sc-swipe-hint';
    hintEl.setAttribute('aria-hidden', 'true');

    const orangeLine = document.createElement('div');
    orangeLine.className = 'sc-swipe-line sc-swipe-line--orange';

    const lightLine = document.createElement('div');
    lightLine.className = 'sc-swipe-line sc-swipe-line--light';

    const hand = document.createElement('img');
    hand.className = 'sc-swipe-hand';
    hand.src = '/assets/icons/hand_s.png';
    hand.alt = '';
    hand.loading = 'lazy';
    hand.decoding = 'async';
    hand.draggable = false;

    hintEl.append(orangeLine, lightLine, hand);
    controls.appendChild(hintEl);

    hintState.container = hintEl;
    return hintEl;
  };

  const clearHintTimeouts = () => {
    hintState.timeouts.forEach((id) => clearTimeout(id));
    hintState.timeouts.length = 0;
  };

  const setHintPhase = (phase) => {
    if (!hintState.container) return;
    hintState.container.classList.remove('is-orange', 'is-light');
    if (phase === 'orange') {
      hintState.container.classList.add('is-orange');
    } else if (phase === 'light') {
      hintState.container.classList.add('is-light');
    }
  };

  const scheduleHintTimeout = (cb, delay) => {
    const id = window.setTimeout(() => {
      hintState.timeouts = hintState.timeouts.filter((storedId) => storedId !== id);
      cb();
    }, delay);
    hintState.timeouts.push(id);
  };

  const runHintSequence = () => {
    if (!hintState.isRunning) return;
    if (!mobileMedia.matches) {
      stopHintLoop();
      return;
    }

    setHintPhase('orange');
    scheduleHintTimeout(() => {
      setHintPhase(null);
      scheduleHintTimeout(() => {
        if (!hintState.isRunning) return;
        setHintPhase('light');
        scheduleHintTimeout(() => {
          setHintPhase(null);
          scheduleHintTimeout(() => {
            runHintSequence();
          }, HINT_LONG_PAUSE);
        }, HINT_RIGHT_DURATION);
      }, HINT_SHORT_PAUSE);
    }, HINT_LEFT_DURATION);
  };

  const startHintLoop = () => {
    if (hintState.isRunning) return;
    if (!mobileMedia.matches) return;
    const container = ensureHintElements();
    if (!container) return;
    container.classList.add('is-mounted');
    hintState.isRunning = true;
    runHintSequence();
  };

  const stopHintLoop = () => {
    if (!hintState.isRunning && !hintState.container) return;
    clearHintTimeouts();
    hintState.isRunning = false;
    setHintPhase(null);
    hintState.container?.classList.remove('is-mounted');
  };

  const evaluateHintForViewport = () => {
    if (isHintTargetVisible && mobileMedia.matches) startHintLoop();
    else stopHintLoop();
  };

  const handleHintVisibility = (entries) => {
    entries.forEach((entry) => {
      if (entry.target !== root) return;
      isHintTargetVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;
      evaluateHintForViewport();
    });
  };

  if ('IntersectionObserver' in window) {
    hintState.observer = new IntersectionObserver(handleHintVisibility, {
      threshold: [0.25, 0.35, 0.5],
      root: null,
      rootMargin: '0px 0px -10% 0px',
    });
    hintState.observer.observe(root);
  } else {
    isHintTargetVisible = true;
    evaluateHintForViewport();
  }

  addMqChangeListener(mobileMedia, evaluateHintForViewport);
}

/* ==========================================================
   FAQ ACCORDION
   ========================================================== */
function initFaqAccordion() {
  if (window.__faqAccordionInitialized) return;
  window.__faqAccordionInitialized = true;

  const root = document.querySelector('.investment-faq');
  if (!root) {
    if (isDev()) console.warn('[initFaqAccordion] .investment-faq section not found on this page');
    return;
  }

  const items = Array.from(root.querySelectorAll('.faq-item'));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Защита от залипаний: отслеживание состояния анимации для каждого элемента
  const animatingItems = new WeakSet();
  const transitionHandlers = new WeakMap(); // Храним обработчики для очистки
  let pendingOpenItem = null; // Элемент, ожидающий открытия после закрытия других

  const closeItem = (item, onComplete) => {
    if (!item) {
      if (onComplete) onComplete();
      return;
    }
    if (animatingItems.has(item)) {
      if (onComplete) onComplete();
      return;
    }
    
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (!panel) {
      if (onComplete) onComplete();
      return;
    }

    // Очищаем предыдущий обработчик transitionend если есть
    const existingHandler = transitionHandlers.get(item);
    if (existingHandler) {
      panel.removeEventListener('transitionend', existingHandler);
      transitionHandlers.delete(item);
    }

    // Если уже закрыт, ничего не делаем
    const currentHeight = panel.offsetHeight;
    if (currentHeight === 0) {
      item.classList.remove('is-open');
      btn?.setAttribute('aria-expanded', 'false');
      panel.style.height = '';
      panel.style.overflow = '';
      if (onComplete) onComplete();
      return;
    }

    // Отмечаем что анимация началась
    animatingItems.add(item);
    
    // Устанавливаем текущую высоту перед анимацией
    panel.style.height = `${currentHeight}px`;
    panel.style.overflow = 'hidden';
    panel.offsetHeight; // force reflow

    // Запускаем анимацию закрытия через requestAnimationFrame для корректного старта transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.height = '0px';
      });
    });

    const handleTransitionEnd = (e) => {
      // Проверяем что это именно наш transition и именно height
      if (e.target !== panel || e.propertyName !== 'height') return;
      
      // Удаляем обработчик
      panel.removeEventListener('transitionend', handleTransitionEnd);
      transitionHandlers.delete(item);
      
      // Сбрасываем высоту и состояние
      panel.style.height = '';
      panel.style.overflow = '';
      item.classList.remove('is-open');
      btn?.setAttribute('aria-expanded', 'false');
      
      // Разблокируем элемент
      animatingItems.delete(item);
      
      // Вызываем callback если есть
      if (onComplete) onComplete();
    };

    transitionHandlers.set(item, handleTransitionEnd);
    panel.addEventListener('transitionend', handleTransitionEnd, { once: true });
    btn?.setAttribute('aria-expanded', 'false');
  };

  const openItem = (item) => {
    if (!item) return;
    if (animatingItems.has(item)) return;
    
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (!panel) return;

    // Очищаем предыдущий обработчик transitionend если есть
    const existingHandler = transitionHandlers.get(item);
    if (existingHandler) {
      panel.removeEventListener('transitionend', existingHandler);
      transitionHandlers.delete(item);
    }

    item.classList.add('is-open');

    // Отмечаем что анимация началась
    animatingItems.add(item);

    // Получаем целевую высоту через scrollHeight
    const currentHeight = panel.offsetHeight;
    // Временно устанавливаем height: auto для получения реальной высоты
    panel.style.height = 'auto';
    const targetHeight = panel.scrollHeight;
    
    // Если уже открыт на нужную высоту, ничего не делаем
    if (currentHeight === targetHeight && currentHeight > 0) {
      panel.style.height = 'auto';
      panel.style.overflow = '';
      animatingItems.delete(item);
      btn?.setAttribute('aria-expanded', 'true');
      return;
    }

    // Устанавливаем начальную высоту
    panel.style.height = `${currentHeight}px`;
    panel.style.overflow = 'hidden';
    panel.offsetHeight; // force reflow

    // Запускаем анимацию открытия через requestAnimationFrame для корректного старта transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        panel.style.height = `${targetHeight}px`;
      });
    });

    const handleTransitionEnd = (e) => {
      // Проверяем что это именно наш transition и именно height
      if (e.target !== panel || e.propertyName !== 'height') return;
      
      // Удаляем обработчик
      panel.removeEventListener('transitionend', handleTransitionEnd);
      transitionHandlers.delete(item);
      
      // Устанавливаем auto для корректной работы при изменении контента
      panel.style.height = 'auto';
      panel.style.overflow = '';
      btn?.setAttribute('aria-expanded', 'true');
      
      // Разблокируем элемент
      animatingItems.delete(item);
    };

    transitionHandlers.set(item, handleTransitionEnd);
    panel.addEventListener('transitionend', handleTransitionEnd, { once: true });
  };

  const closeAll = () => {
    // Отменяем ожидающее открытие
    pendingOpenItem = null;
    
    const openItems = items.filter(item => item.classList.contains('is-open'));
    if (openItems.length === 0) return;

    // Закрываем все открытые элементы
    let closedCount = 0;
    const totalToClose = openItems.length;
    
    openItems.forEach((item) => {
      closeItem(item, () => {
        closedCount++;
        // Все закрыты, можно продолжать
      });
    });
  };

  // Инициализация: закрываем все элементы
  items.forEach((item) => {
    const btn = item.querySelector('.faq-question');
    const panel = item.querySelector('.faq-answer');
    if (!panel) return;

    // Инициализация: закрыто
    btn?.setAttribute('aria-expanded', 'false');
    panel.style.height = '0px';
    panel.style.overflow = 'hidden';
  });

  // Делегирование событий на контейнер
  root.addEventListener('click', (e) => {
    const questionBtn = e.target.closest('.faq-question');
    if (!questionBtn) return;

    const item = questionBtn.closest('.faq-item');
    if (!item) return;

    e.preventDefault();
    // Используем stopPropagation для предотвращения всплытия
    // Обработчик на document с capture: true сработает ДО этого, так что это не проблема
    e.stopPropagation();

    // Блокируем клик если анимация идёт
    if (animatingItems.has(item)) return;

    const isOpen = item.classList.contains('is-open');
    
    if (isOpen) {
      // Закрываем текущий элемент
      closeItem(item);
      pendingOpenItem = null;
      return;
    }

    // Отменяем предыдущее ожидающее открытие
    pendingOpenItem = null;

    // Находим другие открытые элементы
    const otherOpenItems = items.filter(otherItem => 
      otherItem !== item && otherItem.classList.contains('is-open')
    );
    
    // ВАЖНО: Закрываем другие элементы СРАЗУ (синхронно), не ждем callback
    // Это гарантирует, что только одна карточка открыта в любой момент
    otherOpenItems.forEach((otherItem) => {
      // Закрываем синхронно - сразу убираем класс is-open и сбрасываем высоту
      const otherBtn = otherItem.querySelector('.faq-question');
      const otherPanel = otherItem.querySelector('.faq-answer');
      if (otherPanel) {
        otherItem.classList.remove('is-open');
        otherBtn?.setAttribute('aria-expanded', 'false');
        otherPanel.style.height = '0px';
        otherPanel.style.overflow = 'hidden';
        // Очищаем обработчики transitionend
        const existingHandler = transitionHandlers.get(otherItem);
        if (existingHandler) {
          otherPanel.removeEventListener('transitionend', existingHandler);
          transitionHandlers.delete(otherItem);
        }
        animatingItems.delete(otherItem);
      }
    });
    
    // Теперь открываем новый элемент
    openItem(item);
  });

  // Закрытие по клику вне карточки: используем pointerdown с capture для надёжности
  // Capture: true гарантирует, что обработчик сработает ДО других обработчиков
  const handleOutsideClick = (e) => {
    // Если клик по самой кнопке вопроса - не закрываем (обрабатывается выше)
    if (e.target.closest('.faq-question') || e.target.classList.contains('faq-question')) {
      return;
    }
    
    // Проверяем, есть ли открытые элементы
    const openItems = items.filter(item => item.classList.contains('is-open'));
    if (openItems.length === 0) return; // Нет открытых - ничего не делаем
    
    // Проверяем, кликнули ли мы внутри какой-либо FAQ-карточки
    const clickedItem = e.target.closest('.faq-item');
    
    // Если клик внутри .faq-item - не закрываем (это клик внутри карточки)
    if (clickedItem) return;
    
    // Если клик внутри .investment-faq, но не внутри .faq-item → закрываем
    // Если клик вне .investment-faq → тоже закрываем
    // Это включает клик по правой картинке (.faq-aside--visual), по фону секции, чат-виджету, и т.д.
    closeAll();
  };
  
  // Регистрируем обработчик с capture: true для перехвата всех кликов ДО других обработчиков
  // Это гарантирует, что клик вне FAQ будет обработан даже если другие элементы (чат, модалки) перехватывают события
  document.addEventListener('pointerdown', handleOutsideClick, { capture: true });
  // Также добавляем mousedown для совместимости
  document.addEventListener('mousedown', handleOutsideClick, { capture: true });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
}

/* ==========================================================
   FAQ PARALLAX
   ========================================================== */
function initFaqParallax() {
  if (window.__faqParallaxInitialized) return;
  window.__faqParallaxInitialized = true;

  const section = document.querySelector('.investment-faq');
  if (!section) {
    if (isDev()) console.warn('[initFaqParallax] .investment-faq section not found on this page');
    return;
  }

  section.style.setProperty('--faq-parallax-y', '0px');
  return;

  const update = () => {
    const vh = window.innerHeight;
    const anchorPxFromTop = 260;
    const anchorY = section.offsetTop + anchorPxFromTop;
    const viewportCenterY = window.scrollY + vh / 2;

    const progress = (viewportCenterY - anchorY) / (vh / 2);
    const y = Math.round(Math.max(-1, Math.min(1, progress)) * 18);

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
  if (window.__trustParallaxInitialized) return;
  window.__trustParallaxInitialized = true;

  const section = document.querySelector('.trust-parallax');
  if (!section) {
    if (isDev()) console.warn('[initTrustParallax] .trust-parallax section not found on this page');
    return;
  }

  section.style.setProperty('--trust-parallax-y', '0px');
  section.style.setProperty('--trust-panel-y', '0px');
  return;

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
    const y = Math.round(Math.max(-1, Math.min(1, -progress)) * 62);
    // Ограничиваем движение фона: не позволяем подниматься выше верхней границы секции (минимум 0)
    const clampedY = Math.max(0, y);
    section.style.setProperty('--trust-parallax-y', `${clampedY}px`);

    const py = Math.round(Math.max(-1, Math.min(1, -progress)) * -18);
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
   FIND PARALLAX (для секции "Как нас найти")
   ========================================================== */
function initFindParallax() {
  if (window.__findParallaxInitialized) return;
  window.__findParallaxInitialized = true;

  const section = document.querySelector('.investment-find');
  if (!section) {
    if (isDev()) console.warn('[initFindParallax] .investment-find section not found on this page');
    return;
  }

  const parallaxElements = section.querySelectorAll('[data-parallax]');
  parallaxElements.forEach((el) => {
    el.style.transform = '';
  });
  return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return;
  }

  // Find all parallax elements with data-parallax attribute
  const parallaxElementsLive = section.querySelectorAll('[data-parallax]');
  if (!parallaxElementsLive.length) {
    if (isDev()) console.warn('[initFindParallax] No [data-parallax] elements found');
    return;
  }

  let raf = 0;
  const update = () => {
    raf = 0;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    
    parallaxElementsLive.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed || '0.18');
      const elRect = el.getBoundingClientRect();
      
      // Calculate parallax offset based on element position in viewport
      const elementCenter = elRect.top + elRect.height / 2;
      const viewportCenter = vh / 2;
      const distance = elementCenter - viewportCenter;
      const offset = Math.round(Math.max(-35, Math.min(35, distance * speed)));

      // Use transform for better performance (especially on iOS); integer px reduces flicker
      el.style.transform = `translate3d(0, ${offset}px, 0) scale(1.10)`;
    });
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
  if (window.__telegramLeadsInitialized) return;
  window.__telegramLeadsInitialized = true;

  // Endpoint relative to current page. Works for all fraud/* and consumer-protection/* depth levels.
  const pathParts = window.location.pathname
    .split('/')
    .filter(Boolean);
  if (pathParts.length && pathParts[pathParts.length - 1].endsWith('.html')) {
    pathParts.pop();
  }

  const sections = new Set(['fraud', 'consumer-protection']);
  const sectionIndex = pathParts.findIndex((part) => sections.has(part));
  let ENDPOINT = './api/telegram.php';
  if (sectionIndex !== -1) {
    const depthInsideSection = Math.max(0, pathParts.length - (sectionIndex + 1));
    const prefix = depthInsideSection === 0 ? './' : '../'.repeat(depthInsideSection);
    ENDPOINT = `${prefix}api/telegram.php`;
  }

  const forms = new Set();
  document.querySelectorAll('form').forEach((form) => {
    const action = (form.getAttribute('action') || '').toLowerCase();
    const isTelegramForm =
      action.includes('api/telegram.php') ||
      form.hasAttribute('data-tg-lead') ||
      form.hasAttribute('data-keis-lead');
    if (isTelegramForm) forms.add(form);
  });

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

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    const clearFormFields = () => {
      const allFields = form.querySelectorAll('input:not([type="hidden"]), textarea');
      allFields.forEach((field) => {
        if (field && 'value' in field) field.value = '';
      });
    };

    const runSuccessFlow = () => {
      setBtnState(submitBtn, 'success');
      clearFormFields();
      openSuccessModal();
    };

    const tryMockSuccess = (reason, extra) => {
      if (!isLocalPreview()) return false;
      if (isDev()) {
        console.warn('[initTelegramLeads] mock success (local preview):', reason, extra ?? '');
      }
      runSuccessFlow();
      return true;
    };

    let fallbackTriggered = false;
    const fallbackToNativeSubmit = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;
      form.removeEventListener('submit', onSubmit);
      form.submit();
    };

    const onSubmit = async (e) => {
      // Let browser validation run
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) return;

      e.preventDefault();

      if (!lastSuccessClickCoords) {
        if (submitBtn) {
          const rect = submitBtn.getBoundingClientRect();
          lastSuccessClickCoords = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          };
        } else {
          const vw = window.innerWidth || document.documentElement.clientWidth || 0;
          const vh = window.innerHeight || document.documentElement.clientHeight || 0;
          lastSuccessClickCoords = {
            x: vw / 2,
            y: vh / 2,
          };
        }
      }

      setBtnState(submitBtn, 'loading');

      const endpoint = form.getAttribute('action') || ENDPOINT;

      try {
        const fd = toFormData(form);
        const debugPayload = isDev() ? Object.fromEntries(Array.from(fd.entries())) : null;

        if (isDev()) {
          console.log('[initTelegramLeads] POST', endpoint, debugPayload);
        }

        const res = await fetch(endpoint, {
          method: 'POST',
          body: fd,
        });

        const json = await res.json().catch(() => ({}));

        if (isDev()) {
          console.log('[initTelegramLeads] response', endpoint, res.status, json);
        }

        if (!res.ok || !json.ok) {
          if (isDev()) console.error('[initTelegramLeads] send failed', res.status, json);
          if (tryMockSuccess(`POST ${endpoint} failed`, { status: res.status, json })) return;
          setBtnState(submitBtn, 'idle');
          fallbackToNativeSubmit();
          return;
        }

        runSuccessFlow();
      } catch (err) {
        if (isDev()) console.error('[initTelegramLeads] exception', err);
        if (tryMockSuccess(`POST ${endpoint} threw`, err instanceof Error ? err.message : err)) return;
        setBtnState(submitBtn, 'idle');
        fallbackToNativeSubmit();
      }
    };

    form.addEventListener('submit', onSubmit);
  });
}

/* ==========================================================
   SUCCESS MODAL: Подтверждение отправки формы
   ========================================================== */
// ЗАДАЧА 2: Сохраняем scrollY для success modal
let savedSuccessScrollY = 0;
let savedSuccessScrollX = 0;
let lastSuccessClickCoords = null;
const SUCCESS_MODAL_VIEWPORT_GAP = 24;
const SUBMIT_POINTER_EVENT = 'PointerEvent' in window ? 'pointerdown' : 'mousedown';

const captureSubmitPointer = (evt) => {
  const target = evt.target;
  if (!(target instanceof Element)) return;
  const submitEl = target.closest('button[type="submit"], input[type="submit"], [data-keis-submit]');
  if (!submitEl) return;
  if (!submitEl.closest('form')) return;
  lastSuccessClickCoords = {
    x: typeof evt.clientX === 'number' ? evt.clientX : window.innerWidth / 2,
    y: typeof evt.clientY === 'number' ? evt.clientY : window.innerHeight / 2,
  };
};

if (!window.__keisSubmitPointerTrackerInitialized) {
  document.addEventListener(SUBMIT_POINTER_EVENT, captureSubmitPointer, { passive: true });
  window.__keisSubmitPointerTrackerInitialized = true;
}

const restoreInstantScroll = (x, y) => {
  const docEl = document.documentElement;
  const body = document.body;
  const prevDocBehavior = docEl.style.scrollBehavior;
  const prevBodyBehavior = body.style.scrollBehavior;
  docEl.style.scrollBehavior = 'auto';
  body.style.scrollBehavior = 'auto';
  window.scrollTo(x, y);
  if (prevDocBehavior) {
    docEl.style.scrollBehavior = prevDocBehavior;
  } else {
    docEl.style.removeProperty('scroll-behavior');
  }
  if (prevBodyBehavior) {
    body.style.scrollBehavior = prevBodyBehavior;
  } else {
    body.style.removeProperty('scroll-behavior');
  }
};

function openSuccessModal(options = {}) {
  const { forceCenter = false } = options;
  const successModal = document.getElementById('successModal');
  if (!successModal) return;

  const clampValue = (value, min, max) => Math.min(Math.max(value, min), max);
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth || 0;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight || 0;

  const desiredPosition = forceCenter
    ? { x: viewportWidth / 2, y: viewportHeight / 2 }
    : (lastSuccessClickCoords || { x: viewportWidth / 2, y: viewportHeight / 2 });

  const initialX = clampValue(
    desiredPosition.x,
    SUCCESS_MODAL_VIEWPORT_GAP,
    Math.max(SUCCESS_MODAL_VIEWPORT_GAP, viewportWidth - SUCCESS_MODAL_VIEWPORT_GAP)
  );
  const initialY = clampValue(
    desiredPosition.y,
    SUCCESS_MODAL_VIEWPORT_GAP,
    Math.max(SUCCESS_MODAL_VIEWPORT_GAP, viewportHeight - SUCCESS_MODAL_VIEWPORT_GAP)
  );

  successModal.style.setProperty('--success-modal-left', `${initialX}px`);
  successModal.style.setProperty('--success-modal-top', `${initialY}px`);

  // Сохраняем текущую позицию скролла
  savedSuccessScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
  savedSuccessScrollX = window.scrollX || window.pageXOffset || document.documentElement.scrollLeft || 0;
  
  successModal.classList.add('is-open');
  successModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  document.documentElement.classList.add('success-modal-open');
  
  // Блокируем скролл фона (iOS-safe)
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedSuccessScrollY}px`;
  document.body.style.width = '100%';

  const panel = successModal.querySelector('.keis-success-modal__panel');
  if (panel) {
    const schedule = (window.requestAnimationFrame && window.requestAnimationFrame.bind(window)) || ((cb) => setTimeout(cb, 0));
    const ensureWithinViewport = () => {
      const rect = panel.getBoundingClientRect();
      const halfWidth = rect.width / 2;
      const halfHeight = rect.height / 2;
      const clampWithHalfSize = (value, halfSize, viewportSize) => {
        const min = halfSize + SUCCESS_MODAL_VIEWPORT_GAP;
        const max = viewportSize - halfSize - SUCCESS_MODAL_VIEWPORT_GAP;
        if (max <= min) {
          return viewportSize / 2;
        }
        return clampValue(value, min, max);
      };
      const safeX = clampWithHalfSize(desiredPosition.x, halfWidth, viewportWidth);
      const safeY = clampWithHalfSize(desiredPosition.y, halfHeight, viewportHeight);
      successModal.style.setProperty('--success-modal-left', `${safeX}px`);
      successModal.style.setProperty('--success-modal-top', `${safeY}px`);
    };
    schedule(ensureWithinViewport);
  }

  lastSuccessClickCoords = null;
}

window.keisShowConfirmAt = (x, y) => {
  if (typeof x === 'number' && typeof y === 'number') {
    lastSuccessClickCoords = { x, y };
  }
  openSuccessModal();
};

function closeSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;
  
  successModal.classList.remove('is-open');
  successModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  document.documentElement.classList.remove('success-modal-open');
  
  // ЗАДАЧА 2: Восстанавливаем scrollY без анимации
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  restoreInstantScroll(savedSuccessScrollX, savedSuccessScrollY);
  savedSuccessScrollY = 0;
  savedSuccessScrollX = 0;
}
/* ==========================================================
   COUNTER ANIMATION для scenarios-trust-bridge
   Анимация счетчика от 1 млн до 200 млн+ при скролле к блоку
   ========================================================== */
function initCounterAnimation() {
  if (window.__counterAnimationInitialized) return;
  window.__counterAnimationInitialized = true;

  const counters = document.querySelectorAll('.scenarios-trust-bridge__counter');
  if (!counters.length) {
    if (isDev()) console.warn('[initCounterAnimation] .scenarios-trust-bridge__counter not found');
    return;
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    // Если пользователь предпочитает уменьшенную анимацию, просто показываем финальное значение
    counters.forEach(counter => {
      const target = parseInt(counter.dataset.target || '200000000', 10);
      const valueEl = counter.querySelector('.scenarios-trust-bridge__counter-value');
      if (valueEl) {
        const millions = Math.floor(target / 1000000);
        valueEl.textContent = millions.toLocaleString('ru-RU');
      }
    });
    return;
  }

  const animateCounter = (counter) => {
    if (counter.dataset.animated === 'true') return; // Уже анимирован
    counter.dataset.animated = 'true';

    const target = parseInt(counter.dataset.target || '200000000', 10);
    const valueEl = counter.querySelector('.scenarios-trust-bridge__counter-value');
    const suffixEl = counter.querySelector('.scenarios-trust-bridge__counter-suffix');
    const labelEl = counter.querySelector('.scenarios-trust-bridge__counter-label');
    if (!valueEl) return;

    const start = 1000000; // 1 млн
    const end = target; // 200 млн
    const duration = 2000; // 2 секунды
    const startTime = performance.now();

    const formatNumber = (num) => {
      const millions = Math.floor(num / 1000000);
      return millions.toLocaleString('ru-RU');
    };

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing функция для плавной анимации
      const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const current = start + (end - start) * easedProgress;
      valueEl.textContent = formatNumber(current);

      // показать суффикс и подпись при приближении к финалу
      const revealAt = 0.6;
      const revealElement = (el) => {
        if (!el) return;
        el.classList.add('is-visible');
        try {
          el.style.opacity = '1';
          el.style.transform = '';
        } catch (e) {}
      };

      if (progress >= revealAt) {
        revealElement(suffixEl);
        revealElement(labelEl);
      }

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        // Финальное значение
        valueEl.textContent = formatNumber(end);
        revealElement(suffixEl);
        revealElement(labelEl);
      }
    };

    requestAnimationFrame(update);
  };

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3 // Анимация запускается когда 30% блока видно
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        animateCounter(counter);
        observer.unobserve(counter); // Отключаем наблюдение после анимации
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

/* ==========================================================
   BRIDGE COUNTERS: Анимация счетчиков в keis-bridge
   Анимация метрик при скролле к блоку (money: 1 млн → 200 млн+, years: 1 → 30 лет+)
   ========================================================== */
function initBridgeCounters() {
  if (window.__bridgeCountersInitialized) return;
  window.__bridgeCountersInitialized = true;

  const metrics = document.querySelectorAll('.keis-bridge__metric[data-bridge-counter]');
  if (!metrics.length) {
    if (isDev()) console.warn('[initBridgeCounters] .keis-bridge__metric not found');
    return;
  }

  const settingsByType = {
    money: { target: 400, duration: 1100 },
    years: { target: 30, duration: 900 },
    cases: { target: 1700, duration: 1200 },
  };

  const getTargetValue = (metric, counterType) => {
    const fallback = settingsByType[counterType]?.target ?? 0;
    const parsed = parseFloat(metric.dataset.target);
    if (!Number.isNaN(parsed)) return parsed;
    return fallback;
  };

  const markMetricDone = (metric, numberEl, finalValue) => {
    if (numberEl) numberEl.textContent = String(finalValue);
    metric.classList.add('is-done');
    const parentBridge = metric.closest('.keis-bridge');
    if (parentBridge) parentBridge.classList.add('is-done');
  };

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    metrics.forEach(metric => {
      const counterType = metric.dataset.bridgeCounter;
      const valueEl = metric.querySelector('[data-counter-value]');
      if (!valueEl) return;

      const numberEl = valueEl.querySelector('.keis-bridge__metric-number') || valueEl;
      const finalValue = Math.max(0, Math.round(getTargetValue(metric, counterType)));
      markMetricDone(metric, numberEl, finalValue);
    });
    return;
  }

  // Easing функция для плавной анимации
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  const animateMetric = (metric) => {
    if (metric.dataset.animated === 'true') return; // Уже анимирован
    metric.dataset.animated = 'true';

    const counterType = metric.dataset.bridgeCounter;
    const settings = settingsByType[counterType];
    if (!settings) return;

    const valueEl = metric.querySelector('[data-counter-value]');
    const numberEl = (valueEl && (valueEl.querySelector('.keis-bridge__metric-number') || valueEl.querySelector('.scenarios-trust-bridge__counter-value'))) || valueEl;
    if (!valueEl || !numberEl) return;

    const finalValue = Math.max(0, Math.round(getTargetValue(metric, counterType)));
    const duration = settings.duration;
    const startValue = 0;
    const endValue = finalValue;

    const formatValue = (num) => Math.round(num).toString();

    const startTime = performance.now();

    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startValue + (endValue - startValue) * easedProgress;

      numberEl.textContent = formatValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        markMetricDone(metric, numberEl, finalValue);
      }
    };

    requestAnimationFrame(update);
  };

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.4 // Анимация запускается когда 40% блока видно
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const metric = entry.target;
        animateMetric(metric);
        observer.unobserve(metric); // Отключаем наблюдение после анимации
      }
    });
  }, observerOptions);

  metrics.forEach(metric => {
    observer.observe(metric);
  });
}

/* ==========================================================
   SUCCESS MODAL: close handlers (shown after submit)
   ========================================================== */
function initSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;
  
  const closers = successModal.querySelectorAll('[data-close-success-modal]');
  closers.forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      closeSuccessModal();
    });
  });
  
  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && successModal.classList.contains('is-open')) {
      closeSuccessModal();
    }
  });
}


/* ==========================================================
   YANDEX METRIKA: init without inline scripts
   ========================================================== */
function initYandexMetrika() {
  const id = 106061151;

  // Only init on pages that include tag.js in HTML (keeps behavior predictable).
  const existing = document.querySelector('script[src="https://mc.yandex.ru/metrika/tag.js"]');
  if (!existing) {
    return;
  }

  // Provide the queue function if ym is not available yet (mirrors official snippet behavior).
  if (typeof window.ym !== 'function') {
    window.ym = function () {
      (window.ym.a = window.ym.a || []).push(arguments);
    };
    window.ym.l = 1 * new Date();
  }

  try {
    window.ym(id, 'init', {
      clickmap: true,
      trackLinks: true,
      accurateTrackBounce: true,
      webvisor: true,
    });
  } catch (_) {
    // no-op (blocked by browser/extension)
  }
}


/* ==========================================================
   TICKER: lightweight initTicker() — clones content for seamless scroll
   - stores original HTML in data-original
   - duplicates until width >= viewport*2
   - debounced resize via requestAnimationFrame
   - sets data-anim to enable CSS animation
   ========================================================== */
/* initTicker removed — running ticker disabled per request */

/* =========================
   Left sticky ask (desktop)
   ========================= */
function initLeftStickyAsk() {
  try {
    if (window.__kgObsidianDriftInitialized) return;
    window.__kgObsidianDriftInitialized = true;

    const path = window.location.pathname || '';
    const isTargetPage = /\/(fraud|consumer-protection)\//.test(path);
    if (!isTargetPage) return;

    const viewportBlock = window.matchMedia('(max-width: 980px)');
    if (viewportBlock.matches) return;

    const isDismissed = () => false; // show on every load (no session persistence)

    const rawSections = Array.from(document.querySelectorAll('main section, body > section, section'));
    if (!rawSections.length) return;

    const techSelectors = ['.keis-mobile-menu', '.modal', '.overlay', '.popup', '.tg-widget', '.drawer'];
    const seen = new Set();
    const contentSections = rawSections.filter((section) => {
      if (!(section instanceof HTMLElement)) return false;
      if (seen.has(section)) return false;
      seen.add(section);
      if (section.closest('[aria-hidden="true"]')) return false;
      if (techSelectors.some((sel) => section.closest(sel) || section.matches(sel))) return false;
      const style = window.getComputedStyle(section);
      if (!style) return false;
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
      if (style.position === 'fixed' || style.position === 'absolute') return false;
      return true;
    });

    const thirdSection = contentSections[2];
    if (!thirdSection || !document.body) return;

    let wrap = document.querySelector('.kg-obsidian-drift');
    if (!wrap) {
      wrap = document.createElement('div');
      document.body.appendChild(wrap);
    }
    wrap.className = 'kg-obsidian-drift is-hidden';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'kg-obsidian-drift__panel';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'kg-obsidian-drift__close';
    closeBtn.setAttribute('aria-label', 'Закрыть блок');

    const eyebrow = document.createElement('div');
    eyebrow.className = 'kg-obsidian-drift__eyebrow';
    eyebrow.textContent = '';

    const title = document.createElement('p');
    title.className = 'kg-obsidian-drift__title';
    title.textContent = 'За 10 минут общения с нашим юристом Вы узнаете больше, чем за 5 дней поиска в интернете';

    const actions = document.createElement('div');
    actions.className = 'kg-obsidian-drift__actions';

    const askBtn = document.createElement('button');
    askBtn.type = 'button';
    askBtn.className = 'kg-obsidian-drift__btn';
    askBtn.textContent = 'консультация';

    actions.appendChild(askBtn);
    panel.append(closeBtn, eyebrow, title, actions);
    wrap.appendChild(panel);

    const state = {
      hasShown: false,
      dismissed: false,
      autoHidden: false,
    };
    let autoFrame = null;

    const setAriaVisible = (visible) => wrap.setAttribute('aria-hidden', visible ? 'false' : 'true');

    const hide = ({ persist = false, reason = 'manual', immediate = false, markAuto = false } = {}) => {
      if (persist && state.dismissed) return;
      if (markAuto && state.autoHidden) return;
      // ensure transition always plays when hiding
      wrap.classList.remove('is-hidden');
      // force reflow so the transform/opacity transition runs
      void wrap.offsetWidth;
      wrap.classList.remove('is-visible');
      wrap.classList.add('is-hiding');
      setAriaVisible(false);
      if (markAuto) state.autoHidden = true;
      if (persist) {
        state.dismissed = true;
      }
      const finalizeHide = () => {
        wrap.classList.remove('is-hiding');
        wrap.classList.add('is-hidden');
      };
      if (immediate) {
        finalizeHide();
        return;
      }
      const onTransitionEnd = (event) => {
        if (event.target !== wrap || (event.propertyName !== 'transform' && event.propertyName !== 'opacity')) return;
        wrap.removeEventListener('transitionend', onTransitionEnd);
        finalizeHide();
      };
      wrap.addEventListener('transitionend', onTransitionEnd);
      if (isDev()) console.debug('[obsidian-drift] hide', reason);
    };

    const show = () => {
      if (state.dismissed || state.hasShown || viewportBlock.matches) return;
      state.hasShown = true;
      wrap.classList.remove('is-hidden', 'is-hiding');
      wrap.classList.add('is-visible');
      setAriaVisible(true);
      scheduleAutoCheck();
    };

    const checkAutoClose = () => {
      if (!state.hasShown || state.dismissed) return;
      const target = contentSections[8];
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      const midpoint = viewportHeight * 0.55;
      if (rect.top < midpoint && rect.bottom > midpoint) {
        hide({ reason: 'auto-9th', markAuto: true });
      }
    };

    const scheduleAutoCheck = () => {
      if (autoFrame) return;
      autoFrame = requestAnimationFrame(() => {
        autoFrame = null;
        checkAutoClose();
      });
    };

    const sentinel = document.createElement('div');
    sentinel.className = 'kg-obsidian-drift__sentinel';
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'display:block;width:100%;height:2px;margin-top:2px;pointer-events:none;';
    thirdSection.appendChild(sentinel);

    let revealObserver = null;
    const triggerReveal = () => {
      if (state.hasShown || state.dismissed || viewportBlock.matches) return;
      const rect = sentinel.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (rect.bottom <= viewportHeight) {
        show();
        if (revealObserver) revealObserver.disconnect();
      }
    };

    if ('IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target !== sentinel) return;
          if (entry.isIntersecting) {
            show();
            revealObserver.disconnect();
          }
        });
      }, { threshold: 0, rootMargin: '0px 0px -20px 0px' });
      revealObserver.observe(sentinel);
    } else {
      triggerReveal();
      window.addEventListener('scroll', triggerReveal, { passive: true });
    }

    const openContactModal = () => {
      if (typeof window.__keisOpenContactModal === 'function') {
        window.__keisOpenContactModal();
        return;
      }
      document.querySelector('[data-open-contact-modal]')?.click();
    };

    closeBtn.addEventListener('click', () => hide({ persist: true, reason: 'manual' }));
    askBtn.addEventListener('click', () => {
      hide({ persist: true, reason: 'cta' });
      setTimeout(openContactModal, 120);
    });

    const applyViewportBlock = (e) => {
      if (!viewportBlock.matches) return;
      hide({ immediate: true, reason: e ? 'resize' : 'init', markAuto: true });
      if (revealObserver) revealObserver.disconnect();
    };
    applyViewportBlock();
    if (typeof viewportBlock.addEventListener === 'function') {
      viewportBlock.addEventListener('change', applyViewportBlock);
    } else if (typeof viewportBlock.addListener === 'function') {
      viewportBlock.addListener(applyViewportBlock);
    }

    const swipeState = {
      active: false,
      pointerId: null,
      startX: 0,
      startY: 0,
    };

    const resetSwipe = () => {
      swipeState.active = false;
      swipeState.pointerId = null;
      swipeState.startX = 0;
      swipeState.startY = 0;
    };

    panel.addEventListener('pointerdown', (event) => {
      if (state.dismissed || viewportBlock.matches) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      swipeState.active = true;
      swipeState.pointerId = event.pointerId;
      swipeState.startX = event.clientX;
      swipeState.startY = event.clientY;
    }, { passive: true });

    panel.addEventListener('pointermove', (event) => {
      if (!swipeState.active || event.pointerId !== swipeState.pointerId) return;
      const dx = event.clientX - swipeState.startX;
      const dy = event.clientY - swipeState.startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 24) {
        resetSwipe();
        return;
      }
      if (dx <= -60 && Math.abs(dx) > Math.abs(dy)) {
        resetSwipe();
        hide({ persist: true, reason: 'swipe' });
      }
    }, { passive: true });

    window.addEventListener('scroll', scheduleAutoCheck, { passive: true });
    window.addEventListener('resize', scheduleAutoCheck, { passive: true });
    window.addEventListener('orientationchange', scheduleAutoCheck, { passive: true });

    panel.addEventListener('pointerup', (event) => {
      if (event.pointerId === swipeState.pointerId) resetSwipe();
    }, { passive: true });
    panel.addEventListener('pointercancel', (event) => {
      if (event.pointerId === swipeState.pointerId) resetSwipe();
    }, { passive: true });

    // Auto-hide strictly on the 9th visible content section; no extra anchors.

  } catch (e) {
    console.warn('[initLeftStickyAsk] failed:', e);
  }
}

