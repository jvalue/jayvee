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

import { TabularLangExtension } from '../extension';

describe('Validation of CellWriterMetaInformation', () => {
  let validate: (input: string) => Promise<ValidationResult<AstNode>>;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/',
  );

  beforeAll(() => {
    // Register std extension
    useExtension(new TabularLangExtension());
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Create validation helper for language services
    validate = validationHelper(services);
  });

  it('should diagnose error on wrong dimension for at parameter', async () => {
    const text = readJvTestAsset(
      'cell-writer-meta-inf/invalid-wrong-at-dimension.jv',
    );

    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).toHaveLength(1);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'The cell range needs to be one-dimensional',
        }),
      ]),
    );
  });

  it('should diagnose error on number of write values does not match cell range', async () => {
    const text = readJvTestAsset(
      'cell-writer-meta-inf/invalid-write-length-does-not-match-cell-range.jv',
    );

    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).toHaveLength(2);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message:
            'The number of values to write (3) does not match the number of cells (4)',
        }),
        expect.objectContaining({
          message:
            'The number of values to write (3) does not match the number of cells (4)',
        }),
      ]),
    );
  });
});
