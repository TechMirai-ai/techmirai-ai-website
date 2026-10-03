import { defineConfig } from 'vitest/config'

/**
 * Integration tests run in a real Node environment against a throwaway
 * PostgreSQL database (see src/booking/test/global-setup.ts). Kept separate
 * from the default jsdom unit-test config. File parallelism is disabled so all
 * files share the single test database without cross-file interference.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.integration.test.ts'],
    globalSetup: ['./src/booking/test/global-setup.ts'],
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 120_000,
  },
})
