// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'node:fs';
import path from 'node:path';

import { type Logger } from '@jvalue/jayvee-execution';
import {
  type JayveeServices,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import { type AstNode, type LangiumDocument, UriUtils } from 'langium';
import { type LangiumServices } from 'langium/lsp';
import { DiagnosticSeverity } from 'vscode-languageserver-protocol';
import { URI } from 'vscode-uri';

export enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
}

/**
 * Extracts a document from a file that contains a model.
 * Does load the directory of this document as the working directory.
 */
export async function extractDocumentFromFile(
  filePath: string,
  services: LangiumServices,
  logger: Logger,
): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions;
  if (!extensions.includes(path.extname(filePath))) {
    const errorMessage = `Please choose a file with ${
      extensions.length === 1 ? 'this extension' : 'one of these extensions'
    }: ${extensions.map((extension) => `"${extension}"`).join(',')}`;

    logger.logErr(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  if (!fs.existsSync(filePath)) {
    const errorMessage = `File ${filePath} does not exist.`;
    logger.logErr(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  const fileUri = getFileUriLikeLangiumImpl(filePath);
  const document =
    services.shared.workspace.LangiumDocuments.getDocument(fileUri);
  if (document === undefined) {
    const errorMessage = `Did not load file ${filePath} correctly.`;
    logger.logErr(errorMessage);
    return Promise.reject(new Error(errorMessage));
  }

  return await validateDocument(document, services, logger);
}

/**
 * Creates the URI for a file path in a way similar to Langium.
 * This is necessary to make sure that the document lookup works on Windows.
 * Fixed https://github.com/jvalue/jayvee/issues/623.
 * Workaround needs to be removed once the issue is fixed in Langium:
 * https://github.com/eclipse-langium/langium/issues/1725
 */
function getFileUriLikeLangiumImpl(filePath: string): URI {
  const folderPath = path.dirname(filePath);
  const folderUri = URI.parse(path.resolve(folderPath));
  const fileName = path.basename(filePath);
  return UriUtils.joinPath(folderUri, fileName);
}

/**
 * Extracts a document from a string that contains a model.
 * Does not load an additional working directory.
 */
export async function extractDocumentFromString(
  modelString: string,
  services: JayveeServices,
  logger: Logger,
): Promise<LangiumDocument> {
  const document = services.shared.workspace.LangiumDocumentFactory.fromString(
    modelString,
    URI.parse('memory://jayvee.document'),
  );

  await initializeWorkspace(services);

  return await validateDocument(document, services, logger);
}

export async function validateDocument(
  document: LangiumDocument,
  services: LangiumServices,
  logger: Logger,
): Promise<LangiumDocument> {
  await services.shared.workspace.DocumentBuilder.build([document], {
    validation: true,
  });

  const diagnostics = document.diagnostics ?? [];

  const errDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error,
  );
  if (errDiagnostics.length > 0) {
    for (const errDiagnostic of errDiagnostics) {
      logger.logLanguageServerDiagnostic(errDiagnostic, document);
    }
    return Promise.reject(new Error('Could not build document without errors'));
  }

  const nonErrDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.severity !== DiagnosticSeverity.Error,
  );
  for (const nonErrDiagnostic of nonErrDiagnostics) {
    logger.logLanguageServerDiagnostic(nonErrDiagnostic, document);
  }

  return document;
}

export async function extractAstNodeFromFile<T extends AstNode>(
  filePath: string,
  services: JayveeServices,
  logger: Logger,
): Promise<T> {
  return (await extractDocumentFromFile(filePath, services, logger)).parseResult
    .value as T;
}

export async function extractAstNodeFromString<T extends AstNode>(
  modelString: string,
  services: JayveeServices,
  logger: Logger,
): Promise<T> {
  return (await extractDocumentFromString(modelString, services, logger))
    .parseResult.value as T;
}
