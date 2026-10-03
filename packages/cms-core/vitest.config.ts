import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Integration tests run under a separate Node-env config against real
    // Postgres (see vitest.integration.config.ts) — keep them out of the
    // default jsdom unit run.
    exclude: ['**/node_modules/**', '**/*.integration.test.ts'],
  },
})
