import type { Config } from "tailwindcss"

export default {
  content: [
    "./src/**/*.{ts,tsx}",
    "../../apps/*/src/**/*.{ts,tsx}",
    '../../packages/cms-core/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  plugins: [],
} satisfies Config
