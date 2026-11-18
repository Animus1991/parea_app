// @ts-check
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';

export default tseslint.config(
  {
    ignores: ['dist', 'node_modules', 'coverage', 'playwright-report', 'test-results', 'server.ts', 'src/components/ui/chart.tsx', 'src/components/ui/resizable.tsx'],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Prototype rollout: keep a11y signal loud but non-blocking until debt clears.
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      // Same exemptions as the plugin's recommended preset (img onError/onLoad, dialog keys).
      'jsx-a11y/no-noninteractive-element-interactions': [
        'warn',
        {
          handlers: ['onClick', 'onError', 'onLoad', 'onMouseDown', 'onMouseUp', 'onKeyPress', 'onKeyDown', 'onKeyUp'],
          alert: ['onKeyUp', 'onKeyDown', 'onKeyPress'],
          body: ['onError', 'onLoad'],
          dialog: ['onKeyDown', 'onKeyUp', 'onKeyPress'],
          iframe: ['onError', 'onLoad'],
          img: ['onError', 'onLoad'],
        },
      ],
      // Labels here wrap the control and put the text one or two wrappers deeper.
      'jsx-a11y/label-has-associated-control': ['warn', { depth: 4 }],
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/heading-has-content': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test/**'],
    rules: { '@typescript-eslint/no-explicit-any': 'off', 'no-console': 'off' },
  },
  {
    // Design-system guards (P1-T10, warn-first rollout → promote to error later).
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector: 'Literal[value=/text-\\[\\d/]',
          message: 'Arbitrary font sizes are banned — use the type scale (text-2xs…text-4xl). [P1-T4]',
        },
        {
          selector: 'TemplateElement[value.raw=/text-\\[\\d/]',
          message: 'Arbitrary font sizes are banned — use the type scale (text-2xs…text-4xl). [P1-T4]',
        },
        {
          selector: 'Literal[value=/\\[(#111827|#0e8b8d|#18d8db)/i]',
          message: 'Off-brand hex is banned — use semantic tokens (ink / brand / accent). [P1-T3]',
        },
        {
          selector: 'TemplateElement[value.raw=/\\[(#111827|#0e8b8d|#18d8db)/i]',
          message: 'Off-brand hex is banned — use semantic tokens (ink / brand / accent). [P1-T3]',
        },
        {
          selector: 'Literal[value=/z-\\[(?!1\\]|5\\]|1000\\])\\d/]',
          message: 'Ad-hoc z-index is banned — use the named scale (z-fab…z-toast). Local stacking: z-0/10/20/30. [P1-T7]',
        },
        {
          selector: 'TemplateElement[value.raw=/z-\\[(?!1\\]|5\\]|1000\\])\\d/]',
          message: 'Ad-hoc z-index is banned — use the named scale (z-fab…z-toast). Local stacking: z-0/10/20/30. [P1-T7]',
        },
        {
          selector: 'Literal[value=/shadow-(sm|md|lg|xl|2xl)/]',
          message: 'Default shadows are banned — use the soft elevation scale (shadow-soft / -md / -lg / -up). [P1-T5]',
        },
        {
          selector: 'TemplateElement[value.raw=/shadow-(sm|md|lg|xl|2xl)/]',
          message: 'Default shadows are banned — use the soft elevation scale (shadow-soft / -md / -lg / -up). [P1-T5]',
        },
      ],
    },
  },
);
