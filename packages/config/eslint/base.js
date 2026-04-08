import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/lib/supabase/service',
              message:
                'service.ts may only be imported from api/agent/**, api/webhooks/**, api/cron/**, api/agent-auth/**. See CLAUDE.md section 5.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/app/api/agent/**',
      '**/app/api/webhooks/**',
      '**/app/api/cron/**',
      '**/app/api/agent-auth/**',
      '**/app/api/public/**',
    ],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    ignores: ['node_modules/', '.next/', 'dist/', '.turbo/'],
  },
];
