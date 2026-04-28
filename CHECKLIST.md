## Stage: 1

### Done

- Installed workspace tooling for cleanup: `knip` and `@biomejs/biome`.
- Added root `biome.json` with scoped includes and protected-path ignores (`vendor`, `legacy-api`).
- Added root `knip.json` workspace inventory config for `apps/*`, `packages/*`, and `scripts`.
- Added root scripts: `biome:check`, `biome:write`, `knip`, `knip:ci`.
- Captured first cleanup diagnostics baselines from `biome` and `knip`.
- Fixed invalid GitHub workflow YAML keys with colons to unblock `knip` parsing.
- Generated machine-readable knip baseline report: `.reports/knip-baseline.json`.

### Metrics (Before -> After)

- Files: 44936 -> 44936
- Dirs: 8037 -> 8037
- Build: 64.70s (failed) -> 64.70s (failed)
- tsc errors: 0 -> 0
- knip issues: N/A (tool missing) -> 75 reported items (+ 1 workflow parser blocker)
- biome diagnostics: N/A (tool missing) -> 643 errors / 145 warnings / 38 infos
- tests: 68/68 -> 68/68

### Risks / Follow-ups

- `biome:check` currently reports large formatting/lint debt (643 errors); require staged scope cleanup before CI hard-fail activation.
- Existing build failure remains in `apps/web/src/components/MovieDetailPage/MovieComments.tsx` (`@typescript-eslint/no-misused-promises`).

### Next first command

```bash
pnpm exec knip --reporter compact --max-show-issues=200
```
