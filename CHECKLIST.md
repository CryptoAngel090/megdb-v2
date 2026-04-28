## Stage: 1

### Done

- Installed workspace tooling for cleanup: `knip` and `@biomejs/biome`.
- Added root `biome.json` with scoped includes and protected-path ignores (`vendor`, `legacy-api`).
- Added root `knip.json` workspace inventory config for `apps/*`, `packages/*`, and `scripts`.
- Added root scripts: `biome:check`, `biome:write`, `knip`, `knip:ci`.
- Captured first cleanup diagnostics baselines from `biome` and `knip`.
- Fixed invalid GitHub workflow YAML keys with colons to unblock `knip` parsing.
- Generated machine-readable knip baseline report: `.reports/knip-baseline.json`.
- Executed first cleanup batch: deleted 18 files flagged by knip as `Unused files` in `apps/web`.
- Executed second cleanup batch: removed all knip-reported `unused dependencies` and `unused devDependencies` across root/apps/packages.
- Executed third cleanup batch: removed low-risk unused export aliases/constants from SEO and UI utility modules.
- Executed fourth cleanup batch: removed remaining knip-reported `unused exports` + `unused exported types` in `apps/api` and `apps/web` (`tmdb`, discover copy helpers, entity/search helpers, API service-local types).
- Executed ultra stabilization batch: fixed `MovieComments` submit handler lint pattern, resolved residual web lint blockers after export cleanup, recovered `knip` green, and restored full root `build` to green (after clearing stale `apps/web/.next`).

### Metrics (Before -> After)

- Files: 44936 -> 46873
- Dirs: 8037 -> 8037
- Build: 64.70s (failed) -> 118.59s (passed)
- tsc errors: 0 -> 0
- knip issues: N/A (tool missing) -> 57 reported items
- knip unused files: 18 -> 0
- knip unused deps/devDeps: 7 -> 0
- knip remaining issue payload (`.reports/knip-baseline.json`): 105 (exports/types-focused)
- knip remaining issue payload (`.reports/knip-baseline.json`): 90 (exports/types-focused)
- knip duplicates: 3 -> 0
- knip compact report: 57 -> 0 (green)
- biome diagnostics: N/A (tool missing) -> 643 errors / 145 warnings / 38 infos
- tests: 68/68 -> 68/68

### Risks / Follow-ups

- `biome:check` currently reports large formatting/lint debt (643 errors); require staged scope cleanup before CI hard-fail activation.
- Build now passes, but Next.js still emits non-blocking warnings around `/twitter-image` exported `runtime` detection and missing Next ESLint plugin detection.

### Next first command

```bash
pnpm run knip:ci
```
