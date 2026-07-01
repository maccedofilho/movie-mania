import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.js'],
    include: ['src/**/__tests__/**/*.test.js', 'test/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/modules/**/*.js'],
      exclude: [
        'src/config/**',
        'src/middlewares/**',
        'src/server.js',
        'src/app.js',
        '**/__tests__/**',
        '**/*Controller.js',
        '**/*Routes.js',
      ],
      thresholds: {
        'src/modules/movie/movieService.js': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
        'src/modules/watchlist/watchlistService.js': {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
    },
  },
});
