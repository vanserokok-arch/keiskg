document.addEventListener('DOMContentLoaded', () => {
  initYandexMetrika();
  initHeader();
  initScenariosSlider();
  initFaqAccordion();
  initFaqParallax();
  initTrustParallax();
  initFindParallax();
  initTelegramLeads();
  initFormsUX();
  initCounterAnimation();
  initBridgeCounters();
  initSuccessModal();

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

  // Consumer protection: override by subfolder (do not depend on body classes)
  const consumerProtectionPlaceholders = {
    name: 'Как к вам обращаться?',
    phone: 'Ваш телефон',
    message: 'Коротко опишите, что случилось'
  };

  const consumerProtectionPlaceholdersByFolder = {
    'forced-insurance': consumerProtectionPlaceholders,
    'consumer-goods-refund': consumerProtectionPlaceholders,
    'furniture-defects': consumerProtectionPlaceholders,
    'construction-contract': consumerProtectionPlaceholders,
    'poor-quality-services': consumerProtectionPlaceholders,
    'contractor-agreement': consumerProtectionPlaceholders,
    'medical-malpractice': consumerProtectionPlaceholders,
    'defective-apartment-renovation': consumerProtectionPlaceholders,
    'complaint-against-lawyer': consumerProtectionPlaceholders
  };

  const consumerProtectionSamplesByFolder = {
    'forced-insurance': {
      name: 'Иванов Алексей',
      phone: '+7 (981) 654-32-10',
      message: 'Навязали страховку, хочу вернуть деньги по договору.'
    },
    'consumer-goods-refund': {
      name: 'Петрова Мария',
      phone: '+7 (981) 654-32-10',
      message: 'Купил товар с браком, продавец не принимает обратно.'
    },
    'furniture-defects': {
      name: 'Сидоров Алексей',
      phone: '+7 (981) 654-32-10',
      message: 'Мебель пришла с дефектами, обещают, но не исправляют.'
    },
    'construction-contract': {
      name: 'Иванова Ольга',
      phone: '+7 (981) 654-32-10',
      message: 'Подрядчик сорвал сроки и сделал с нарушениями.'
    },
    'poor-quality-services': {
      name: 'Петров Алексей',
      phone: '+7 (981) 654-32-10',
      message: 'Услугу оказали плохо, деньги возвращать не хотят.'
    },
    'contractor-agreement': {
      name: 'Смирнова Анна',
      phone: '+7 (981) 654-32-10',
      message: 'Взяли аванс и пропали/тянут, работу не заканчивают.'
    },
    'medical-malpractice': {
      name: 'Кузнецов Дмитрий',
      phone: '+7 (981) 654-32-10',
      message: 'После лечения стало хуже, нужна проверка документов и действий.'
    },
    'defective-apartment-renovation': {
      name: 'Соколова Ирина',
      phone: '+7 (981) 654-32-10',
      message: 'Ремонт сделали криво, переделывать отказываются.'
    },
    'complaint-against-lawyer': {
      name: 'Морозов Павел',
      phone: '+7 (981) 654-32-10',
      message: 'Заплатил за услуги, результата нет, хочу жалобу и возврат.'
    }
  };

  const getConsumerProtectionFolder = (path) => {
    const m = String(path || '').match(/\/consumer-protection\/([^/]+)(\/|$)/);
    return m ? m[1] : null;
  };
  
  const getPagePlaceholders = () => {
    // consumer-protection/** must not inherit fraud placeholders via body class
    const path = window.location.pathname;
    if (path.includes('/consumer-protection/')) {
      const folder = getConsumerProtectionFolder(path);
      if (folder && consumerProtectionPlaceholdersByFolder[folder]) return consumerProtectionPlaceholdersByFolder[folder];
      return consumerProtectionPlaceholders;
    }
    const body = document.body;
    for (const cls of ['page-investment','page-influence','page-credit','page-main']) {
      if (body.classList.contains(cls)) return placeholdersByPage[cls];
    }
    // fallback by pathname
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
    // consumer-protection/** must not inherit fraud samples via body class
    const path = window.location.pathname;
    if (path.includes('/consumer-protection/')) {
      const folder = getConsumerProtectionFolder(path);
      if (folder && consumerProtectionSamplesByFolder[folder]) return consumerProtectionSamplesByFolder[folder];
      // safe fallback: pick any defined sample if folder is missing
      return consumerProtectionSamplesByFolder['forced-insurance'];
    }
    const body = document.body;
    for (const cls of ['page-investment','page-influence','page-credit','page-main']) {
      if (body.classList.contains(cls)) return samplesByPage[cls];
    }
    // fallback by pathname
    if (path.includes('/investment')) return samplesByPage['page-investment'];
    if (path.includes('/influence')) return samplesByPage['page-influence'];
    if (path.includes('/credit')) return samplesByPage['page-credit'];
    return samplesByPage['page-main'];
  };

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  // FIX 2: Печатание текста в placeholder (не в value - value принадлежит только пользователю)
  // TASK 2: Keep is-typing class during typing, don't remove it here (cycle will manage it)
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
    // TASK 2: Do NOT remove is-typing here - keep it until cycle completes
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
      runCycle: null, // TASK 2: Will be set to the runCycle function
      
      stopTypewriter() {
        this.stop = true;
        this.typingState.paused = true;
        this.typingState.isTyping = false;
        // TASK 2: Remove form-level typing class when stopped
        this.form.classList.remove('form-typing-active');
      },
      
      clearPlaceholderArtifacts() {
        // FIX 2: Очищаем placeholder artifacts (typewriter работает через placeholder)
        // TASK 2: Use base placeholders (same as initialPlaceholders, but explicit)
        const ph = this.initialPlaceholders; // These are already set from pagePlaceholders at init
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
        // TASK 2: Remove form-level typing class
        this.form.classList.remove('form-typing-active');
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
      // TASK 2: Add form-level class to keep typing color persistent
      form.classList.add('form-typing-active');
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

        // TASK 2: Button press animation with ripple on RIGHT side (already at 92%)
        const submitBtn = form.querySelector('button[type="submit"], .btn-primary, .challenges-cta__btn, .faq-ask-btn');
        if (submitBtn) {
          // Set ripple position for circle animation (RIGHT side: 92% width, 50% height)
          const btnRect = submitBtn.getBoundingClientRect();
          const clickX = btnRect.width * 0.92; // RIGHT side
          const clickY = btnRect.height * 0.5;
          submitBtn.style.setProperty('--ripple-x', `${clickX}px`);
          submitBtn.style.setProperty('--ripple-y', `${clickY}px`);
          submitBtn.classList.add('typing-complete');
          await sleep(500); // Wait for button press animation
          submitBtn.classList.remove('typing-complete');
        }
        if (controller.stop) break;

        // TASK 2: After button press completes, remove typing classes and reset to base placeholders
        await sleep(300);
        if (controller.stop) break;

        // Remove typing classes from all fields (typing color was persistent until now)
        if (nameEl) {
          nameEl.classList.remove('is-typing');
        }
        if (phoneEl) {
          phoneEl.classList.remove('is-typing');
        }
        if (msgEl) {
          msgEl.classList.remove('is-typing');
        }
        // Remove form-level typing class
        form.classList.remove('form-typing-active');

        // TASK 2: Reset to base placeholders after cycle completes
        if (nameEl) {
          nameEl.setAttribute('placeholder', pagePlaceholders.name);
        }
        if (phoneEl) {
          phoneEl.setAttribute('placeholder', pagePlaceholders.phone);
        }
        if (msgEl) {
          msgEl.setAttribute('placeholder', pagePlaceholders.message);
        }
        await sleep(300);

        // Очищаем все поля и возвращаем placeholder'ы
        resetForm();
        await sleep(2500); // Пауза перед следующим циклом
      }
      controller.cycleRunning = false;
      controller.typingState.isTyping = false;
      // TASK 2: Ensure form-level class is removed when cycle stops
      form.classList.remove('form-typing-active');
    };

    // TASK 2: Store runCycle reference in controller for popup restart
    controller.runCycle = runCycle;

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

      // On pointerdown we only add the pressed visual state; ripple DOM element removed.
      submitBtn.addEventListener('pointerdown', (e) => {
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
  if (window.__headerInitialized) return;
  window.__headerInitialized = true;

  // Make header truly sticky (fixed) and reserve space so it never "slides away"
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
      if (controller) {
        // Reset stop flag to allow cycle to run
        controller.stop = false;
        controller.typingState.paused = false;
        // If cycle is not running, restart it
        if (!controller.cycleRunning && controller.runCycle) {
          // Small delay to let modal animation complete
          setTimeout(() => {
            if (!controller.cycleRunning) {
              controller.runCycle();
            }
          }, 100);
        }
      }
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

  // Mobile swipe support (<899px)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  let isTouching = false;
  let resumeTimeout = null;

  const handleTouchStart = (e) => {
    if (window.innerWidth > 899) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    isTouching = true;
    pauseAutoplay();
    if (resumeTimeout) {
      clearTimeout(resumeTimeout);
      resumeTimeout = null;
    }
  };

  const handleTouchMove = (e) => {
    if (!isTouching || window.innerWidth > 899) return;
    touchEndX = e.touches[0].clientX;
    touchEndY = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!isTouching || window.innerWidth > 899) return;
    isTouching = false;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Swipe threshold: 40px horizontal, and horizontal movement should be greater than vertical
    if (absDeltaX > 40 && absDeltaX > absDeltaY) {
      if (deltaX > 0) {
        // Swipe right - go to previous
        stopAutoplay();
        if (!isAnimating) {
          currentIndex -= 1;
          setTranslate(currentIndex);
          slidesAll.forEach((slideEl, idxAll) => {
            const realIdx = mod(idxAll - cloneCount, totalSlides);
            applyBgByRealIndex(slideEl, realIdx);
          });
        }
      } else {
        // Swipe left - go to next
        stopAutoplay();
        if (!isAnimating) {
          currentIndex += 1;
          setTranslate(currentIndex);
        }
      }
      isPaused = false;
      startAutoplay();
    }
    
    // Resume autoplay after delay (800-1200ms)
    resumeTimeout = setTimeout(() => {
      resumeAutoplay();
      startAutoplay();
      resumeTimeout = null;
    }, 1000);
  };

  // Add touch event listeners only on mobile
  if (window.innerWidth <= 899) {
    windowEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    windowEl.addEventListener('touchmove', handleTouchMove, { passive: true });
    windowEl.addEventListener('touchend', handleTouchEnd, { passive: true });
    windowEl.addEventListener('touchcancel', handleTouchEnd, { passive: true });
  }

  // Re-check on resize
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 899) {
      if (!windowEl.hasAttribute('data-touch-bound')) {
        windowEl.setAttribute('data-touch-bound', '1');
        windowEl.addEventListener('touchstart', handleTouchStart, { passive: true });
        windowEl.addEventListener('touchmove', handleTouchMove, { passive: true });
        windowEl.addEventListener('touchend', handleTouchEnd, { passive: true });
        windowEl.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      }
    }
  });

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
  if (window.__trustParallaxInitialized) return;
  window.__trustParallaxInitialized = true;

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
    // Ограничиваем движение фона: не позволяем подниматься выше верхней границы секции (минимум 0)
    const clampedY = Math.max(0, y);
    section.style.setProperty('--trust-parallax-y', `${clampedY}px`);

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

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    return;
  }

  // Find all parallax elements with data-parallax attribute
  const parallaxElements = section.querySelectorAll('[data-parallax]');
  if (!parallaxElements.length) {
    if (isDev()) console.warn('[initFindParallax] No [data-parallax] elements found');
    return;
  }

  let raf = 0;
  const update = () => {
    raf = 0;
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset;
    
    parallaxElements.forEach((el) => {
      const speed = parseFloat(el.dataset.parallaxSpeed || '0.18');
      const elRect = el.getBoundingClientRect();
      
      // Calculate parallax offset based on element position in viewport
      const elementCenter = elRect.top + elRect.height / 2;
      const viewportCenter = vh / 2;
      const distance = elementCenter - viewportCenter;
      const offset = Math.max(-35, Math.min(35, distance * speed));
      
      // Use transform for better performance (especially on iOS)
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

  // Endpoint relative to current page. Works from both root and subdirectories.
  // Determine base path: if we're in a subdirectory (investment/, influence/, credit/), go up one level
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const isSubdirectory = pathParts.length > 1 && ['investment', 'influence', 'credit'].includes(pathParts[pathParts.length - 2]);
  const ENDPOINT = isSubdirectory ? '../api/telegram.php' : './api/telegram.php';

  const forms = new Set();

  // 1) Contact modal form
  const contactModal = document.getElementById('contactModal');
  const contactForm = contactModal?.querySelector('form');
  if (contactForm) forms.add(contactForm);

  // 2) Hero / page forms (best-effort selectors)
  document
    .querySelectorAll('form.hero-form, form.keis-form, form[data-tg-lead], .hero-form form, form.challenges-cta__form')
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
        // Clear all form fields after successful submission
        const allFields = form.querySelectorAll('input:not([type="hidden"]), textarea');
        allFields.forEach((field) => {
          if (field && 'value' in field) field.value = '';
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

        // Show success modal
        setTimeout(() => {
          openSuccessModal();
        }, 700);
      } catch (err) {
        if (isDev()) console.error('[initTelegramLeads] exception', err);
        setBtnState(submitBtn, 'idle');
      }
    });
  });
}

/* ==========================================================
   SUCCESS MODAL: Подтверждение отправки формы
   ========================================================== */
// ЗАДАЧА 2: Сохраняем scrollY для success modal
let savedSuccessScrollY = 0;

function openSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;
  
  // Сохраняем текущую позицию скролла
  savedSuccessScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
  
  successModal.classList.add('is-open');
  successModal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  
  // Блокируем скролл фона (iOS-safe)
  document.body.style.position = 'fixed';
  document.body.style.top = `-${savedSuccessScrollY}px`;
  document.body.style.width = '100%';
}

function closeSuccessModal() {
  const successModal = document.getElementById('successModal');
  if (!successModal) return;
  
  successModal.classList.remove('is-open');
  successModal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  
  // ЗАДАЧА 2: Восстанавливаем scrollY без анимации
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, savedSuccessScrollY);
  savedSuccessScrollY = 0;
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

