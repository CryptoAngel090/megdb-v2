# Google SEO (апрель 2026) + каталог MegDB — единый справочник

**Последнее обновление:** 2026-04-22 — добавлен блок **«Новейшие обновления документации»** (срез официальной ленты [What’s new](https://support.google.com/webmasters/answer/6211428)); ранее — **Часть A–C** (свод правил Google + MegDB).

**Назначение файла:** один документ, в котором собрано **что от сайта ожидает Google** (техника, качество, разметка, скорость, выдача) и **как это ложится на MegDB**. Это **не** гарантия позиций: Google прямо пишет, что соответствие правилам даёт **право на индексацию**, а не обещание показа.

**Источники:** [Google Search Central](https://developers.google.com/search/docs), [Search Essentials](https://developers.google.com/search/docs/essentials), [Search Console Help](https://support.google.com/webmasters/), [web.dev / Vitals](https://web.dev/articles/vitals). Обновления документации Google — трекать в [What’s new (Search Central)](https://support.google.com/webmasters/answer/6211428). Неофициальные SEO-блоги в этот свод **не входят**.

**RSS официальных обновлений:** [Search Central docs](https://developers.google.com/search/updates/search_docs_updates.rss) · [Crawling infrastructure changelog](https://developers.google.com/crawling/docs/changelog/crawling_docs_updates.rss).

---

## Новейшие обновления документации Google (не «слухи», а лента Search Central)

Ниже — **что Google недавно добавил или переформулировал в своих гайдах** (важно для SEO-практики). Источник одной страницы: **[Latest documentation updates](https://support.google.com/webmasters/answer/6211428)**.  
_Примечание:_ на дату сбора **самые свежие пункты в ленте — март 2026**; всё, что вышло **после**, нужно смотреть по ссылке или RSS выше — мы **не** придумываем новые правила за Google.

| Период            | Что изменилось (суть)                                                                                                                                                                                                                                                                                                                                                                               | Зачем это вам (каталог фильмов)                                                                                                                                                 |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Март 2026**     | Новые **поддерживаемые свойства** для разметки [Discussion Forum](https://support.google.com/search/docs/appearance/structured-data/discussion-forum) и [Q&A Page](https://support.google.com/search/docs/appearance/structured-data/qapage) — яснее структура тредов                                                                                                                               | Если появятся форумы/обсуждения к тайтлам — сверять типы с актуальной спецификацией                                                                                             |
| **Март 2026**     | В доке [robots meta tag](https://support.google.com/search/docs/crawling-indexing/robots-meta-tag) добавлено пояснение: как обрабатываются директивы **вне `<head>`** (поведение не менялось, раньше не было описано)                                                                                                                                                                               | Контролировать, где именно вы отдаёте `noindex` / robots в Next.js                                                                                                              |
| **Март 2026**     | Из [JavaScript SEO basics](https://support.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) **убрали устаревший блок про accessibility**; Google подчёркивает: **рендер JS для поиска — норма годами**, это не «усложняет Google»                                                                                                                                         | Меньше мифов «SSR обязателен ради Google»; важнее корректный контент после рендера и статусы HTTP                                                                               |
| **Март 2026**     | Новый блок **preferred image**: Google использует и **schema.org**, и **`og:image`** при выборе превью в **поиске и Discover** — [Image SEO](https://support.google.com/search/docs/appearance/google-images#specify-preferred-image), [Discover](https://support.google.com/search/docs/appearance/google-discover#images)                                                                         | Для карточек фильмов: согласованность **OG image**, JSON-LD `image`, размеры/качество превью                                                                                    |
| **Февраль 2026**  | Расширена страница [Google Discover](https://support.google.com/search/docs/appearance/google-discover) + анонс **[February 2026 Discover Core Update](https://support.google.com/search/blog/2026/02/discover-core-update)**                                                                                                                                                                       | Если целитесь в трафик Discover — следить за гайдом и качеством контента/обложек                                                                                                |
| **Февраль 2026**  | Лимиты размера ответа для краулеров **уточнены и перенесены** в [документацию crawlers](https://support.google.com/crawling/docs/crawlers-fetchers/overview-google-crawlers#file-size-limits); обновлён [Googlebot](https://support.google.com/search/docs/crawling-indexing/googlebot)                                                                                                             | Очень большие HTML/страницы — проверять, не упираетесь ли в лимиты                                                                                                              |
| **Январь 2026**   | Документ **[Preferred sources](https://support.google.com/search/docs/appearance/preferred-sources)** — как издателям помогать пользователям находить сайт как предпочтительный источник                                                                                                                                                                                                            | Бренд, узнаваемость, качество — не технический патч, а стратегия                                                                                                                |
| **Январь 2026**   | Удалена документация типа **[Practice problem](https://support.google.com/search/docs/appearance/structured-data/practice-problems)** из выдачи (упрощение результатов)                                                                                                                                                                                                                             | Для MegDB не критично; не опираться на устаревшие гайды                                                                                                                         |
| **Декабрь 2025**  | Уточнение: при **не-200** статусах страница **может не уйти в рендеринг** JS — см. [JavaScript SEO basics](https://support.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics#how-googlebot-processes-javascript)                                                                                                                                                            | Ошибки TMDB/API должны отдавать осмысленный статус; не полагаться на JS-«маскировку» 404/500                                                                                    |
| **Декабрь 2025**  | Раздел **canonical + JavaScript**: каноникал до/после рендера — лучше **совпадал с HTML** или **не дублировать** в исходном HTML при противоречии — [JS doc](https://support.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics#canonicalization), [duplicate URLs](https://support.google.com/search/docs/crawling-indexing/consolidation-of-duplicate-urls#best-practices) | Для SPA/гидрации: не менять canonical скриптом на другой URL без необходимости                                                                                                  |
| **Декабрь 2025**  | Уточнение **noindex + JavaScript**: поведение может быть неочевидным; если страница **может** быть нужна в индексе — **не** ставить `noindex` только в JS                                                                                                                                                                                                                                           | В Next: предпочтительно `metadata.robots` / заголовки на сервере                                                                                                                |
| **Ноябрь 2025 →** | Часть доков по обходу перенесена на **[Crawling infrastructure](https://support.google.com/crawling)** (фасеты, crawl budget, HTTP-коды, robots.txt spec) — **поведение то же**, URL новые                                                                                                                                                                                                          | Для больших каталогов: [faceted navigation](https://support.google.com/crawling/docs/faceted-navigation), [crawl budget](https://support.google.com/crawling/docs/crawl-budget) |

**Итог:** «Самые новые правила» от Google — это **не один PDF**, а **поток правок документации + спам/качество**. Их единственный надёжный источник — страница **What’s new** и RSS выше; раздел **Часть A** ниже — стабильная база, этот блок — **дельта**.

---

## Часть A. Что требует и рекомендует Google (официально)

Ниже — конденсат публичных правил. Детали всегда сверяйте по ссылкам: формулировки Google со временем уточняются.

### A1. Search Essentials — три минимальных технических условия

Страница **может быть кандидатом в индекс**, если выполнено **всё три** пункта ([Technical requirements](https://developers.google.com/search/docs/essentials/technical)):

| #   | Условие                        | Смысл                                                                                                                                                                                                                               | Проверка                                                                                                                                                                                                                   |
| --- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Googlebot не заблокирован**  | Страница доступна публично; нет блокировки краулера (в т.ч. неправильный `robots.txt`, логин-стена для всего важного контента)                                                                                                      | [URL Inspection](https://support.google.com/webmasters/answer/9012289), отчёты [Page indexing](https://support.google.com/webmasters/answer/7440203) / [Crawl stats](https://support.google.com/webmasters/answer/9679690) |
| 2   | **Страница «работает»**        | В ответ — **HTTP 200** (успех). Страницы ошибок клиента/сервера **не индексируются** как нормальный контент                                                                                                                         | Статус в инспекторе URL, логи сервера                                                                                                                                                                                      |
| 3   | **Есть индексируемый контент** | Текст в [поддерживаемом типе файлов](https://developers.google.com/search/docs/crawling-indexing/indexable-file-types); контент **не нарушает** [спам-политики](https://developers.google.com/search/docs/essentials/spam-policies) | Контент в HTML, политики                                                                                                                                                                                                   |

Важно: «выполнены три условия» **≠** «страница будет в индексе» — индексация **не гарантируется** (там же, у Google).

Общий вход: [Search Essentials](https://developers.google.com/search/docs/essentials) (ранее _Webmaster Guidelines_).

### A2. Как Google находит и обрабатывает страницы

| Этап                | Что делает Google                                                                                                                                                       | Что делать сайту                                                                                                                                                                                                              |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Обход (crawl)**   | [Googlebot](https://developers.google.com/search/docs/crawling-indexing/googlebot) скачивает страницы; рендер в том числе с **современным Chrome** (важно для JS/React) | Стабильные ссылки, [краулable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), при необходимости [sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview) |
| **Индексирование**  | Анализ текста/медиа, сохранение в индексе                                                                                                                               | Понятная структура, уникальная ценность страницы                                                                                                                                                                              |
| **Показ (serving)** | Ранжирование и показ сниппетов                                                                                                                                          | Title, description, разметка — см. A5–A6                                                                                                                                                                                      |

Обзор процесса: [How Google Search works](https://developers.google.com/search/docs/fundamentals/how-google-search-works) (документация для вебмастеров).

**JavaScript и SEO:** контент, который появляется только после выполнения JS, должен быть доступен краулеру; см. [Understanding JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) и [Fix search-related JavaScript problems](https://support.google.com/webmasters/answer/7489878).

### A3. Дубли, каноникал, фасеты

- Дубли **не равны** автоматически спаму, но тратят обход и путают пользователя — Google рекомендует [каноникализацию](https://developers.google.com/search/docs/crawling-indexing/canonicalization): **редирект** сильнее, чем **`rel=canonical`**, sitemap — **слабый** сигнал ([Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)).
- **Не** использовать `robots.txt` как замену каноникалу для «склейки» дублей внутри сайта.
- Для сайтов с **фасетной навигацией** (фильтры, сортировки): см. блог Search Central [Crawling / faceted navigation (Dec 2024)](https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav) — контроль комбинаций URL, `noindex` / canonical по продуктовой стратегии.

### A4. Качество контента и спам

| Документ                                                                                                                            | Зачем каталогу фильмов                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| [Spam policies for Google Search](https://developers.google.com/search/docs/essentials/spam-policies)                               | Запрет на обман (cloaking), дорвеи, скопированный без добавленной ценности контент, автоген «ради объёма» и т.д.                  |
| [Creating helpful, reliable, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) | Контент для пользователя, а не «для алгоритма»; уместно для обзоров, подборок, уникальных описаний **поверх** сырых фактов из API |

### A5. Внешний вид в выдаче (title и сниппет)

| Элемент                           | Официальная документация                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Заголовок результата (title link) | [Control your title links](https://developers.google.com/search/docs/appearance/title-link)             |
| Сниппет / описание                | [Control your snippets](https://developers.google.com/search/docs/appearance/snippet)                   |
| Общая галерея элементов выдачи    | [Visual elements gallery](https://developers.google.com/search/docs/appearance/visual-elements-gallery) |

Практика: уникальный `<title>`, честное meta-description, согласованность с видимым H1 и контентом.

### A6. Структурированные данные (принципы Google)

| Правило                                                                                                                                                             | Источник                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Разметка описывает **контент, видимый пользователю** на этой странице; не создавать пустые страницы «под JSON-LD»                                                   | [Intro to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) |
| Форматы: JSON-LD (часто **рекомендован**), Microdata, RDFa — на выбор, если корректно                                                                               | Там же                                                                                                                 |
| Соблюдать **общие политики** + политики конкретного типа результата                                                                                                 | [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies) |
| Проверка: [Rich Results Test](https://search.google.com/test/rich-results), мониторинг: [Rich results status](https://support.google.com/webmasters/answer/7552505) | Search Console                                                                                                         |

Каталог типов rich results: [Structured data gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery).

### A7. Core Web Vitals (официальные пороги «good»)

Метрики оцениваются по **полевым данным** (например CrUX), в отчёте GSC — по **75-му перцентилю** URL/группы ([CWV report](https://support.google.com/webmasters/answer/9205520); методология порогов — [web.dev](https://web.dev/articles/defining-core-web-vitals-thresholds)):

| Метрика                             | Good (хорошо) |
| ----------------------------------- | ------------- |
| **LCP** (Largest Contentful Paint)  | **≤ 2.5 s**   |
| **INP** (Interaction to Next Paint) | **≤ 200 ms**  |
| **CLS** (Cumulative Layout Shift)   | **≤ 0.1**     |

Lab (Lighthouse) полезен для отладки, но **не заменяет** полевые данные для отчёта CWV в Search Console.

### A8. Изображения и видео

| Тема                            | Документация                                                                                        |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| Картинки в поиске / оптимизация | [Google Images best practices](https://developers.google.com/search/docs/appearance/google-images)  |
| Видео и разметка                | [Video structured data](https://developers.google.com/search/docs/appearance/structured-data/video) |
| Фильмы                          | [Movie structured data](https://developers.google.com/search/docs/appearance/structured-data/movie) |

### A9. Блокировка индексации (noindex vs robots.txt)

- `robots.txt` **запрещает обход** — URL может **всё равно появиться** в результатах без сниппета.
- Чтобы **не индексировать**, нужна возможность **обойти** URL и директива **`noindex`** (meta или заголовок) — см. [Block indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

### A10. Search Console и API (официальные возможности)

| Инструмент                                                                                 | Назначение                                                                         |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index) | Search Analytics, Sitemaps, Sites, **URL Inspection** — без «секретных» эндпоинтов |

---

## Часть B. Дополнительный фокус: каталоги фильмов / «как IMDB»

Это **интерпретация** официальных тем выше для **больших TMDB/агрегатор-каталогов** (много шаблонных страниц).

| Риск / тема                            | Что ожидает Google по смыслу документов                                             | Практика                                                                    |
| -------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **Thin content**                       | Массовые страницы только с сырыми полями API без ценности для пользователя          | Уникальные блоки: обзор, подборки, FAQ, редакционный контекст, актуализация |
| **Дубли URL**                          | Один фильм — один предпочтительный URL                                              | Редиректы, `rel=canonical`, единая схема slug                               |
| **Фасеты**                             | Комбинации фильтров → взрыв URL                                                     | `noindex` / canonical / чистые хабы — см. A3                                |
| **Атрибуция**                          | Прозрачность источника данных                                                       | Указание TMDB / лицензий API, страницы About / Terms                        |
| **Видео**                              | Реальный плеер / встраивание, корректный `VideoObject` при необходимости rich video | См. A8                                                                      |
| **Персоны и вспомогательные сущности** | Не индексировать пустые заглушки или давать `noindex` до готовности                 | Избежать массовых «пустых» URL в индексе                                    |

---

## Часть C. MegDB — инвентаризация и чеклист по коду

Ниже таблицы со статусом **MegDB** используют легенду:

| Символ | Значение                                  |
| ------ | ----------------------------------------- |
| ✅     | Уже реализовано или близко к рекомендации |
| ⚠️     | Частично / зависит от деплоя / есть риск  |
| ❌     | Пробел или явный риск для масштаба        |
| ℹ️     | Продуктовое решение (осознанно)           |

**Кодовая база:** `apps/web` (Next.js App Router).

### C0. Краткая инвентаризация (SEO-релевантное)

| Область                     | Файлы / факт                                                                                                                                                                                               |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Домен / canonical base      | `src/lib/site.ts` — `SITE_URL` из `NEXT_PUBLIC_SITE_URL`                                                                                                                                                   |
| Фильм                       | `src/app/movie/[id]/page.tsx` — `generateMetadata`, `revalidate = 3600`, редирект на канонический slug, JSON-LD `Movie`, `BreadcrumbList`, `FAQPage`, `VideoObject` при наличии трейлера                   |
| Трейлер                     | `src/app/trailer/[id]/page.tsx` — `VideoObject`, canonical `/trailer/{id}`                                                                                                                                 |
| Листинг фильмов             | `src/app/movies/page.tsx` — `revalidate = 600`, faceted `robots: noindex` при **>1** активном фильтре (`moviesDiscoverActiveFilterKeys`), каноникалы на однофильтровые URL + default `/movies`             |
| TV / мультфильмы            | `tvshows/page.tsx`, `cartoons/page.tsx` — **та же логика**, что у `/movies` (noindex при `keys.length > 1`)                                                                                                |
| Сериалы                     | `series/page.tsx` — **всегда** `alternates.canonical: '/series'` независимо от query; **нет** ветки `robots: noindex` для мульти-фильтра (отличие от movies)                                               |
| Поиск                       | `src/app/search/page.tsx` — `revalidate = 0`, **нет** `robots: noindex` / canonical под `q`                                                                                                                |
| Персона                     | `src/app/person/[id]/page.tsx` — **заглушка** (`BrowseSectionPage`), title вида `Person {id}`                                                                                                              |
| Категории                   | `categories/page.tsx` — статический `metadata`, контент-заглушка                                                                                                                                           |
| Статические страницы        | `about`, `contact`, `help`, `settings`, `accessibility`, `privacy`, `terms`, `cookies`, `gdpr`, `dmca` — `revalidate = 86400`, статический `metadata` (кроме настроек — проверить robots по необходимости) |
| Главная                     | `page.tsx` — `TMDB_REVALIDATE_FAST`, сильный `metadata` + OG                                                                                                                                               |
| Корневой layout             | `src/app/layout.tsx` — title template, **нет** `metadataBase`                                                                                                                                              |
| robots / sitemap            | **Нет** `robots.ts` / `sitemap.ts` (App Router)                                                                                                                                                            |
| CSP / security headers      | **Нет** в `next.config.ts`                                                                                                                                                                                 |
| Discover: пагинация в URL   | ✅ **Нет** эксплозии `?page=` — подгрузка через `MoviesDiscoverPage` → `fetch(apiPath?page=…)` без смены адреса (infinite scroll)                                                                          |
| Внутренние ссылки из Footer | ✅ **Исправлено:** блок Account ведёт только на **`/settings`** (остальные маршруты пока не заведены)                                                                                                      |
| TMDB как источник           | ⚠️ Теглайн футера: «powered by TMDB data»; страница **About** раскрывает использование TMDB                                                                                                                |

---

### C1–C15. Детальный чеклист по разделам

## 01. Crawl budget & indexing (масштаб 100k+)

Официально Google подчёркивает **качество и дубли** для крупных сайтов; отдельной «формулы pages/day» в публичной документации нет. Практика: **sitemap index + лимиты**, **контроль фасетов**, **каноникал**, **стабильные ответы сервера**.

| #   | Requirement                               | MegDB | Next.js 15 / код                                                                                                                                                                                                            | Метрика / порог                        | Риск                              |
| --- | ----------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------- |
| 1.1 | XML sitemap + index при >50k URL          | ❌    | Добавить `src/app/sitemap.ts` + при необходимости генерацию чанков (лимит **50 000 URL** на файл, **50 МБ** несжатый) — [Build sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) | GSC → Sitemaps: «Success» / покрытие   | Недополучение индекса             |
| 1.2 | `robots.txt` (Allow + Sitemap)            | ❌    | `src/app/robots.ts` → `sitemap: `${SITE_URL}/sitemap.xml``                                                                                                                                                                  | Crawl → robots                         | Сложнее обнаружить новые URL      |
| 1.3 | Фасеты: не раздувать комбинации в индекс  | ✅    | `/movies`: `robots: { index: false }` если `keys.length > 1`                                                                                                                                                                | Доля проиндексированных «мусорных» URL | Размытие сигналов                 |
| 1.4 | Каноникал на осмысленный URL фильма       | ✅    | `movie/[id]/page.tsx`: `redirect` если путь ≠ `moviePath(...)`                                                                                                                                                              | Duplicate clusters                     | Дубли в выдаче                    |
| 1.5 | Разрешение slug → id без ошибочного матча | ⚠️    | `resolveMovieIdFromParam` → `searchMovies`, берётся **первый** результат — риск неверной страницы при неоднозначном названии                                                                                                | GSC Soft issues / user signals         | Неверный контент в индексе        |
| 1.6 | Soft 404 / пустые фильтры                 | ℹ️    | Проверить API discover: пустые страницы должны отдавать **200 + явный empty state** или **404** по политике                                                                                                                 | Coverage «Soft 404»                    | Потеря доверия                    |
| 1.7 | Битые внутренние ссылки                   | ✅    | Footer: убраны ссылки на несуществующие account-URL; оставлен `/settings`                                                                                                                                                   | Crawl errors                           | Было критично — исправлено в коде |

---

## 02. Core Web Vitals 2026 (полевые данные)

Оценка в Search Console — **75-й перцентиль** [CrUX field data](https://web.dev/articles/vitals-metrics); **lab** (Lighthouse) — диагностика, не замена поля.

| #   | Requirement | MegDB | Next.js 15 / код                                                                                    | Порог (good)   | Риск                                  |
| --- | ----------- | ----- | --------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------- |
| 2.1 | LCP         | ⚠️    | `next/image` AVIF/WebP в `next.config.ts`; LCP-элемент часто постер/hero — профилировать `/movie/*` | **≤ 2.5 s**    | Снижение видимости в отчёте CWV       |
| 2.2 | INP         | ⚠️    | Тяжёлые клиентские страницы (Discover) — измерять в поле                                            | **≤ 200 ms**   | То же                                 |
| 2.3 | CLS         | ⚠️    | Проверить шеллы изображений, модалки трейлера                                                       | **≤ 0.1**      | То же                                 |
| 2.4 | Поле vs lab | ℹ️    | В чеклисте разделять отчёты: GSC CWV = **field**                                                    | CrUX 75th %ile | Неверная оптимизация «под Lighthouse» |

---

## 03. Technical infra (robots / sitemap / hreflang / canonical / AMP)

| #   | Requirement                                | MegDB | Next.js 15 / код                                                                                            | Примечание                                                                                                 | Риск                                |
| --- | ------------------------------------------ | ----- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| 3.1 | `metadataBase` для абсолютных OG/canonical | ❌    | `layout.tsx`: `export const metadata = { metadataBase: new URL(SITE_URL), ... }` или импорт из `@/lib/site` | Относительные `alternates.canonical` на `/movies` могут быть неполными для парсеров                        | Неверный canonical в краевых кейсах |
| 3.2 | Абсолютный canonical на фильме             | ✅    | `generateMetadata` → `alternates.canonical: `${SITE_URL}${canonicalPath}``                                  | —                                                                                                          | —                                   |
| 3.3 | hreflang                                   | ❌    | Если будет мультиязык: `alternates.languages` + self-canonical                                              | [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions) | Дубли между локалями                |
| 3.4 | AMP                                        | ℹ️    | Не требуется для MegDB                                                                                      | AMP не обязателен                                                                                          | —                                   |

---

## 04. On-page optimization (`/movie/[id]` и шаблоны)

| #   | Requirement                             | MegDB | Next.js 15 / код                                                              | Метрика              | Риск                 |
| --- | --------------------------------------- | ----- | ----------------------------------------------------------------------------- | -------------------- | -------------------- |
| 4.1 | Уникальный `<title>` и meta description | ✅    | `generateMetadata`: title = название; description ≤ ~155 символов из overview | CTR в GSC            | Низкий CTR           |
| 4.2 | Один H1 / видимый основной заголовок    | ⚠️    | Проверить `MovieDetailPage` (семантика)                                       | Ручная проверка HTML | Слабая релевантность |
| 4.3 | Контент при пустом overview             | ⚠️    | Fallback description без кириллицы в overview                                 | Thin content         | Слабая страница      |
| 4.4 | Internal links на фильм                 | ✅    | Хедер, карточки, трейлер → movie                                              | Crawl depth          | —                    |
| 4.5 | Битые ссылки в шаблоне сайта            | ✅    | Футер обновлён (см. §14)                                                      | Crawl stats          | —                    |

---

## 05. E-E-A-T и доверие (каталог развлечений)

Развлечения — не классический YMYL, но полезны **прозрачность источника**, **политики**, **актуальность**.

| #   | Requirement                             | MegDB | Реализация                                                                                                              | Риск                                          |
| --- | --------------------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 5.1 | Источник данных (TMDB)                  | ⚠️    | Footer + **About** (`about/page.tsx`) уже объясняют TMDB; усилить при необходимости в JSON-LD `Organization` на главной | Запросы о лицензировании контента             |
| 5.2 | Редакционная / юридическая база         | ✅    | `terms`, `privacy`, `dmca`, `cookies`, `gdpr` в `src/app/`                                                              | DMCA / compliance                             |
| 5.3 | «Живые» страницы персон                 | ❌    | `person/[id]/page.tsx` — заглушка                                                                                       | Thin / low quality                            |
| 5.4 | Дата актуальности копирайта на discover | ✅    | `trustUpdatedAtLabel` в `movies/page.tsx` (UTC)                                                                         | Сигнал свежести (слабый, но лучше чем ничего) |

---

## 06. Content clustering (хабы / категории / GEO)

| #   | Requirement                                 | MegDB | Код / заметка                                                                                                                | Риск                            |
| --- | ------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------- | ----------------------------------- |
| 6.1 | Индексируемые хабы с уникальным контентом   | ⚠️    | Главная + `/movies` default + однофильтровые ветки в metadata                                                                | Конкурирование с `/movie/*`     |
| 6.2 | Единая политика discover (series vs movies) | ⚠️    | `/series`: один canonical на все фильтры; `/movies`/`tvshows`/`cartoons`: расширенные canonical + noindex при мульти-фильтре | Дубли / dilution                | Несогласованная стратегия long-tail |
| 6.3 | GEO (локальные провайдеры)                  | ℹ️    | Данные JustWatch/TMDB — зависит от региона пользователя                                                                      | Не путать с «GEO SEO» AI-оверью |

---

## 07. Structured data (Movie / VideoObject / FAQ / Breadcrumb)

Официально: [Movie structured data](https://developers.google.com/search/docs/appearance/structured-data/movie), [Video](https://developers.google.com/search/docs/appearance/structured-data/video), [FAQ](https://developers.google.com/search/docs/appearance/structured-data/faqpage), [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

| #   | Requirement                   | MegDB | Код                                                                               | Проверка                                                                                   | Риск                             |
| --- | ----------------------------- | ----- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| 7.1 | `Movie` JSON-LD               | ✅    | `movie/[id]/page.tsx` → `buildJsonLdMovie`                                        | Rich Results Test                                                                          | —                                |
| 7.2 | `VideoObject` + связь trailer | ✅    | `Movie.trailer` → `@id` `/trailer/{id}#video`; отдельный script для `VideoObject` | Дублирование с `/trailer` страницей — следить за **одним каноническим** видео-URL в выдаче | Дубли rich results               |
| 7.3 | `FAQPage`                     | ✅    | `buildFaqJsonLd`                                                                  | Политика Google по FAQ (должен совпадать видимый Q&A)                                      | Manual action при несоответствии |
| 7.4 | `BreadcrumbList`              | ✅    | `buildBreadcrumb`                                                                 | —                                                                                          | —                                |
| 7.5 | Валидация                     | ⚠️    | CI: вызов Rich Results Test / schema lint на ключевых шаблонах                    | —                                                                                          | Ошибки разметки                  |

---

## 08. AEO / AI Overviews (осторожно)

Google не публикует отдельный «CSQAF» как спецификацию для вебмастеров. Практика: **ясные факты, источники, стабильные URL, хорошие заголовки, таблицы не вместо основного HTML.**

| #   | Requirement                                            | MegDB | Действие                       | Риск                                                  |
| --- | ------------------------------------------------------ | ----- | ------------------------------ | ----------------------------------------------------- |
| 8.1 | Однозначные формулировки (где смотреть, год, режиссёр) | ✅    | FAQ JSON-LD + контент страницы | Галлюцинации в AI-сводках _снижаются_ только косвенно |
| 8.2 | Не дублировать противоречивый текст                    | ⚠️    | Согласовать FAQ с UI           | Несоответствие                                        |

---

## 09. Mobile & core experience

| #   | Requirement                     | MegDB | Заметка                                           | Риск                    |
| --- | ------------------------------- | ----- | ------------------------------------------------- | ----------------------- |
| 9.1 | Mobile-first indexing readiness | ⚠️    | Responsive UI — подтвердить viewport, tap targets | Mobile usability в GSC  |
| 9.2 | `lang` на `<html>`              | ✅    | `layout.tsx` `lang="en"`                          | Для EN-версии ок        |
| 9.3 | `id="main-content"`             | ✅    | Есть в `layout.tsx`                               | a11y + иногда навигация |

---

## 10. Performance (ISR, CDN, кэш)

| #    | Requirement                | MegDB | Код                                        | Примечание                                           |
| ---- | -------------------------- | ----- | ------------------------------------------ | ---------------------------------------------------- |
| 10.1 | ISR на фильме              | ✅    | `movie/[id]/page.tsx`: `revalidate = 3600` | vs «86400» из примера — tradeoff свежесть / нагрузка |
| 10.2 | ISR на листинге            | ✅    | `movies/page.tsx`: `revalidate = 600`      | —                                                    |
| 10.3 | Динамический поиск         | ✅    | `search/page.tsx`: `revalidate = 0`        | Норм для персонализируемого                          |
| 10.4 | Cloudflare APO / Cache-Tag | ❌    | Настраивается на CDN, не в репо            | Edge cache для HTML                                  |

---

## 11. Security & spam (CSP, cloaking)

| #    | Requirement                  | MegDB | Действие                                              | Риск                    |
| ---- | ---------------------------- | ----- | ----------------------------------------------------- | ----------------------- |
| 11.1 | CSP / HSTS / X-Frame-Options | ❌    | `next.config.ts` `headers()` или Cloudflare           | Security / XSS          |
| 11.2 | Cloaking                     | ✅    | Одинаковый HTML боту и пользователю (SSR)             | Ручные санкции          |
| 11.3 | Spam / автоген               | ℹ️    | Не подменять overview ключевыми списками без ценности | Helpful content signals |

---

## 12. Monitoring & recovery (GSC API, аналитика)

Официальные API: [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index) — Search Analytics, Sitemaps, Sites, **URL Inspection**.

| #    | Requirement                                | MegDB | Действие                                             | Риск                          |
| ---- | ------------------------------------------ | ----- | ---------------------------------------------------- | ----------------------------- |
| 12.1 | GSC property + sitemap submit              | ℹ️    | После появления `sitemap.xml`                        | —                             |
| 12.2 | Search Analytics export (CTR по `/movie/`) | ❌    | Скрипт на `searchanalytics.query`                    | Слепая зона по запросам       |
| 12.3 | URL Inspection batch                       | ❌    | `urlInspection.index.inspect` для критичных шаблонов | Индексные сбои                |
| 12.4 | PostHog / продуктовая аналитика            | ❌    | Не найдено в grep                                    | Не SEO, но полезно для INP/UX |

---

## 13. Route-by-route (`apps/web/src/app`)

Все маршруты с `page.tsx` на момент обновления. **ISR** = `export const revalidate`.

| Route                                              | ISR                    | Metadata                                                   | Canonical / robots                                | MegDB           |
| -------------------------------------------------- | ---------------------- | ---------------------------------------------------------- | ------------------------------------------------- | --------------- |
| `/`                                                | `TMDB_REVALIDATE_FAST` | `metadata` + OG `website`                                  | По умолчанию Next                                 | ✅              |
| `/movie/[id]`                                      | `3600`                 | `generateMetadata` + absolute canonical                    | Редирект на `moviePath`                           | ✅              |
| `/trailer/[id]`                                    | `3600`                 | `generateMetadata` + absolute canonical                    | —                                                 | ✅              |
| `/movies`                                          | `600`                  | `generateMetadata` по фасетам                              | Относительные canonical; multi-filter → `noindex` | ✅ / ⚠️ см. §03 |
| `/tvshows`                                         | `600`                  | Как `/movies` + фильтр жанров TV                           | Относительные canonical; multi-filter → `noindex` | ✅ / ⚠️         |
| `/cartoons`                                        | `600`                  | Как `/movies` (без веток `coming`/`expected` в мета)       | Относительные canonical; multi-filter → `noindex` | ✅ / ⚠️         |
| `/series`                                          | `600`                  | Один title/description + **`canonical: '/series'`** всегда | Нет `noindex` для мульти-фильтра                  | ⚠️              |
| `/search`                                          | `0`                    | Title с `q` при длине ≥2                                   | Нет canonical / noindex                           | ❌              |
| `/person/[id]`                                     | default                | `title: Person ${id}`                                      | Нет богатого контента                             | ❌              |
| `/categories`                                      | default                | Статический title                                          | Нет уникального контента                          | ⚠️              |
| `/about`                                           | `86400`                | Статический; текст про TMDB                                | —                                                 | ✅              |
| `/contact`, `/help`, `/settings`, `/accessibility` | `86400`                | Статический                                                | —                                                 | ✅              |
| `/privacy`, `/terms`, `/cookies`, `/gdpr`, `/dmca` | `86400`                | Статический (legal)                                        | —                                                 | ✅              |
| `/ui-kit`                                          | —                      | `robots: { index: false }`                                 | Dev / внутреннее                                  | ✅              |

**API routes** (`/api/discover`, search, discover variants): не индексируются как HTML; убедиться, что нет случайной выдачи HTML с `200` на `/api/*` без `noindex` (обычно не проблема для JSON).

---

## 14. Internal linking (Header + Footer)

| Источник                 | Куда ведёт                                                              | MegDB | Заметка                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------- |
| `Header.tsx` `NAV_LINKS` | `/movies`, `/series`, `/cartoons`, `/tvshows`, `/categories`            | ✅    | Основной crawl-path на листинги                                                                                     |
| `Footer.tsx` Browse      | То же + `/categories`                                                   | ✅    | —                                                                                                                   |
| `Footer.tsx` Account     | `/settings`                                                             | ✅    | Ранее вели на несуществующие `/watchlist`, `/profile`, `/notifications`, `/login` — **удалено** до появления роутов |
| `Footer.tsx` Support     | `/help`, `/settings`, `/search`, `/about`, `/contact`, `/accessibility` | ✅    | `/search` без noindex — см. §01                                                                                     |
| `Footer.tsx` Legal       | Юридические страницы                                                    | ✅    | —                                                                                                                   |
| Соцсеть                  | Instagram (внешняя)                                                     | ℹ️    | `rel` на внешние — по желанию `noopener noreferrer` (уже может быть в `Link`/`a`)                                   |

**Рекомендация:** периодически прогонять краулер по домену; в GSC смотреть **Page with redirect** / **Not found (404)**.

---

## 15. Критические пробелы — дополнительный аудит (2026-04-22)

То, что **не было** в первых версиях чеклиста и даёт высокий риск или упущенную выгоду.

| #    | Тема                                        | MegDB | Почему критично                                                                                                                                                                                                                                      | Действие                                                                                                                   |
| ---- | ------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 15.1 | **Favicon / apple-touch / PWA manifest**    | ❌    | В репозитории **нет** `app/icon.png`, `favicon.ico`, `apple-touch-icon`, `manifest.ts` — в выдаче/вкладке дефолтная иконка Next, хуже узнаваемость бренда                                                                                            | Добавить [file-based metadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/app-icons) в `src/app/` |
| 15.2 | **`export const viewport`** в root layout   | ⚠️    | В `layout.tsx` нет явного `viewport` — Next подставляет дефолт; для mobile-first и **отключения некорректного `maximum-scale`** лучше задать явно ([Next viewport](https://nextjs.org/docs/app/api-reference/functions/generate-viewport))           | `export const viewport = { width: 'device-width', initialScale: 1 }`                                                       |
| 15.3 | **`middleware.ts`**                         | ❌    | Нет редиректа **www↔non-www**, **http→https**, **trailing slash** — дубли кластеры, если CDN не нормализует                                                                                                                                          | Edge middleware или правила на Cloudflare                                                                                  |
| 15.4 | **GSC / Bing verification**                 | ❌    | Нет `metadata.verification.google` (и аналога) — ручной meta-тег привязки свойства                                                                                                                                                                   | Env + `metadata` в `layout.tsx`                                                                                            |
| 15.5 | **WebSite + SearchAction** (JSON-LD на `/`) | ❌    | Нет `WebSite` + `potentialAction` типа `SearchAction` (`target` → `/search?q={search_term_string}`) — теряется шанс на **sitelinks search box** ([Google](https://developers.google.com/search/docs/appearance/structured-data/sitelinks-searchbox)) | Один `<script type="application/ld+json">` на главной                                                                      |
| 15.6 | **`not-found.tsx` + metadata**              | ✅    | `not-found.tsx`: `title: 'Page not found'`, `robots: { index: false, follow: true }`                                                                                                                                                                 | Меньше шума в индексе на 404                                                                                               |
| 15.7 | **Доля 5xx / error UI**                     | ⚠️    | `error.tsx` (client) при сбоях TMDB — следить в GSC **Server error** / **Page indexing**                                                                                                                                                             | Алерты, кэш, fallback ISR                                                                                                  |
| 15.8 | **`X-Robots-Tag` на JSON API**              | ℹ️    | `/api/discover` и др. — обычно не индексируются как страницы; при случайной выдаче HTML стоит заголовок `noindex`                                                                                                                                    | Опционально на route handlers                                                                                              |
| 15.9 | **Организация в JSON-LD**                   | ⚠️    | На фильме `publisher` у `VideoObject`; нет **единого** `Organization` на сайте в schema                                                                                                                                                              | `Organization` + `sameAs` (соцсети) в layout или home                                                                      |

---

## Сниппеты-подсказки (из текущего MegDB)

**ISR (фильм):**

```ts
// apps/web/src/app/movie/[id]/page.tsx
export const revalidate = 3600
```

**Каноникал + редирект slug:**

```ts
const canonicalPath = moviePath(data.title, data.releaseDate)
if (`/movie/${idStr}` !== canonicalPath) {
  redirect(canonicalPath)
}
// generateMetadata:
alternates: { canonical: `${SITE_URL}${canonicalPath}` },
```

**Рекомендуемый следующий шаг — `metadataBase`:**

```ts
// apps/web/src/app/layout.tsx (концепт)
import { SITE_URL } from '@/lib/site'
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // ...
}
```

---

## Официальные ссылки Google (расширенный список)

- [Search Essentials](https://developers.google.com/search/docs/essentials)
- [Technical requirements (3 условия)](https://developers.google.com/search/docs/essentials/technical)
- [SEO Starter Guide: The Basics](https://support.google.com/webmasters/answer/7451184)
- [How Google Search works](https://developers.google.com/search/docs/fundamentals/how-google-search-works)
- [Get started — SEO for developers](https://developers.google.com/search/docs/fundamentals/get-started-developers)
- [Sitemaps — build](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [robots.txt intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro)
- [Consolidate duplicate URLs / canonical](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Faceted navigation (Search Central blog, Dec 2024)](https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav)
- [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
- [Helpful, people-first content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
- [Intro to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)
- [Core Web Vitals report (GSC)](https://support.google.com/webmasters/answer/9205520)
- [Defining CWV thresholds (web.dev)](https://web.dev/articles/defining-core-web-vitals-thresholds)
- [URL Inspection (GSC Help)](https://support.google.com/webmasters/answer/9012289)
- [Search Console API](https://developers.google.com/webmaster-tools/v1/api_reference_index)
- [Movie structured data](https://developers.google.com/search/docs/appearance/structured-data/movie)
- [Video structured data](https://developers.google.com/search/docs/appearance/structured-data/video)
- [What’s new — Search Central docs](https://support.google.com/webmasters/answer/6211428) (новейшие правки гайдов)
- [RSS обновлений Search Central](https://developers.google.com/search/updates/search_docs_updates.rss)
- [RSS changelog crawling infrastructure](https://developers.google.com/crawling/docs/changelog/crawling_docs_updates.rss)
- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

---

_Части A–B: конденсат официальной документации Google (апрель 2026). Часть C: состояние репозитория MegDB — при изменении кода обновляйте колонку MegDB._
