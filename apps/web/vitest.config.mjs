import { defineConfig, defineProject } from 'vitest/config';

// Per-file override: add `// @vitest-environment jsdom` at the top of a
// test file to switch its environment regardless of which project it
// belongs to.

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: [
        'src/**/*.{ts,tsx}',
        'app/**/*.{ts,tsx}',
        'middleware.ts',
      ],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'src/components/ui/**',
        'app/**/layout.tsx',
        'app/**/loading.tsx',
      ],
    },
    projects: [
      defineProject({
        test: {
          name: 'node',
          environment: 'node',
          globals: true,
          include: [
            'src/lib/**/*.test.{ts,tsx}',
            'src/styles/**/*.test.{ts,tsx}',
          ],
        },
      }),
      defineProject({
        test: {
          name: 'jsdom',
          environment: 'jsdom',
          globals: true,
          include: [
            'src/components/**/*.test.{ts,tsx}',
            'app/**/*.test.{ts,tsx}',
          ],
        },
      }),
    ],
  },
});
