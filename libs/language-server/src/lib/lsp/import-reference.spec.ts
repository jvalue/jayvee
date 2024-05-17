// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import path from 'node:path';

import { NodeFileSystem } from 'langium/node';

import {
  type JayveeServices,
  createJayveeServices,
  isJayveeModel,
} from '../../lib';
import {
  expectNoParserAndLexerErrors,
  parseTestFileInWorkingDir,
} from '../../test';
import { type JayveeModel } from '../ast';

describe('References to imported elements', () => {
  const WORKING_DIR = path.resolve(__dirname, '../../test/assets/');
  let services: JayveeServices;

  async function parseModel(
    relativeTestFilePath: string,
  ): Promise<JayveeModel> {
    const document = await parseTestFileInWorkingDir(
      WORKING_DIR,
      relativeTestFilePath,
      services,
    );
    expectNoParserAndLexerErrors(document);

    const parsedModel = document.parseResult.value;
    assert(isJayveeModel(parsedModel), 'Test file is not valid Jayvee model');
    return parsedModel;
  }

  beforeEach(() => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
  });

  it('should resolve reference to imported element', async () => {
    const relativeTestFilePath =
      'import-published-references/valid-reference-to-imported-element.jv';

    const model = await parseModel(relativeTestFilePath);

    expect(model.pipelines.length).toEqual(1); // file contains one pipeline
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const blocks = model.pipelines[0]!.blocks;
    expect(blocks.length).toEqual(1); // pipeline contains one block
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const reference = blocks[0]!.type; // of an imported block type

    expect(reference.ref).toBeDefined();
  });

  it('should resolve reference to transitively imported element', async () => {
    const relativeTestFilePath =
      'import-published-references/valid-reference-to-element-transitive.jv';

    const model = await parseModel(relativeTestFilePath);

    expect(model.pipelines.length).toEqual(1); // file contains one pipeline
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const blocks = model.pipelines[0]!.blocks;
    expect(blocks.length).toEqual(1); // pipeline contains one block
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const reference = blocks[0]!.type; // of an imported block type

    expect(reference.ref).toBeDefined();
  });

  it('should not resolve reference to non-existing element', async () => {
    const relativeTestFilePath =
      'import-published-references/invalid-reference-to-not-existing-element.jv';

    const model = await parseModel(relativeTestFilePath);

    expect(model.pipelines.length).toEqual(1); // file contains one pipeline
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const blocks = model.pipelines[0]!.blocks;
    expect(blocks.length).toEqual(1); // pipeline contains one block
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const reference = blocks[0]!.type; // of an imported block type

    expect(reference.ref).toBeUndefined();
  });

  it('should not resolve reference to non-imported element', async () => {
    const relativeTestFilePath =
      'import-published-references/invalid-reference-to-not-imported-element.jv';

    const model = await parseModel(relativeTestFilePath);

    expect(model.pipelines.length).toEqual(1); // file contains one pipeline
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const blocks = model.pipelines[0]!.blocks;
    expect(blocks.length).toEqual(1); // pipeline contains one block
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const reference = blocks[0]!.type; // of an imported block type

    expect(reference.ref).toBeUndefined();
  });
});
