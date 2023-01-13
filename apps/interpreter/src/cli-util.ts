import * as fs from 'fs';
import * as path from 'path';

import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

import { DefaultLogger } from './default-logger';

export enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
}

export async function extractDocument(
  fileName: string,
  services: LangiumServices,
  logger: DefaultLogger,
): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions;
  if (!extensions.includes(path.extname(fileName))) {
    const errorMessage = `Please choose a file with ${
      extensions.length === 1 ? 'this extension' : 'one of these extensions'
    }: ${extensions.map((extension) => `"${extension}"`).join(',')}`;

    logger.log('error', errorMessage);
    process.exit(ExitCode.FAILURE);
  }

  if (!fs.existsSync(fileName)) {
    logger.log('error', `File ${fileName} does not exist.`);
    process.exit(ExitCode.FAILURE);
  }

  const document =
    services.shared.workspace.LangiumDocuments.getOrCreateDocument(
      URI.file(path.resolve(fileName)),
    );
  await services.shared.workspace.DocumentBuilder.build([document], {
    validationChecks: 'all',
  });

  const validationErrors = (document.diagnostics ?? []).filter(
    (e) => e.severity === 1,
  );
  if (validationErrors.length > 0) {
    for (const validationError of validationErrors) {
      logger.logLspDiagnostic(validationError, document);
    }
    process.exit(ExitCode.FAILURE);
  }

  return document;
}

export async function extractAstNode<T extends AstNode>(
  fileName: string,
  services: LangiumServices,
  logger: DefaultLogger,
): Promise<T> {
  return (await extractDocument(fileName, services, logger)).parseResult
    .value as T;
}
