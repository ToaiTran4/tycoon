import js from '@eslint/js';

const ignored = ['**/node_modules/**', '**/dist/**', '**/coverage/**', '**/prisma/**'];

export default [
  { ignores: ignored },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { console: true, process: true, setTimeout: true, clearTimeout: true, setInterval: true, clearInterval: true, fetch: true },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    files: ['fe/src/**/*.jsx', 'fe/src/**/*.js'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        window: true, document: true, localStorage: true, navigator: true,
        setTimeout: true, clearTimeout: true, setInterval: true, clearInterval: true,
        URLSearchParams: true, URL: true, FormData: true, Blob: true,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
    },
  },
];
