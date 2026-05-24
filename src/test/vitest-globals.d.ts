// Makes Vitest globals (describe/it/expect/beforeEach/…) known to `tsc --noEmit`.
// Vitest is configured with `globals: true` (vitest.config.ts); this reference adds the
// matching ambient types so the type-check step sees them without restricting
// compilerOptions.types (which would drop the auto-included @types).
/// <reference types="vitest/globals" />
