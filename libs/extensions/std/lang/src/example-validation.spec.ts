// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readdirSync } from 'fs';
import * as path from 'path';

import {
  JayveeServices,
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  ValidationResult,
  readJvTestAssetHelper,
  validationHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { StdLangExtension } from './extension';

describe('jv example tests', () => {
  let services: JayveeServices;
  let validate: (input: string) => Promise<ValidationResult<AstNode>>;

  const baseDirPath = path.resolve(__dirname, '../../../../../example/');
  const readJvTestAsset = readJvTestAssetHelper(baseDirPath);

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    // Create validation helper for language services
    validate = validationHelper(services);
  });

  it.each(
    // Get all .jv files from example dir
    readdirSync(baseDirPath).filter((file) => path.extname(file) === '.jv'),
  )('valid %s', async (file: string) => {
    const text = readJvTestAsset(file);

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });
});
