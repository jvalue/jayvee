// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import js from '@eslint/js';
import nxEslintPlugin from '@nx/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginUnicorn from 'eslint-plugin-unicorn';
import vitest from 'eslint-plugin-vitest';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import tseslint from 'typescript-eslint';

/** @type { import("eslint").Linter.Config[] } */
export default [
  {
    ignores: ['**/dist'],
  },
  js.configs.recommended,
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  ...tseslint.configs.recommendedTypeChecked,
  prettierRecommended,
  {
    files: ['*.js'],
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['*.js'],
    rules: {
      'prettier/prettier': 'warn',

      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-member-accessibility': [
        'error',
        {
          accessibility: 'no-public',
        },
      ],
      '@typescript-eslint/member-ordering': [
        'warn',
        {
          classes: ['field', 'constructor', 'method'],
        },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: ['class', 'interface', 'typeAlias'],
          format: ['PascalCase'],
        },
      ],
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/prefer-for-of': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'warn',

      'accessor-pairs': 'error',
      'array-callback-return': 'error',
      curly: 'error',
      'default-case-last': 'error',
      'default-param-last': 'error',
      'dot-notation': 'warn',
      eqeqeq: ['error', 'always', { null: 'never' }],
      'guard-for-in': 'error',
      'no-constructor-return': 'error',
      'no-else-return': 'error',
      'no-extra-bind': 'error',
      'no-lone-blocks': 'error',
      'no-new-wrappers': 'error',
      'no-nested-ternary': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'parseInt', message: `Use 'Number.parseInt()' instead.` },
        { name: 'parseFloat', message: `Use 'Number.parseFloat()' instead.` },
      ],
      'no-self-compare': 'error',
      'no-throw-literal': 'error',
      'no-useless-rename': 'error',
      'no-useless-return': 'error',
      'import/first': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-cycle': 'error',
      'import/no-unresolved': ['error'],
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
          warnOnUnassignedImports: true,
        },
      ],
      'no-unreachable-loop': 'error',
      radix: 'error',
      'require-atomic-updates': 'error',
      'sort-imports': [
        'warn',
        {
          ignoreDeclarationSort: true,
        },
      ],
      'spaced-comment': ['warn', 'always'],
      'valid-typeof': [
        'error',
        {
          requireStringLiterals: true,
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    plugins: {
      '@stylistic': stylistic,
      unicorn: eslintPluginUnicorn,
    },
    rules: {
      'import/no-unresolved': 'off',
      '@stylistic/no-extra-semi': 'error',
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
  {
    plugins: {
      '@nx': nxEslintPlugin,
    },
  },
  ...nxEslintPlugin.configs['flat/typescript'],
  ...nxEslintPlugin.configs['flat/javascript'],
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.spec.js', '**/*.spec.jsx'],
    plugins: { vitest: vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      '@typescript-eslint/unbound-method': 'off',
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
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.mjs'],
        },
      },
    },
  },
  {
    ignores: [
      '# SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg',
      '#',
      '# SPDX-License-Identifier: AGPL-3.0-only',
    ],
  },
];
