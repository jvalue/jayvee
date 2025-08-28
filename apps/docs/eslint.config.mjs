// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import baseConfig from '../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    ignores: [
      '**/.docusaurus/**',
      '**/theme/prism-jayvee.js',
      '**/*.config.js',
      '**/prism-include-languages.js',
      '**/sidebars.js',
    ],
  },
];
