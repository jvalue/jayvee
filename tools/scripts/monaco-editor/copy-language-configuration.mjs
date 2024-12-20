// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { copyFile } from 'node:fs/promises';
import { join } from 'node:path';

import { getSourcePath } from '../shared-util.mjs';

const confVscode = join(
  getSourcePath('vs-code-extension'),
  '..',
  'assets',
  'language-configuration.json',
);

const confMonaco = join(
  getSourcePath('monaco-editor'),
  'lib',
  'language-configuration.json',
);

await copyFile(confVscode, confMonaco);
