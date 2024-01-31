// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = {
  extends: ['plugin:@nx/react', '../../.eslintrc.json'],
  ignorePatterns: ['!**/*', '/*.*', 'src/lib/*.monarch.ts'],
  parserOptions: {
    project: ['./tsconfig.lib.json'],
    tsconfigRootDir: __dirname,
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx', '*.js', '*.jsx'],
      rules: {},
    },
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'import/no-unresolved': 'off',
        'react/jsx-no-useless-fragment': 'off',
      },
    },
    {
      files: ['*.js', '*.jsx'],
      rules: {},
    },
  ],
};
