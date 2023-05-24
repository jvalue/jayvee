// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'fs';
import * as path from 'path';

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { JayveeServices, createJayveeServices, useExtension } from '../lib';

import { ValidationResult, validationHelper } from './utils';

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

  it('valid cars.jv', async () => {
    const text = readFileSync(
      path.resolve(__dirname, '../../../../example/cars.jv'),
      'utf-8',
    );

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });

  it('valid gas.jv', async () => {
    const text = readFileSync(
      path.resolve(__dirname, '../../../../example/gas.jv'),
      'utf-8',
    );

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });

  it('valid gtfs-rt-simple.jv', async () => {
    const text = readFileSync(
      path.resolve(__dirname, '../../../../example/gtfs-rt-simple.jv'),
      'utf-8',
    );

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });

  it('valid gtfs-static-and-rt.jv', async () => {
    const text = readFileSync(
      path.resolve(__dirname, '../../../../example/gtfs-static-and-rt.jv'),
      'utf-8',
    );

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });

  it('valid gtfs-static.jv', async () => {
    const text = readFileSync(
      path.resolve(__dirname, '../../../../example/gtfs-static.jv'),
      'utf-8',
    );

    // Validate input
    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;
    // Expect 0 errors
    expect(diagnostics).toHaveLength(0);
  });
});
