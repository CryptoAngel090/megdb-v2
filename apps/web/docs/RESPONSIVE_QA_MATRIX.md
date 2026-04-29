# Responsive QA Matrix (MegDB, mandatory)

Scope: `apps/web` responsive behavior and layout integrity.

Use this checklist after any meaningful changes in:
- tokens (`--space-*`, `--text-*`, `--radius-*`, `--content-*`)
- page shell/layout recipes
- container-query logic
- overlay/popover/dropdown/detail topology

## 1) Required viewport widths

- `320`
- `360`
- `375`
- `390`
- `414`
- `768`
- `1024`
- `1280`
- `1440`
- `1728`
- `1920`
- `2560`

## 2) Required scenarios

- narrow sidebar
- wide content
- 2-column detail page
- 3-column detail page
- dense toolbar with long labels
- translated/long title overflow
- no-image / broken-image state
- long metadata block
- empty states

## 3) Mandatory checks per width + scenario

For every test point, confirm all items:

- [ ] No horizontal overflow.
- [ ] Content does not stick to viewport edges (gutters respected).
- [ ] Text line length remains readable.
- [ ] Card heights keep stable rhythm (no broken rows).
- [ ] Alignment remains coherent (titles/meta/actions/badges).
- [ ] Tap targets are not too small.
- [ ] Secondary text remains readable (size + contrast).

## 4) Execution protocol

1. Pick a target route/surface (discover, detail, overlays, etc.).
2. Run all widths above.
3. For each width, execute all scenario variants relevant to that route.
4. Mark pass/fail for each mandatory check.
5. Capture evidence for failures (screenshot + short note + file/class impact).
6. Fix failures, rerun only failed rows, then rerun full row for final validation.

Merge rule:
- Any unresolved FAIL blocks merge/release unless explicitly accepted as a known issue.

## 5) QA run log template

Date:
Owner:
Branch:
Surface:

- Width:
  - Scenario:
  - Result: PASS / FAIL
  - Notes:
  - Evidence:

## 6) Practical notes for MegDB

- Validate both shell-level media behavior and component-level container behavior.
- Prioritize first-screen stability on mobile before below-fold cosmetics.
- When failures appear only in translated/long labels, fix contract (wrapping/truncation/flow), not with one-off hard widths.
