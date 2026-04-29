# Token Pipeline (Style Dictionary + Figma Sync)

## Commands

- `pnpm run tokens:build` - build Style Dictionary outputs from `tokens/style-dictionary.tokens.json`
- `pnpm run tokens:figma:sync` - fetch Figma local variables and merge into `color` tokens
- `pnpm run tokens:sync` - run Figma sync, then rebuild outputs

## Required env for Figma sync

- `FIGMA_ACCESS_TOKEN`
- `FIGMA_FILE_KEY`

Example (PowerShell):

```powershell
$env:FIGMA_ACCESS_TOKEN="..."
$env:FIGMA_FILE_KEY="..."
pnpm run tokens:sync
```

## Outputs

- `theme/generated/tokens.css`
- `theme/generated/tailwind.tokens.json`
