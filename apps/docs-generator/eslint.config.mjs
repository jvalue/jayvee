// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { defineConfig, globalIgnores } from "eslint/config";
import baseConfig from "../../eslint.config.mjs";

export default defineConfig(baseConfig, [globalIgnores(["!**/*"]), {
	languageOptions: {
		ecmaVersion: 5,
		sourceType: "script",

		parserOptions: {
			project: ["apps/docs-generator/tsconfig.app.json"],
		},
	},
}, {
	files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
	rules: {},
}, {
	files: ["**/*.ts", "**/*.tsx"],
	rules: {},
}, {
	files: ["**/*.js", "**/*.jsx"],
	rules: {},
}]);
