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

  describe('when element is directly published in element definition', () => {
    const validCases: [string, string][] = [
      // [test name, test file path]
      [
        'should resolve reference to imported element',
        'import-published-references/published-via-element-definition/valid-reference-to-imported-element.jv',
      ],
      [
        'should resolve reference to transitively imported element',
        'import-published-references/published-via-element-definition/valid-reference-to-element-transitive.jv',
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
        'should not resolve reference to non-existing element',
        'import-published-references/published-via-element-definition/invalid-reference-to-not-existing-element.jv',
      ],
      [
        'should not resolve reference to non-imported element',
        'import-published-references/published-via-element-definition/invalid-reference-to-not-imported-element.jv',
      ],
      [
        'should not resolve reference to not re-published transitive element',
        'import-published-references/published-via-element-definition/invalid-reference-to-element-transitive-no-republish.jv',
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

  describe('when element is published delayed via export definition', () => {
    const validCases: [string, string][] = [
      // [test name, test file path]
      [
        'should resolve reference to imported element',
        'import-published-references/published-via-publish-definition/valid-reference-to-imported-element.jv',
      ],
      [
        'should resolve reference to transitively imported element',
        'import-published-references/published-via-publish-definition/valid-reference-to-element-transitive.jv',
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
        'should not resolve reference to non-existing element',
        'import-published-references/published-via-publish-definition/invalid-reference-to-not-existing-element.jv',
      ],
      [
        'should not resolve reference to non-imported element',
        'import-published-references/published-via-publish-definition/invalid-reference-to-not-imported-element.jv',
      ],
      [
        'should not resolve reference to not re-published transitive element',
        'import-published-references/published-via-publish-definition/invalid-reference-to-element-transitive-no-republish.jv',
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
});
