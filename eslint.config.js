import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import importPlugin from 'eslint-plugin-import';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
      // Disable formatting-related ESLint rules to avoid conflicts with Prettier
      eslintConfigPrettier,
    ],
    plugins: {
      react,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        // Supports TS path aliases in import rules
        typescript: {
          project: ['./tsconfig.app.json', './tsconfig.node.json'],
        },
      },
    },
    rules: {
      // Include recommended React rules (flat config doesn't auto-merge them)
      ...(react.configs.recommended?.rules ?? {}),

      // Helpful React 17+ rules
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      // Reduce noise until we progressively fix strings in JSX
      'react/no-unescaped-entities': 'off',

      // Enforce consistent import ordering with blank lines between groups
      'import/order': [
        'warn',
        {
          groups: [
            ['builtin', 'external'],
            'internal',
            ['parent', 'sibling', 'index'],
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
          pathGroups: [
            {
              pattern: '@{domains,components,repositories,utils,types,store,lib}/**',
              group: 'internal',
              position: 'after',
            },
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
        },
      ],
    },
  },
]);
