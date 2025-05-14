// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import baseConfig from '../../../../eslint.config.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export default [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: [
          './tsconfig.lib.json',
          './tsconfig.spec.json',
          './tsconfig.mock.json',
        ],
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url))
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    ignores: ['**/vite.config.*.timestamp*', '**/vitest.config.*.timestamp*'],
  },
];
