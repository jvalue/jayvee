// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import baseConfig from '../../eslint.config.mjs';
import nxEslintPlugin from '@nx/eslint-plugin';

export default [
  ...nxEslintPlugin.configs['flat/react-typescript'],
  ...baseConfig,
  {
    ignores: ['!**/*', '*.*', '**/src/lib/*.monarch.ts'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['*.ts', '*.tsx'],
    rules: {
      'import/no-unresolved': 'off',
      'react/jsx-no-useless-fragment': 'off',
    },
  },
];
