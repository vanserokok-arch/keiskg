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
  if (window.__keisFormsUXInitialized) return;
  window.__keisFormsUXInitialized = true;
  
  // Global registry of all form controllers
  window.__keisFormControllers = new Map();
  
  // Apply to all forms on the page but only operate on forms that contain
  // the expected fields. This lets the UX reach forms that are not branded
  // as `hero-form` while avoiding unrelated forms.
  const forms = document.querySelectorAll('form');
  if (!forms.length) return;
  // Изначальные placeholder'ы (не жирные, читаемые)
  const initialPlaceholders = {
    name: 'Как вас зовут?',
    phone: 'Ваш номер',
    message: 'Опишите свой вопрос'
  };
  
  // Placeholder'ы для разных страниц
  const placeholdersByPage = {
    'page-investment': {
      name: 'Как вас зовут?',
      phone: 'Ваш номер',
      message: 'Опишите свой вопрос'
    },
    'page-influence': {
      name: 'Как вас зовут?',
      phone: 'Ваш номер',
      message: 'Опишите свой вопрос'
    },
    'page-credit': {
      name: 'Как вас зовут?',
      phone: 'Ваш номер',
      message: 'Опишите свой вопрос'
    },
    'page-main': {
      name: 'Как вас зовут?',
      phone: 'Ваш номер',
      message: 'Опишите свой вопрос'
    }
  };
  
  const getPagePlaceholders = () => {
    const body = document.body;
    for (const cls of ['page-investment','page-influence','page-credit','page-main']) {
      if (body.classList.contains(cls)) return placeholdersByPage[cls];
    }
    // fallback by pathname
    const path = window.location.pathname;
    if (path.includes('/investment')) return placeholdersByPage['page-investment'];
    if (path.includes('/influence')) return placeholdersByPage['page-influence'];
    if (path.includes('/credit')) return placeholdersByPage['page-credit'];
    return placeholdersByPage['page-main'];
  };

  const samplesByPage = {
    'page-investment': {
      name: 'Иванов Алексей',
      phone: '+7 (981) 654-32-10',
      message: 'Моё вложение в проект оказалось мошенничеством, помогите вернуть средства.'
    },
    'page-influence': {
      name: 'Петрова Мария',
      phone: '+7 (981) 654-32-10',
      message: 'Меня убедили перевести деньги под давлением, нужны рекомендации и возврат.'
    },
    'page-credit': {
      name: 'Сидоров Алексей',
      phone: '+7 (981) 654-32-10',
      message: 'Меня обманули мошенники и украли все мои сбережения'
    },
    'page-main': {
      name: 'Иванов Алексей',
      phone: '+7 (981) 654-32-10',
      message: 'Меня обманули мошенники и украли все мои сбережения'
    }
  };

  const getPageSample = () => {
    const body = document.body;
    for (const cls of ['page-investment','page-influence','page-credit','page-main']) {
      if (body.classList.contains(cls)) return samplesByPage[cls];
    }
    // fallback by pathname
    const path = window.location.pathname;
    if (path.includes('/investment')) return samplesByPage['page-investment'];
    if (path.includes('/influence')) return samplesByPage['page-influence'];
    if (path.includes('/credit')) return samplesByPage['page-credit'];
    return samplesByPage['page-main'];
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // FIX 2: Печатание текста в placeholder (не в value - value принадлежит только пользователю)
  const typeText = async (el, text, speed = 50) => {
    if (!el) return;
    // если пользователь взаимодействует с полем, прерываем
    if (document.activeElement === el) return;
    el.classList.add('is-typing');
    // Очищаем value если там что-то есть (но не трогаем placeholder)
    if (el.value) el.value = '';
    // Убираем placeholder перед началом печати
    const originalPlaceholder = el.getAttribute('placeholder') || '';
    el.setAttribute('placeholder', '');
    
    // Печатаем в placeholder через data-атрибут и обновляем placeholder
    let typedText = '';
    for (let i = 0; i < text.length; i++) {
      // Прерываем, если пользователь начал взаимодействовать
      if (document.activeElement === el) {
        el.setAttribute('placeholder', originalPlaceholder);
        el.classList.remove('is-typing');
        return;
      }
      typedText = text.slice(0, i + 1);
      el.setAttribute('placeholder', typedText);
      await sleep(speed);
    }
    await sleep(150);
    el.classList.remove('is-typing');
    // Оставляем placeholder как есть (он уже содержит полный текст)
  };

  // Анимация нажатия кнопки
  const animateButtonPress = async (btn) => {
    if (!btn) return;
    btn.classList.add('is-pressing');
    await sleep(200);
    btn.classList.remove('is-pressing');
    await sleep(100);
  };

  // Helper: Check if form is fully filled (considers required fields only)
  const isFormFullyFilled = (formEl) => {
    const fields = formEl.querySelectorAll('input[required], textarea[required]');
    if (fields.length === 0) {
      // If no required fields, check all visible inputs
      const allFields = formEl.querySelectorAll('input:not([type="hidden"]):not([disabled]), textarea:not([disabled])');
      return Array.from(allFields).every(f => f.value && f.value.trim());
    }
    return Array.from(fields).every(f => f.value && f.value.trim() && !f.disabled && !f.hidden);
  };

  // Helper: Clear field values only (no background changes)
  const clearFormValuesOnly = (formEl) => {
    const fields = formEl.querySelectorAll('input:not([type="hidden"]), textarea');
    fields.forEach(f => {
      if (f && !f.disabled && !f.hidden) {
        f.value = '';
        f.classList.remove('is-typing', 'placeholder-fade-out', 'fade-out');
      }
    });
  };

  // Helper: Reset form to initial placeholders
  const resetFormToInitialPlaceholders = (formEl, pagePlaceholders) => {
    const nameEl = formEl.querySelector('input[name="name"], input[name="fullname"], input[name="your_name"]');
    const phoneEl = formEl.querySelector('input[name="phone"], input[name="tel"], input[name="phone_number"]');
    const msgEl = formEl.querySelector('textarea[name="message"], textarea[name="question"], textarea[name="text"], textarea[name="comment"], textarea[name="situation"], input[name="message"]');
    
    if (nameEl) nameEl.setAttribute('placeholder', pagePlaceholders.name);
    if (phoneEl) phoneEl.setAttribute('placeholder', pagePlaceholders.phone);
    if (msgEl) msgEl.setAttribute('placeholder', pagePlaceholders.message);
  };

  // Helper: Clear placeholder artifacts across ALL forms if any are typing
  const clearAllTypingArtifacts = (exceptForm = null) => {
    window.__keisFormControllers.forEach((controller, formEl) => {
      if (formEl === exceptForm) return;
      if (controller.typingState.isTyping) {
        controller.stopTypewriter();
        controller.clearPlaceholderArtifacts();
      }
    });
  };

  forms.forEach((form) => {
    const nameEl = form.querySelector('input[name="name"], input[name="fullname"], input[name="your_name"]');
    const phoneEl = form.querySelector('input[name="phone"], input[name="tel"], input[name="phone_number"]');
    const msgEl = form.querySelector('textarea[name="message"], textarea[name="question"], textarea[name="text"], textarea[name="comment"], textarea[name="situation"], input[name="message"]');

    // skip forms explicitly opted-out
    if (form.hasAttribute('data-no-ux') || form.dataset.keisUx === 'off') return;

  // set initial placeholders based on page
    const pagePlaceholders = getPagePlaceholders();
    const samples = getPageSample();
    if (nameEl && !(nameEl.getAttribute('placeholder') || '').trim()) nameEl.setAttribute('placeholder', pagePlaceholders.name);
    if (phoneEl && !(phoneEl.getAttribute('placeholder') || '').trim()) phoneEl.setAttribute('placeholder', pagePlaceholders.phone);
    if (msgEl && !(msgEl.getAttribute('placeholder') || '').trim()) msgEl.setAttribute('placeholder', pagePlaceholders.message);

    // Form controller object
    const controller = {
      form: form,
      nameEl,
      phoneEl,
      msgEl,
      fields: [nameEl, phoneEl, msgEl].filter(Boolean),
      stop: false,
      cycleRunning: false,
      blurTimeoutId: null,
      typingState: {
        isTyping: false,
        fieldIndex: 0,
        charIndex: 0,
        paused: false
      },
      initialPlaceholders: {
        name: nameEl ? (nameEl.getAttribute('placeholder') || pagePlaceholders.name) : '',
        phone: phoneEl ? (phoneEl.getAttribute('placeholder') || pagePlaceholders.phone) : '',
        message: msgEl ? (msgEl.getAttribute('placeholder') || pagePlaceholders.message) : ''
      },
      
      stopTypewriter() {
        this.stop = true;
        this.typingState.paused = true;
        this.typingState.isTyping = false;
      },
      
      clearPlaceholderArtifacts() {
        // FIX 2: Очищаем placeholder artifacts (typewriter работает через placeholder)
        const ph = this.initialPlaceholders;
        if (this.nameEl) {
          this.nameEl.value = ''; // Очищаем value только если пользователь что-то ввел
          this.nameEl.classList.remove('is-typing', 'placeholder-fade-out', 'fade-out');
          this.nameEl.setAttribute('placeholder', ph.name);
        }
        if (this.phoneEl) {
          this.phoneEl.value = '';
          this.phoneEl.classList.remove('is-typing', 'placeholder-fade-out', 'fade-out');
          this.phoneEl.setAttribute('placeholder', ph.phone);
        }
        if (this.msgEl) {
          this.msgEl.value = '';
          this.msgEl.classList.remove('is-typing', 'placeholder-fade-out', 'fade-out');
          this.msgEl.setAttribute('placeholder', ph.message);
        }
      },
      
      isFormFullyFilled() {
        return isFormFullyFilled(this.form);
      }
    };

    // Register controller globally
    window.__keisFormControllers.set(form, controller);

    const resetForm = () => {
      resetFormToInitialPlaceholders(form, pagePlaceholders);
    };

    const runCycle = async () => {
      if (controller.cycleRunning) return;
      controller.cycleRunning = true;
      controller.typingState.isTyping = true;
      while (!controller.stop) {
        // Изначальная пауза 3 секунды с placeholder'ами
        await sleep(3000);
        if (controller.stop) break;

        // Проверяем, не взаимодействует ли пользователь (только если поле в фокусе)
        if ((nameEl && document.activeElement === nameEl) ||
            (phoneEl && document.activeElement === phoneEl) ||
            (msgEl && document.activeElement === msgEl)) {
          await sleep(1000);
          continue;
        }

        // Сначала добавляем класс для плавного fade-out placeholder'ов
        if (nameEl) nameEl.classList.add('placeholder-fade-out');
        if (phoneEl) phoneEl.classList.add('placeholder-fade-out');
        if (msgEl) msgEl.classList.add('placeholder-fade-out');
        
        // Ждём завершения fade-out анимации
        await sleep(500);
        if (controller.stop) break;

        // Только после fade-out убираем placeholder'ы и начинаем typing
        if (nameEl) {
          nameEl.setAttribute('placeholder', '');
          nameEl.classList.remove('placeholder-fade-out');
        }
        if (phoneEl) {
          phoneEl.setAttribute('placeholder', '');
          phoneEl.classList.remove('placeholder-fade-out');
        }
        if (msgEl) {
          msgEl.setAttribute('placeholder', '');
          msgEl.classList.remove('placeholder-fade-out');
        }

        // Печатаем в поле имени
        if (nameEl) {
          controller.typingState.fieldIndex = 0;
          await typeText(nameEl, samples.name, 50);
        }
        await sleep(150); // Минимальная пауза между полями
        if (controller.stop) break;

        // Печатаем в поле телефона
        if (phoneEl) {
          controller.typingState.fieldIndex = 1;
          await typeText(phoneEl, samples.phone, 40);
        }
        await sleep(150); // Минимальная пауза между полями
        if (controller.stop) break;

        // Печатаем в поле текста
        if (msgEl) {
          controller.typingState.fieldIndex = 2;
          await typeText(msgEl, samples.message, 30);
        }
        await sleep(150);
        if (controller.stop) break;

        // FIX 2: СРАЗУ анимация нажатия кнопки с ripple (без автоклика)
        const submitBtn = form.querySelector('button[type="submit"], .btn-primary, .challenges-cta__btn, .faq-ask-btn');
        if (submitBtn) {
          // Set ripple position for circle animation (reuse existing animation)
          const btnRect = submitBtn.getBoundingClientRect();
          const clickX = btnRect.width * 0.92;
          const clickY = btnRect.height * 0.5;
          submitBtn.style.setProperty('--ripple-x', `${clickX}px`);
          submitBtn.style.setProperty('--ripple-y', `${clickY}px`);
          submitBtn.classList.add('typing-complete');
          await sleep(500);
          submitBtn.classList.remove('typing-complete');
        }
        if (controller.stop) break;

        // FIX 2: После кнопки - очищаем placeholder (typewriter работает через placeholder, не value)
        await sleep(300);
        if (controller.stop) break;

        // Clear placeholder artifacts and restore initial placeholders
        if (nameEl) {
          nameEl.setAttribute('placeholder', controller.initialPlaceholders.name);
          nameEl.classList.remove('is-typing');
        }
        if (phoneEl) {
          phoneEl.setAttribute('placeholder', controller.initialPlaceholders.phone);
          phoneEl.classList.remove('is-typing');
        }
        if (msgEl) {
          msgEl.setAttribute('placeholder', controller.initialPlaceholders.message);
          msgEl.classList.remove('is-typing');
        }
        await sleep(300);

        // Очищаем все поля и возвращаем placeholder'ы
        resetForm();
        await sleep(2500); // Пауза перед следующим циклом
      }
      controller.cycleRunning = false;
      controller.typingState.isTyping = false;
    };

    // Set up event listeners for form fields
    controller.fields.forEach((el) => {
      if (!el) return;
      
      el.addEventListener('focus', () => { 
        // Stop this form's typewriter
        controller.stopTypewriter();
        
        // Clear timeout if pending
        if (controller.blurTimeoutId) {
          clearTimeout(controller.blurTimeoutId);
          controller.blurTimeoutId = null;
        }
        
        // If typewriter was running in THIS form, clear artifacts in THIS form
        // AND also clear artifacts in OTHER forms if they are typing
        const wasTyping = controller.fields.some(f => f && f.classList.contains('is-typing'));
        if (wasTyping) {
          controller.clearPlaceholderArtifacts();
          // Also clear artifacts in other forms that are currently typing
          clearAllTypingArtifacts(form);
        } else {
          // Just clean up classes, don't touch placeholders
          el.classList.remove('is-typing', 'placeholder-fade-out', 'fade-out');
        }
      });
      
      el.addEventListener('input', () => { 
        controller.stopTypewriter();
        if (controller.blurTimeoutId) {
          clearTimeout(controller.blurTimeoutId);
          controller.blurTimeoutId = null;
        }
        el.classList.remove('is-typing');
      });
      
      el.addEventListener('blur', () => {
        // Use setTimeout to check actual focus state after browser handles autocomplete
        setTimeout(() => {
          const activeEl = document.activeElement;
          const focusStillInForm = form.contains(activeEl);
          
          // If focus moved to another field in this form, do nothing
          if (focusStillInForm) return;
          
          // If form is fully filled, do not clear or restart
          if (controller.isFormFullyFilled()) return;
          
          // Clear any pending blur timeout
          if (controller.blurTimeoutId) {
            clearTimeout(controller.blurTimeoutId);
            controller.blurTimeoutId = null;
          }
          
          // Clear all field values (but not background colors)
          clearFormValuesOnly(form);
          
          // After exactly 1000ms, restore placeholders and restart typewriter
          controller.blurTimeoutId = setTimeout(() => {
            controller.blurTimeoutId = null;
            resetFormToInitialPlaceholders(form, pagePlaceholders);
            
            // Restart typewriter cycle after initial delay
            controller.stop = false;
            controller.typingState.paused = false;
            controller.typingState.fieldIndex = 0;
            if (!controller.cycleRunning) {
              runCycle();
            }
          }, 1000);
        }, 100); // Allow autocomplete to settle
      });
    });

    // Устанавливаем изначальные placeholder'ы
    resetForm();

    // Рассинхронизация старта автопечати между формами
    const getInitialDelay = () => {
      if (form.classList.contains('hero-form--modal')) {
        return 400; // Модальная форма
      }
      if (form.classList.contains('challenges-cta__form')) {
        return 900; // Форма в блоке 5
      }
      // Hero форма (первая форма на странице)
      return 0;
    };

    const initialDelay = getInitialDelay();
    
    // Запускаем цикл с задержкой
    if (initialDelay > 0) {
      setTimeout(() => {
        if (!controller.cycleRunning) runCycle();
      }, initialDelay);
    } else {
      runCycle();
    }

    const submitBtn = form.querySelector('button[type="submit"], .btn-primary, .challenges-cta__btn, .faq-ask-btn');
    if (submitBtn) {
      submitBtn.classList.add('keis-cta-pulse');

      // FIX 3: Helper: trigger ripple animation через span.ripple
      const triggerRipple = (e) => {
        const btnRect = submitBtn.getBoundingClientRect();
        // Получаем координаты клика относительно кнопки
        let clickX, clickY;
        if (e && e.clientX && e.clientY) {
          clickX = e.clientX - btnRect.left;
          clickY = e.clientY - btnRect.top;
        } else {
          // Default: center-right (92% width, 50% height)
          clickX = btnRect.width * 0.92;
          clickY = btnRect.height * 0.5;
        }
        
        // Удаляем существующий ripple если есть
        const existingRipple = submitBtn.querySelector('.ripple');
        if (existingRipple) {
          existingRipple.remove();
        }
        
        // Создаем новый ripple элемент
        const ripple = document.createElement('span');
        ripple.classList.add('ripple');
        ripple.style.left = `${clickX}px`;
        ripple.style.top = `${clickY}px`;
        submitBtn.appendChild(ripple);
        
        // Удаляем ripple после анимации
        setTimeout(() => {
          ripple.remove();
        }, 500);
      };

      // FIX 3: Ripple на pointerdown для ВСЕХ форм (особенно важно для popup)
      submitBtn.addEventListener('pointerdown', (e) => {
        submitBtn.classList.add('is-pressed');
        triggerRipple(e);
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