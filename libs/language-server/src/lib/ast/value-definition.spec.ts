// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { ParseHelperOptions, parseHelper } from '../../test/langium-utils';
import { readJvTestAssetHelper } from '../../test/utils';
import { createJayveeServices } from '../jayvee-module';

describe('Parsing of ValuetypeDefinition', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/',
  );

  beforeAll(() => {
    // TODO: fix tests after removing TestExtension
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    parse = parseHelper(services);
  });

  it('should diagnose error on missing builtin keyword', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-missing-builtin-keyword.jv',
    );

    const document = await parse(text);
    expect(document.parseResult.parserErrors.length).toBeGreaterThanOrEqual(1);
    expect(document.parseResult.parserErrors[0]?.message).toBe(
      "Expecting token of type 'oftype' but found `;`.",
    );
  });

  it('should diagnose error on unallowed body for builtin valuetypes', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-unallowed-builtin-body.jv',
    );

    const document = await parse(text);
    expect(document.parseResult.parserErrors.length).toBeGreaterThanOrEqual(1);
    expect(document.parseResult.parserErrors[0]?.message).toBe(
      "Expecting token of type ';' but found `{`.",
    );
  });

  it('should diagnose error on empty generic', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/invalid-missing-generic.jv',
    );

    const document = await parse(text);
    expect(document.parseResult.parserErrors.length).toBeGreaterThanOrEqual(1);
    expect(document.parseResult.parserErrors[0]?.message).toBe(
      "Expecting token of type 'ID' but found `>`.",
    );
  });

  it('should diagnose no error on generic', async () => {
    const text = readJvTestAsset(
      'valuetype-definition/valid-builtin-valuetype-generic.jv',
    );

    const document = await parse(text);
    expect(document.parseResult.parserErrors.length).toBe(0);
  });
});
