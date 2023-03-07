import * as fs from 'fs';
import * as path from 'path';

import { Logger } from '@jvalue/execution';
import { AstNode, LangiumDocument, LangiumServices } from 'langium';
import { DiagnosticSeverity } from 'vscode-languageserver-protocol';
import { URI } from 'vscode-uri';

export enum ExitCode {
  SUCCESS = 0,
  FAILURE = 1,
}

export async function extractDocument(
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

export async function extractAstNode<T extends AstNode>(
  fileName: string,
  services: LangiumServices,
  logger: Logger,
): Promise<T> {
  return (await extractDocument(fileName, services, logger)).parseResult
    .value as T;
}
