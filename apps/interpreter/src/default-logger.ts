import { strict as assert } from 'assert';

import { Logger, Severity } from '@jayvee/execution';
import * as chalk from 'chalk';
import {
  AstNode,
  DiagnosticInfo,
  LangiumDocument,
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
import { uinteger } from 'vscode-languageserver-types';

export class DefaultLogger implements Logger {
  private readonly TAB_TO_SPACES = 4;

  constructor(private readonly debug: boolean) {}

  logErr<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void {
    this.log(Severity.ERROR, message, diagnostic);
  }

  logHint<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void {
    this.log(Severity.HINT, message, diagnostic);
  }

  logInfo<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void {
    this.log(Severity.INFO, message, diagnostic);
  }

  logWarn<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void {
    this.log(Severity.WARNING, message, diagnostic);
  }

  public log<N extends AstNode>(
    severity: Severity,
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ) {
    if (severity === Severity.INFO && !this.debug) {
      return;
    }

    const diagnosticSeverity = toDiagnosticSeverity(severity);

    if (diagnostic === undefined) {
      const printFn = this.inferPrintFunction(diagnosticSeverity);
      const colorFn = this.inferChalkColor(diagnosticSeverity);
      this.logMessage(diagnosticSeverity, message, printFn, colorFn);
      return;
    }

    const document = getDocument(diagnostic.node);

    /**
     * @see {@link DefaultDocumentValidator.toDiagnostic}
     */
    const lspDiagnostic = {
      message,
      range: getDiagnosticRange(diagnostic),
      severity: diagnosticSeverity,
      code: diagnostic.code,
      codeDescription: diagnostic.codeDescription,
      tags: diagnostic.tags,
      relatedInformation: diagnostic.relatedInformation,
      data: diagnostic.data,
      source: document.textDocument.languageId,
    } as LspDiagnostic;
    this.logLspDiagnostic(lspDiagnostic, document);
  }

  public logLspDiagnostic(
    diagnostic: LspDiagnostic,
    document: LangiumDocument,
  ): void {
    assert(
      diagnostic.severity !== undefined,
      'The diagnostic severity is assumed to always be present',
    );
    const printFn = this.inferPrintFunction(diagnostic.severity);
    const colorFn = this.inferChalkColor(diagnostic.severity);

    this.logMessage(diagnostic.severity, diagnostic.message, printFn, colorFn);
    this.logDiagnosticInfo(diagnostic.range, document, printFn, colorFn);
    printFn('');
  }

  private logMessage(
    severity: DiagnosticSeverity,
    message: string,
    printFn: (message: string) => void,
    colorFn: (message: string) => string,
  ) {
    printFn(
      chalk.bold(`${colorFn(this.inferSeverityName(severity))}: ${message}`),
    );
  }

  private inferSeverityName(severity: DiagnosticSeverity): string {
    switch (severity) {
      case DiagnosticSeverity.Error:
        return 'error';
      case DiagnosticSeverity.Warning:
        return 'warning';
      case DiagnosticSeverity.Information:
        return 'info';
      case DiagnosticSeverity.Hint:
        return 'hint';
      default:
        assertUnreachable(severity);
    }
  }

  private logDiagnosticInfo(
    diagnosticRange: Range,
    document: LangiumDocument,
    printFn: (message: string) => void,
    colorFn: (message: string) => string,
  ): void {
    const startLineNumber = diagnosticRange.start.line + 1;
    const endLineNumber = diagnosticRange.end.line + 1;

    const fullRange: Range = {
      start: {
        line: diagnosticRange.start.line,
        character: 0,
      },
      end: {
        line: diagnosticRange.end.line,
        character: uinteger.MAX_VALUE,
      },
    };
    const text = document.textDocument.getText(fullRange).trimEnd();
    const lines = text.split('\n');

    const lineNumberLength = Math.floor(Math.log10(endLineNumber)) + 1;

    printFn(
      `In ${document.uri.path}:${startLineNumber}:${
        diagnosticRange.start.character + 1
      }`,
    );
    lines.forEach((line, i) => {
      const lineNumber = startLineNumber + i;
      const paddedLineNumber = String(lineNumber).padStart(
        lineNumberLength,
        ' ',
      );
      printFn(
        `${chalk.grey(`${paddedLineNumber} |`)} ${line.replace(
          /\t/g,
          ' '.repeat(this.TAB_TO_SPACES),
        )}`,
      );

      let underlineFrom = 0;
      let underlineTo = line.length;
      if (lineNumber === startLineNumber) {
        underlineFrom = diagnosticRange.start.character;
      }
      if (lineNumber === endLineNumber) {
        underlineTo = diagnosticRange.end.character;
      }

      const underlineIndent = this.repeatCharAccordingToString(
        ' ',
        line.substring(0, underlineFrom),
        this.TAB_TO_SPACES,
      );
      const underline = this.repeatCharAccordingToString(
        '^',
        line.substring(underlineFrom, underlineTo),
        this.TAB_TO_SPACES,
      );

      printFn(
        `${chalk.grey(
          `${' '.repeat(lineNumberLength)} |`,
        )} ${underlineIndent}${colorFn(underline)}`,
      );
    });
  }

  /**
   * Repeats {@link charToRepeat} as many times as {@link accordingTo} is long.
   * For each occurrence of \t in {@link accordingTo},
   * {@link charToRepeat} is repeated {@link tabRepeats} times instead of once.
   */
  private repeatCharAccordingToString(
    charToRepeat: string,
    accordingTo: string,
    tabRepeats: number,
  ): string {
    return Array.from(accordingTo).reduce((prev, cur) => {
      const repeatedChar =
        cur === '\t' ? charToRepeat.repeat(tabRepeats) : charToRepeat;
      return `${prev}${repeatedChar}`;
    }, '');
  }

  private inferPrintFunction(
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

  private inferChalkColor(
    severity: DiagnosticSeverity,
  ): (message: string) => string {
    switch (severity) {
      case DiagnosticSeverity.Error:
        return chalk.red;
      case DiagnosticSeverity.Warning:
        return chalk.yellow;
      case DiagnosticSeverity.Information:
        return chalk.green;
      case DiagnosticSeverity.Hint:
        return chalk.blue;
      default:
        assertUnreachable(severity);
    }
  }
}
