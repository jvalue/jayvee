// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import baseConfig from '../../eslint.config.mjs';

const configs = [
  {
    ignores: ['**/dist'],
  },
  ...baseConfig,
  {
  languageOptions: {
      parserOptions: {
	project: ['apps/docs/tsconfig.app.json'],
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

// HACK: Somehow the typescript-eslint plugin is not always recognized,
// despite being part of the config. The workaround is to extract the plugin,
// and reinsert it at the end
const typescriptEslintPlugins = configs.flatMap((config) => {
  const plugin = config.plugins?.['@typescript-eslint'];
  return plugin !== undefined ? [plugin] : [];
});

const typescriptEslintPlugin = typescriptEslintPlugins.reduce((prev, curr) => {
  if (Object.entries(prev).some(([key, value]) => curr[key] !== value)) {
    throw new Error('Must be same values')
  }
  return prev;
});


export default [...configs,
  {plugins: {"@typescript-eslint": typescriptEslintPlugin}}
];
