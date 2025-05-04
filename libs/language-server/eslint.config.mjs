// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import baseConfig from '../../eslint.config.mjs';

export default [
	{
		ignores: ['**/dist'],
	},
	...baseConfig,
	{
		languageOptions: {
			parserOptions: {
				project: [
					'libs/language-server/tsconfig.lib.json',
					'libs/language-server/tsconfig.spec.json',
				],
			},
		},
	},
	{
		ignores: [
			'**/src/lib/**/generated/*',
			'**/vite.config.*.timestamp*',
			'**/vitest.config.*.timestamp*',
		],
	},
];
