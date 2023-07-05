// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'fs';
import * as path from 'path';

import { Logger } from '@jvalue/jayvee-execution';
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { DiagnosticSeverity } from 'vscode-languageserver-protocol';
import { URI } from 'vscode-uri';

export enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
}

export async function extractDocumentFromFile(
  fileName: string,
  services: LangiumServices,
  logger: Logger,
): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions;
  if (!extensions.includes(path.extname(fileName))) {
    const errorMessage = `Please choose a file with ${
      extensions.length === 1 ? 'this extension' : 'one of these extensions'
    }: ${extensions.map((extension) => `"${extension}"`).join(',')}`;

    logger.logErr(errorMessage);
    process.exit(ExitCode.FAILURE);
  }

  if (!fs.existsSync(fileName)) {
    logger.logErr(`File ${fileName} does not exist.`);
    process.exit(ExitCode.FAILURE);
  }

  const document =
    services.shared.workspace.LangiumDocuments.getOrCreateDocument(
      URI.file(path.resolve(fileName)),
    );
  return await validateDocument(document, services, logger);
}

export async function extractDocumentFromString(
  modelString: string,
  services: LangiumServices,
  logger: Logger,
): Promise<LangiumDocument> {
  const document = services.shared.workspace.LangiumDocumentFactory.fromString(
    modelString,
    URI.parse('memory://jayvee.document'),
  );
  return await validateDocument(document, services, logger);
}

export async function validateDocument(
  document: LangiumDocument,
  services: LangiumServices,
  logger: Logger,
): Promise<LangiumDocument> {
  await services.shared.workspace.DocumentBuilder.build([document], {
    validationChecks: 'all',
  });

  const diagnostics = document.diagnostics ?? [];

  const errDiagnostics = diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error,
  );
  if (errDiagnostics.length > 0) {
    for (const errDiagnostic of errDiagnostics) {
      logger.logLanguageServerDiagnostic(errDiagnostic, document);
    }
    process.exit(ExitCode.FAILURE);
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
  fileName: string,
  services: LangiumServices,
  logger: Logger,
): Promise<T> {
  return (await extractDocumentFromFile(fileName, services, logger)).parseResult
    .value as T;
}
