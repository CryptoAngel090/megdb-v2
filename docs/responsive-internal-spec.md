# Responsive Internal Spec (MegDB, 2026)

Scope: all web UI in `apps/web`.

## 1) Core responsive contract

- Use fluid sizing by default: `minmax()`, `fr`, `clamp()`, `%`, `auto-fit`, `auto-fill`.
- Do not use fixed widths/heights when a fluid expression can solve the layout.
- Component-level adaptation must be container-first (`@container`), not viewport-first.
- Page shell/layout may use `@media`; internal component behavior must use `@container`.
- Spacing, typography, radius, and content widths must come from tokens only.

## 2) Tokens-first sizing rules

- Typography uses token scale only (`--text-*`, `clamp()`-based).
- Spacing uses token scale only (`--space-*`).
- Radius uses token scale only (`--radius-*`).
- Color uses design tokens only (`--color-*`).
- Content width caps use tokenized containers (`--container-*`, `--container-max`).

No raw pixel constants for reusable component sizing, except unavoidable asset metadata (e.g. intrinsic image ratio input).

## 3) Media query vs container query boundary

Allowed for `@media`:
- Global page topology changes (site shell, major route layout shifts).
- Global accessibility preferences (`prefers-reduced-motion`, `prefers-contrast`).

Required for `@container`:
- Cards, panels, filters, posters, metadata blocks.
- Any reusable component that changes density, orientation, controls, or content priority.

Rule: if the behavior depends on parent width, it is a container-query concern.

## 4) Component responsiveness classes

Container-aware (mandatory):
- Media cards and rails.
- Detail metadata panels and action strips.
- Filters and discover controls.
- Poster/media blocks and info overlays.
- Reusable content panels (overview, facts, providers, comments shell).

Topology-adaptive (mandatory where relevant):
- Components that switch structure, not only size (e.g. stack -> split, controls regrouping).
- Adaptation must happen from available container space, not page viewport assumptions.

## 5) Performance-safe responsive behavior

- Keep first screen lightweight on mobile.
- Avoid layout jumps: reserve geometry early with stable ratios/sizes.
- Avoid heavy entrance animations for critical content.
- Do not block route render for below-fold sections.
- Stream dynamic blocks via separate Suspense islands where possible.

## 6) Anti-chaos guardrails

- Do not introduce parallel systems (legacy fixed-width + modern fluid) in the same component.
- Do not patch local breakage with one-off hardcoded widths; update tokens or component contract.
- Any new reusable component must declare:
  - token dependencies,
  - container behavior,
  - topology-adaptive breakpoints (container thresholds), if any.

## 7) Mandatory QA matrix (release gate)

Responsive implementation is incomplete until it passes the mandatory QA matrix.

Required viewport widths:
- `320`, `360`, `375`, `390`, `414`
- `768`, `1024`, `1280`, `1440`
- `1728`, `1920`, `2560`

Required scenarios:
- narrow sidebar
- wide content
- 2-column detail page
- 3-column detail page
- dense toolbar with long labels
- translated/long title overflow
- no-image / broken-image state
- long metadata block
- empty states

For each width + scenario, verify:
- no horizontal overflow
- no edge-sticking content (safe gutters preserved)
- text line length remains readable
- card heights stay stable (no broken vertical rhythm)
- alignment remains consistent
- tap targets remain usable (no undersized controls)
- secondary text remains readable (contrast + size)

Execution rule:
- QA matrix must be run after any meaningful layout/token/container change.
- Any FAIL blocks merge/release until fixed or explicitly accepted as known issue.
- Use `apps/web/docs/RESPONSIVE_QA_MATRIX.md` as the source-of-truth checklist.
