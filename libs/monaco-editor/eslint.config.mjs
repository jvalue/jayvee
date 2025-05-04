// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import baseConfig from '../../eslint.config.mjs';
import { FlatCompat } from "@eslint/eslintrc";
import { fixupPluginRules } from "@eslint/compat";

const compat = new FlatCompat({
	baseDirectory: dirname(fileURLToPath(import.meta.url)),
});

export default defineConfig([
	...baseConfig,
	fixupPluginRules(compat.extends("plugin:@nx/react")),
	{
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.lib.json"],
				tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
			},
		},
	}, globalIgnores(["!**/*", "*.*", "src/lib/*.monarch.ts"]), {
		files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
		rules: {},
	}, {
		files: ["**/*.ts", "**/*.tsx"],

		rules: {
			"import/no-unresolved": "off",
			"react/jsx-no-useless-fragment": "off",
		},
	}, {
		files: ["**/*.js", "**/*.jsx"],
		rules: {},
	}
]);
