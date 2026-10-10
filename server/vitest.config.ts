import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Co-located tests: foo.ts sits next to foo.test.ts. Easier to notice a
    // missing test than if they lived in a separate tests/ tree.
    include: ['src/**/*.test.ts'],
    environment: 'node',

    // There are tests now, so an empty run means something is wrong.
    // (This was `true` while the suite was empty.)
    passWithNoTests: false,
  }
});
