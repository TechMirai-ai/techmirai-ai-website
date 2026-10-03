// Workaround: @next/env v15 sets __esModule:true but has no .default property.
// Payload's loadEnv.js does `import x from '@next/env'` which tsx compiles to
// `require('@next/env').default` — which is undefined. This shim adds .default.
'use strict'
const mod = require('@next/env')
if (mod && mod.__esModule && !mod.default) {
  mod.default = mod
}
