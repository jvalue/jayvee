// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
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

describe('References to imported elements outside of the working directory', () => {
  const WORKING_DIR = path.resolve(
    __dirname,
    '../../test/assets/import-dynamic-reference/models', // use the "deep" directory as working dir to avoid loading the "higher" dir
  );
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

  const validCases: [string, string][] = [
    // [test name, test file path]
    [
      'should resolve reference to imported element',
      'valid-import-from-outside-workdir.jv',
    ],
  ];
  test.each(validCases)('%s', async (_, relativeTestFilePath) => {
    const model = await parseModel(relativeTestFilePath);

    expect(model.pipelines.length).toEqual(1); // file contains one pipeline
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const blocks = model.pipelines[0]!.blocks;
    expect(blocks.length).toEqual(1); // pipeline contains one block
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const reference = blocks[0]!.type; // of an imported block type

    expect(reference.ref).toBeDefined();
  });

  const invalidCases: [string, string][] = [
    // [test name, test file path]
    [
      'should not resolve reference to file with no jv extension',
      'invalid-import-wrong-file-type.jv',
    ],
    [
      'should not resolve reference to file that does not exist',
      'invalid-import-not-existing-file.jv',
    ],
  ];
  test.each(invalidCases)('%s', async (_, relativeTestFilePath) => {
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
