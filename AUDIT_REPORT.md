# Audit report (in-progress)

Кратко — текущее состояние аудита репозитория `MEGDB`.

## Общая статистика
- Файлов: 40,694
- Папок: 7,607
- Общий размер: 871,101,959 байт (~831 MB)

## Наиболее крупные артефакты (топ-10)
- `node_modules/.pnpm/@next+swc-win32-x64-msvc/.../ext-swc.win32-x64-msvc.node` — ~148 MB (бинарник)
- `node_modules/.pnpm/@turbo+windows-64/.../turbo.exe` — ~40 MB
- Внутри `apps/web/.next` (webpack cache, server/client packs) — суммарно ~161 MB
- `node_modules` в целом — ~646.6 MB

## Сгенерированные / закоммиченные артефакты
- `theme/generated/tokens.css` (~1 KB) и `theme/generated/tailwind.tokens.json` (~987 bytes) — генерируемые файлы (Style Dictionary). Рекомендуется не хранить в VCS, генерировать на CI.
- Lighthouse JSON: найдено 7 файлов `lh-*.json` (суммарно ~5.56 MB). Их можно удалить/игнорировать.
- `.next` кэш в `apps/web/.next` — занимает ~162 MB; обычно не коммитится.

## Токены и дублирование
- `packages/ui/src/tokens/tokens.css` — файл токенов (источник для `@repo/ui`).
- Есть дубли `tokens.css` в `node_modules` вследствие pnpm-пакетов/локальных ссылок.
- Tailwind конфиг и `globals.css` частично дублируют значения — требуется выбрать единую точку правды (Recommend: `packages/ui` для дизайн-системы + `apps/web` для публичных переопределений).

## CSS Modules
- Найдено 174 `*.module.css` файлов (топ-20 по размеру показаны в скрипте `scripts/css_audit.ps1`).
- Некоторые крупные файлы: `MovieDetailPage.module.css` (~54 KB), `Header.module.css` (~27 KB), `MediaCard.module.css` (~20 KB).

## Логирующие вызовы и TODOs
- `console.log` найден в 5 файлах (в основном в `scripts/` — dev-утилиты).
- `debugger` найден в 2 файлах (один — в `.cursor` manifest).
- `TODO`/`FIXME` — встречаются редко (несколько записей в `.cursor` и скриптах).

## Рекомендации (первый приоритет)
1. Добавить в `.gitignore` и удалить из репозитория:
   - `theme/generated/`
   - `lh-*.json`
   - `_lh_tmp/`
   - `.next/`
   - `node_modules/` (если он как-то закоммичен — обычно нет)
2. Перенести генерацию токенов в CI: `pnpm run tokens:build` в pipeline вместо коммита файлов.
3. Очистить/исключить большие кэши и бинарники из репозитория (см. топ списка).
4. Запустить статический аудит CSS (PurgeCSS/coverage) на `*.module.css` для выявления неиспользуемых правил.

## Файлы/скрипты, использованные в аудите
- `scripts/count_files.ps1` — подсчёт файлов/папок/размера
- `scripts/top_large.ps1` — топ крупных файлов
- `scripts/list_lh.ps1`, `scripts/sum_lh.ps1` — lighthouse файлы
- `scripts/css_audit.ps1` — подсчёт `*.module.css`
- `scripts/find_tokens.ps1` — поиск токен-файлов
- `scripts/list_logs.ps1` — поиск `console.log`/`debugger`

---
Отмечу: это промежуточный отчёт — если подтверждаете, я применю автоматическую очистку (патч `.gitignore` + `git rm --cached` для перечисленных артефактов) и подготовлю финальный PR/commit. Также могу продолжить глубокий аудит `*.module.css` (unused rules) и подготовить список кандидатов на удаление.
