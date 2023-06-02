// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'fs';
import * as path from 'path';

import {
  JayveeServices,
  ValidationResult,
  createJayveeServices,
  useExtension,
  validationHelper,
} from '@jvalue/jayvee-language-server';
import { AstNode } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { StdLangExtension } from './extension';

describe('jv example tests', () => {
  let services: JayveeServices;
  let validate: (input: string) => Promise<ValidationResult<AstNode>>;

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    // Create validation helper for language services
    validate = validationHelper(services);
  });

  it.each([
    'cars.jv',
    'gas.jv',
    'gtfs-rt-simple.jv',
    'gtfs-static-and-rt.jv',
    'gtfs-static.jv',
  ])('valid %s', async (file: string) => {
    const text = readFileSync(
      path.resolve(__dirname, '../../../../../example/', file),
      'utf-8',
    );

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });
});
