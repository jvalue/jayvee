import { strict as assert } from 'assert';
import * as fs from 'fs';
import * as path from 'path';

import { Diagnostic } from '@jayvee/execution';
import * as chalk from 'chalk';
import {
  AstNode,
  LangiumDocument,
  LangiumServices,
  getDiagnosticRange,
  getDocument,
  toDiagnosticSeverity,
} from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';
import {
  DiagnosticSeverity,
  Diagnostic as LspDiagnostic,
  Range,
} from 'vscode-languageserver';
import { URI } from 'vscode-uri';

export async function extractDocument(
  fileName: string,
  services: LangiumServices,
): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions;
  if (!extensions.includes(path.extname(fileName))) {
    console.error(
      chalk.yellow(
        `Please choose a file with one of these extensions: ${extensions.toString()}.`,
      ),
    );
    process.exit(1);
  }

  if (!fs.existsSync(fileName)) {
    console.error(chalk.red(`File ${fileName} does not exist.`));
    process.exit(1);
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
      logLspDiagnostic(validationError, document);
    }
    process.exit(1);
  }

  return document;
}

export async function extractAstNode<T extends AstNode>(
  fileName: string,
  services: LangiumServices,
): Promise<T> {
  return (await extractDocument(fileName, services)).parseResult.value as T;
}

export function logDiagnostic(diagnostic: Diagnostic) {
  const document = getDocument(diagnostic.info.node);
  const lspDiagnostic = {
    message: diagnostic.message,
    range: getDiagnosticRange(diagnostic.info),
    severity: toDiagnosticSeverity(diagnostic.severity),
    code: diagnostic.info.code,
    codeDescription: diagnostic.info.codeDescription,
    tags: diagnostic.info.tags,
    relatedInformation: diagnostic.info.relatedInformation,
    data: diagnostic.info.data,
    source: document.textDocument.languageId,
  } as LspDiagnostic;
  logLspDiagnostic(lspDiagnostic, document);
}

export function logLspDiagnostic(
  diagnostic: LspDiagnostic,
  document: LangiumDocument,
): void {
  assert(
    diagnostic.severity !== undefined,
    'The diagnostic severity is assumed to always be present',
  );
  const printFn = inferPrintFunction(diagnostic.severity);
  const colorFn = inferChalkColor(diagnostic.severity);
  printFn(
    chalk.bold(
      `${colorFn(inferSeverityName(diagnostic.severity))}: ${
        diagnostic.message
      }`,
    ),
  );

  const diagnosticRange = diagnostic.range;
  const startLineNumber = diagnosticRange.start.line + 1;
  const endLineNumber = diagnosticRange.end.line + 1;

  const fullRange: Range = {
    ...diagnosticRange,
    start: {
      ...diagnosticRange.start,
      character: 0,
    },
  };

  const text = document.textDocument.getText(fullRange);
  const lines = text.split('\n');

  const lineNumberLength = Math.floor(Math.log10(endLineNumber)) + 1;

  printFn(
    `In ${document.uri.path}:${startLineNumber}:${diagnosticRange.start.character}`,
  );
  lines.forEach((line, i) => {
    const paddedLineNumber = String(startLineNumber + i).padStart(
      lineNumberLength,
      ' ',
    );
    printFn(`${chalk.grey(`${paddedLineNumber} |`)} ${line}`);
  });
  printFn('');
}

function inferPrintFunction(
  severity: DiagnosticSeverity,
): (message: string) => void {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return console.error;
    case DiagnosticSeverity.Warning:
      return console.warn;
    case DiagnosticSeverity.Information:
    case DiagnosticSeverity.Hint:
      return console.info;
    default:
      assertUnreachable(severity);
  }
}

function inferChalkColor(
  severity: DiagnosticSeverity,
): (message: string) => string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return chalk.red;
    case DiagnosticSeverity.Warning:
      return chalk.yellow;
    case DiagnosticSeverity.Information:
      return chalk.gray;
    case DiagnosticSeverity.Hint:
      return chalk.blue;
    default:
      assertUnreachable(severity);
  }
}

function inferSeverityName(severity: DiagnosticSeverity): string {
  switch (severity) {
    case DiagnosticSeverity.Error:
      return 'error';
    case DiagnosticSeverity.Warning:
      return 'warning';
    case DiagnosticSeverity.Information:
      return 'information';
    case DiagnosticSeverity.Hint:
      return 'hint';
    default:
      assertUnreachable(severity);
  }
}
