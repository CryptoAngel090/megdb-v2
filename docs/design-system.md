# Design system — MegDB (этап 2)

## Две дорожки (намеренно)

### 1. Продакшен-сайт (`apps/web`)

- **Источник правды по стилям:** `apps/web/src/styles/globals.css`
- Токены вида `--primary`, `--bg`, `--layout-header-*`, utility-классы (`.btn-primary`, …), компонентные **CSS Modules** рядом с React.
- Это то, что видят пользователи на megdb.com.

### 2. Пакет `@repo/ui` + админка

- **Источник токенов пакета:** `packages/ui/src/tokens/tokens.css` + базовый reset в `packages/ui/src/tokens/globals.css`
- Подключается в **`apps/admin`** (`layout.tsx`) и используется компонентами `Button`, `Badge`, `Input`, `Skeleton`.
- Токены заданы в основном через **oklch** и могут **численно отличаться** от продовых (радиусы, оттенки) — это не баг, пока не запланирована унификация.

## Где что смотреть

| Нужно                           | Файл / место                       |
| ------------------------------- | ---------------------------------- |
| Цвета/отступы прод-сайта        | `apps/web/src/styles/globals.css`  |
| Компонент прод-страницы         | `*.module.css` рядом с компонентом |
| Примитивы для админки / витрины | `packages/ui/src/components/*`     |
| Витрина примитивов              | маршрут `/ui-kit` в `apps/web`     |

## Правила для разработчиков

1. **Новые экраны `apps/web`** — по возможности **не** подключать `@repo/ui`, если не согласован перенос; опираться на существующие паттерны и токены из `globals.css`.
2. **`apps/admin`** — использовать `@repo/ui` и токены пакета.
3. **`/ui-kit`** — демонстрация `@repo/ui` на том же домене, что и прод; из-за общего `layout` часть CSS-переменных может пересекаться с `globals.css`. Для точного сравнения смотреть этот документ и исходники.
4. **Слияние токенов** в один файл — отдельный проект: нужна матрица соответствия, визуальная регрессия и миграция, не «быстрый импорт».

## Что не делать без отдельного плана

- Подменять `globals.css` прод-сайта полным импортом `@repo/ui/tokens` — высокий риск сдвига визуала и регрессий.
- Удалять `@repo/ui`, пока живы `apps/admin` и/или `/ui-kit`.

---

## UX size primitives — Level 1 (inventory + tokens)

**Внешний контекст (2025–2026):** дизайн‑токены как единый контракт для AI/кода ([обзор токенов 2026](https://www.oneminutebranding.com/blog/design-tokens-2026)); spacing через **rem/CSS variables** и ограниченную шкалу; для целей указателя — **WCAG 2.2** [2.5.8 Target Size (Minimum) 24×24 CSS px (AA)](https://www.w3.org/TR/WCAG22/#target-size-minimum), для комфорта на тач — ориентир **44px** (`--touch-target`).

### Новые токены в `apps/web/src/styles/globals.css`

| Токен | Назначение |
| ----- | ---------- |
| `--rail-tile-gap` / `--rail-tile-columns` / `--rail-tile-poster-aspect` | **Семантические алиасы** на `--media-card-rail-gap`, `--media-card-rail-columns`, `--media-card-poster-aspect` — одна геометрия для медиа и персон в рейлах; новый код предпочитает `--rail-tile-*` |
| `--icon-size-sm` / `--icon-size-md` / `--icon-size-lg` | Слоты иконок (16 / 20 / 24px в `rem`) |
| `--hit-area-round-md` | Круглые контролы 40px (= бывший `calc(space-5 + space-2)`), >24px AA |
| `--control-height-sm` | 44px — минимальная высота «прямоугольных» строк/кнопок (dropdown item и т.д.) |
| `--control-height-md` | 48px |
| `--control-height-lg` | 56px |
| `--text-label` | Заменён с фиксированных `10px` на **fluid `clamp()` в `rem`** (масштаб с настройками пользователя) |

### Где заменены дублирующиеся значения на токены (аудит Level 1)

| Область | Файл | Примечание |
| ------- | ---- | ---------- |
| Шелф актёров, стрелки | `PopularActorsShelf.module.css` | `width`/`height` → `--hit-area-round-md`; геометрия ряда → `--rail-tile-gap` / `--rail-tile-columns` |
| Шелф медиа, стрелки | `MediaShelf.module.css` | `40px` / `44px` → `--hit-area-round-md` / `--control-height-sm`; ряд → `--rail-tile-*` |
| Карточки «More like this» / коллекции | `MovieDetailPage.module.css` (импорт через `MovieDetailPage.styles.ts`) | трек → `--rail-tile-gap` / `--rail-tile-columns` |
| Хиро, пауза / модалка | `HeroSection.module.css` | круглые кнопки → `--hit-area-round-md` |
| Хедер, drawer / dropdown | `Header.module.css` | пункт меню `min-height` → `--control-height-sm`; крестик → `--hit-area-round-md` |
| Поиск, постер результата | `SearchBar.module.css` | ширина мини‑постера → `--hit-area-round-md` |

### Level 2 (в процессе)

- **Прод (`apps/web`):** формы **Login** и **Register** переведены на общий **`Button` из `@repo/ui/button`** (`variant="primary"`, `size="lg"`, `fullWidth`, `loading`), дублирующие `.submitButton` / спиннер удалены из модулей — один визуальный и поведенческий контракт с `/ui-kit`.
- **Дальше:** `ProfilePage` и прочие кастомные `<button>`, затем зачистка «сырых» `px` в `MediaCard`, при желании — ESLint на магические размеры.
