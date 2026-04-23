import { defineConfig } from 'vitest/config'

/** Tests only hit `/health`; a placeholder URL is enough to satisfy `neon()` at import time. */
const TEST_DATABASE_URL = 'postgresql://test:test@127.0.0.1:5432/megdb_vitest_placeholder'

export default defineConfig({
  test: {
    env: { DATABASE_URL: process.env.DATABASE_URL ?? TEST_DATABASE_URL },
  },
})
