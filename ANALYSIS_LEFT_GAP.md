# Анализ параметров, влияющих на зазор между левой границей страницы и заголовком

## Структура HTML
```html
<section class="hero-investment">
  <div class="section-container hero-investment__inner">
    <div class="hero-investment__grid">
      <div class="hero-investment__content">
        <h1 class="hero-investment__title">...</h1>
      </div>
    </div>
  </div>
</section>
```

## Параметры, влияющие на зазор слева

### 1. Базовый стиль `.section-container` (строка 2476)
```css
.section-container {
  width: min(1280px, calc(100% - 48px));
  margin: 0 auto;  /* центрирует контейнер */
}
```
**Влияние:** На экранах < 1100px создает отступ 24px с каждой стороны (48px / 2), так как контейнер центрируется автоматическими отступами.

---

### 2. Переопределение для `.hero-investment .section-container` (строки 3075-3081)

#### На экранах ≥ 1100px:
```css
@media (min-width: 1100px) {
  .hero-investment .section-container {
    width: min(1400px, calc(100% - 64px));
    margin-left: 32px;      /* ⭐ ОСНОВНОЙ ПАРАМЕТР: отступ слева 32px */
    margin-right: auto;
    padding-left: 0;        /* убирает внутренний отступ */
  }
}
```

**Влияние:** 
- `margin-left: 32px` - **ГЛАВНЫЙ ПАРАМЕТР**, который задает зазор 32px между левой границей viewport и контейнером
- `width: calc(100% - 64px)` - ширина контейнера уменьшена на 64px (32px слева + 32px справа для баланса)
- `padding-left: 0` - убирает внутренний отступ

#### На экранах 900px - 1099px (строки 3084-3087):
```css
@media (min-width: 900px) and (max-width: 1099px) {
  .hero-investment .section-container {
    padding-left: 0;  /* убирает внутренний отступ */
  }
}
```

**Влияние:** Только убирает внутренний отступ, но не задает margin-left, поэтому действует базовое центрирование.

---

### 3. Стили для `.hero-investment__content` (строки 3107-3113)
```css
.hero-investment__content {
  grid-area: content;
  justify-self: start;    /* выравнивание по левому краю grid-ячейки */
  max-width: 100%;
  text-align: left;
}
```

**На экранах ≥ 900px (строки 3150-3153):**
```css
@media (min-width: 900px) {
  .hero-investment__content {
    padding-left: 0;      /* убирает внутренний отступ */
    padding-right: 0;
  }
}
```

**Влияние:** 
- `justify-self: start` - контент прижат к левому краю grid-ячейки (не создает дополнительный зазор)
- `padding-left: 0` - убирает внутренний отступ контента

---

### 4. Стили для `.hero-investment__title` (строки 3322-3336)
```css
.hero-investment__title {
  /* ... другие стили ... */
  text-align: left;
  max-width: 100%;
  margin-left: 0;         /* убирает внешний отступ */
  margin-right: auto;
}
```

**Влияние:** 
- `margin-left: 0` - заголовок прижат к левому краю родителя
- `text-align: left` - текст выровнен по левому краю

---

### 5. Стили для `.hero-investment__inner` (строка 3065)
```css
.hero-investment__inner {
  position: relative;
  z-index: 1;
}
```

**Влияние:** Не задает padding или margin, поэтому не влияет на горизонтальные отступы.

---

## ИТОГОВАЯ ФОРМУЛА ЗАЗОРА

### На экранах ≥ 1100px:
```
Зазор слева = margin-left (.hero-investment .section-container) = 32px
```

### На экранах 900px - 1099px:
```
Зазор слева = автоматический отступ от центрирования ≈ (viewport_width - container_width) / 2
где container_width = min(1280px, calc(100% - 48px))
```

### На экранах < 900px:
```
Зазор слева = автоматический отступ от центрирования ≈ (viewport_width - container_width) / 2
где container_width = min(1280px, calc(100% - 48px)) для > 520px
или = min(1280px, calc(100% - 28px)) для ≤ 520px
```

---

## КАК ИЗМЕНИТЬ ЗАЗОР

### Чтобы уменьшить зазор на экранах ≥ 1100px:
Измените `margin-left` в строке 3078:
```css
@media (min-width: 1100px) {
  .hero-investment .section-container {
    margin-left: 16px;  /* было 32px, стало 16px */
    /* ... */
  }
}
```

### Чтобы убрать зазор полностью (прижать к краю):
```css
@media (min-width: 1100px) {
  .hero-investment .section-container {
    margin-left: 0;
    width: min(1400px, 100%);  /* убрать -64px из calc */
    /* ... */
  }
}
```

### Чтобы увеличить зазор:
```css
@media (min-width: 1100px) {
  .hero-investment .section-container {
    margin-left: 48px;  /* было 32px, стало 48px */
    width: min(1400px, calc(100% - 96px));  /* увеличить пропорционально */
    /* ... */
  }
}
```

---

## ФАЙЛЫ И СТРОКИ

- **Основной файл:** `fraud/styles.css`
- **Строка 2476:** базовый `.section-container`
- **Строки 3075-3081:** переопределение для hero на ≥ 1100px
- **Строки 3084-3087:** переопределение для hero на 900-1099px
- **Строки 3107-3113:** `.hero-investment__content`
- **Строки 3150-3153:** `.hero-investment__content` на ≥ 900px
- **Строки 3322-3336:** `.hero-investment__title`

