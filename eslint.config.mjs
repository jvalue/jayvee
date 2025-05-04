// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import js from '@eslint/js';
import nxEslintPlugin from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import unicorn from 'eslint-plugin-unicorn';

const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

export default [
  {
    ignores: ['**/dist'],
  },
  ...compat.extends('@jvalue/eslint-config-jvalue'),
  { plugins: { '@nx': nxEslintPlugin } },
  {
    files: ['**/*.ts', '.tsx'],
    rules: {
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          fixStyle: 'inline-type-imports',
        },
      ],
    },
  },
  { plugins: { 'unicorn': unicorn } },
  {files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
      rules: {
        'unicorn/prefer-node-protocol': 'warn',
        'unicorn/import-style': 'warn',
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'node:assert',
                message:
                  'Please use the library `assert` instead to keep browser compatibility. You might need to disable rule `unicorn/prefer-node-protocol` to do so.',
              },
            ],
          },
        ],
      },
    },
  ...compat
    .config({
      extends: ['plugin:@nx/typescript'],
    })
    .map((config) => ({
        ...config,
        plugins: { '@stylistic': stylistic },
        files: ['**/*.ts', '**/*.tsx', '**/*.cts', '**/*.mts'],
        rules: {
            ...config.rules,
            '@stylistic/no-extra-semi': 'error',
        },
    })),
  ...compat
    .config({
      extends: ['plugin:@nx/javascript'],
    })
    .map((config) => ({
        plugins: { '@stylistic': stylistic },
        ...config,
        files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
        rules: {
            ...config.rules,
            '@stylistic/no-extra-semi': 'error',
        },
    })),
  ...compat
    .config({
      plugins: ['vitest'],
    })
    .map((config) => ({
      ...config,
      files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
      rules: {
        ...config.rules,
        '@typescript-eslint/unbound-method': 'off',
      },
    })),
  {
    ignores: [
      // REUSE-IgnoreStart
      '# SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg',
      '#',
      '# SPDX-License-Identifier: AGPL-3.0-only',
    ],
  },
];
