/** ****************************************************************************
 * Copyright 2021 TypeFox GmbH
 * This program and the accompanying materials are made available under the
 * terms of the MIT License, which is available in the project root.
 ******************************************************************************/
/**
 * The content of this file was copied from the official langium github repo
 * https://github.com/langium/langium/blob/main/packages/langium/src/test/langium-test.ts
 */

import { assert } from 'console';

import {
  AstNode,
  BuildOptions,
  DiagnosticInfo,
  LangiumDocument,
  LangiumServices,
} from 'langium';
import { Diagnostic } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import {
  BlockDefinition,
  ColumnId,
  ColumnLiteral,
  JayveeModel,
  PipeDefinition,
  PipelineDefinition,
  PropertyBody,
} from '../lib';

export interface ParseHelperOptions extends BuildOptions {
  documentUri?: string;
}

export function parseHelper<T extends AstNode = AstNode>(
  services: LangiumServices,
): (
  input: string,
  options?: ParseHelperOptions,
) => Promise<LangiumDocument<T>> {
  const metaData = services.LanguageMetaData;
  const documentBuilder = services.shared.workspace.DocumentBuilder;
  return async (input, options) => {
    const randomNumber = Math.floor(Math.random() * 10000000) + 1000000;
    const uri = URI.parse(
      options?.documentUri ??
        `file:///${randomNumber}${metaData.fileExtensions[0] ?? ''}`,
    );
    const document =
      services.shared.workspace.LangiumDocumentFactory.fromString<T>(
        input,
        uri,
      );
    services.shared.workspace.LangiumDocuments.addDocument(document);
    await documentBuilder.build([document], options);
    return document;
  };
}

export interface ValidationResult<T extends AstNode = AstNode> {
  diagnostics: Diagnostic[];
  document: LangiumDocument<T>;
}

export function validationHelper<T extends AstNode = AstNode>(
  services: LangiumServices,
): (input: string) => Promise<ValidationResult<T>> {
  const parse = parseHelper<T>(services);
  return async (input) => {
    const document = await parse(input, { validationChecks: 'all' });
    return { document, diagnostics: document.diagnostics ?? [] };
  };
}

export const validationAcceptorMockImpl = <N extends AstNode>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  severity: 'error' | 'warning' | 'info' | 'hint',
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  info: DiagnosticInfo<N>,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
) => {};

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
