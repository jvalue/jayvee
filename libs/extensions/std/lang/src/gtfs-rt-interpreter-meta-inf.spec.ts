// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  TestLangExtension,
  ValidationResult,
  readJvTestAssetHelper,
  validationHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { StdLangExtension } from './extension';

describe('Validation of GtfsRTInterpreterMetaInformation', () => {
  let validate: (input: string) => Promise<ValidationResult<AstNode>>;

  const readJvTestAsset = readJvTestAssetHelper(__dirname, '../test/assets/');

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Create validation helper for language services
    validate = validationHelper(services);
  });

  it('should diagnose no error on valid entity parameter value', async () => {
    const text = readJvTestAsset(
      'gtfs-rt-interpreter-meta-inf/valid-valid-entity-param.jv',
    );

    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).toHaveLength(0);
  });

  it('should diagnose error on invalid entity parameter value', async () => {
    const text = readJvTestAsset(
      'gtfs-rt-interpreter-meta-inf/invalid-invalid-entity-param.jv',
    );

    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Entity must be "trip_update", "alert" or "vehicle"',
        }),
      ]),
    );
  });
});
