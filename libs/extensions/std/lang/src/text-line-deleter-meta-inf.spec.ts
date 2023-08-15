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

describe('Validation of TextLineDeleterMetaInformation', () => {
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

  it('should diagnose error on line parameter less or equal to zero', async () => {
    const text = readJvTestAsset(
      'text-line-deleter-meta-inf/invalid-line-less-or-equal-zero.jv',
    );

    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).toHaveLength(3);
    expect(diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: 'Line numbers need to be greater than zero',
        }),
      ]),
    );
  });

  it('should diagnose no error', async () => {
    const text = readJvTestAsset(
      'text-line-deleter-meta-inf/valid-postive-line-number.jv',
    );

    const validationResult = await validate(text);
    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).toHaveLength(0);
  });
});
