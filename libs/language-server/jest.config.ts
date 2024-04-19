// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// Modules throwing error "Jest encountered an unexpected token"
const esModules: string[] = ['langium'];

export default {
  displayName: 'language-server',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  transformIgnorePatterns: [
    `<rootDir>/node_modules/(?!.*\\.mjs$|${esModules.join('|')})`,
  ],
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/language-server',
  extensionsToTreatAsEsm: ['.ts'],
};
