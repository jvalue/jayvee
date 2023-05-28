// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assert } from 'console';
import { readFileSync } from 'fs';
import * as path from 'path';

import { AstNode, DiagnosticInfo, LangiumDocument } from 'langium';

import {
  BlockDefinition,
  ColumnId,
  ColumnLiteral,
  JayveeModel,
  PipeDefinition,
  PipelineDefinition,
  PropertyBody,
} from '../lib';

export const validationAcceptorMockImpl = <N extends AstNode>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  severity: 'error' | 'warning' | 'info' | 'hint',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: DiagnosticInfo<N>,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
) => {};

/**
 * Reads the jv test asset file with the given filename from the test/assets directory
 * @param testFileName asset filename containing jv code
 * @returns content of asset file
 */
export function readJvTestAsset(testFileName: string): string {
  const text = readFileSync(
    path.resolve(__dirname, './assets/', testFileName),
    'utf-8',
  );
  // Expect the test asset to contain something
  expect(text).not.toBe('');
  return text;
}

export function extractPipeline(
  document: LangiumDocument<AstNode>,
  pipelineIndex = 0,
): PipelineDefinition {
  expect(document.parseResult.parserErrors).toHaveLength(0);
  expect(document.parseResult.lexerErrors).toHaveLength(0);

  const model = document.parseResult.value as JayveeModel;

  return model.pipelines[pipelineIndex] as PipelineDefinition;
}

export function extractBlock(
  document: LangiumDocument<AstNode>,
  blockIndex = 0,
  pipelineIndex = 0,
): BlockDefinition {
  expect(document.parseResult.parserErrors).toHaveLength(0);
  expect(document.parseResult.lexerErrors).toHaveLength(0);

  const model = document.parseResult.value as JayveeModel;

  return model.pipelines[pipelineIndex]?.blocks[blockIndex] as BlockDefinition;
}

export function extractPipe(
  document: LangiumDocument<AstNode>,
  pipeIndex = 0,
  pipelineIndex = 0,
): PipeDefinition {
  expect(document.parseResult.parserErrors).toHaveLength(0);
  expect(document.parseResult.lexerErrors).toHaveLength(0);

  const model = document.parseResult.value as JayveeModel;

  return model.pipelines[pipelineIndex]?.pipes[pipeIndex] as PipeDefinition;
}

export function extractPropertyBodyFromBlock(
  document: LangiumDocument<AstNode>,
  blockIndex = 0,
  pipelineIndex = 0,
): PropertyBody {
  const block: BlockDefinition = extractBlock(
    document,
    blockIndex,
    pipelineIndex,
  );

  return block.body;
}

export function extractColumnIdFromBlockProperty(
  document: LangiumDocument<AstNode>,
  propertyIndex = 0,
  blockIndex = 0,
  pipelineIndex = 0,
): ColumnId {
  const blockBody: PropertyBody = extractPropertyBodyFromBlock(
    document,
    blockIndex,
    pipelineIndex,
  );

  const propertyValue = blockBody.properties[propertyIndex]?.value;
  assert(propertyValue !== undefined, 'Property not found!');
  return (propertyValue as ColumnLiteral).columnId;
}
