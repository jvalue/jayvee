// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
// / <reference types='vitest' />
import { defineConfig } from 'vite';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/libs/language-server',

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  plugins: [nxViteTsPaths()],

  test: {
    globals: true,
    cacheDir: '../../node_modules/.vitest',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/libs/language-server',
      provider: 'v8',
    },
  },
});
