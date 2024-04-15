// SPDX-FileCopyrightText: 2021 TypeFox GmbH
//
// SPDX-License-Identifier: MIT
//
/**
 * The content of this file was copied from the official langium github repo
 * https://github.com/langium/langium/blob/main/packages/langium/src/test/langium-test.ts
 */
import {
  type AstNode,
  type BuildOptions,
  type LangiumDocument,
  type LangiumServices,
} from 'langium';
import { type Diagnostic } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import { initializeWorkspace } from '../lib/builtin-library/jayvee-workspace-manager';

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
    await initializeWorkspace(services);
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
