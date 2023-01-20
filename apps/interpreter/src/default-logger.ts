import { strict as assert } from 'assert';

import { DiagnosticSeverity, Logger } from '@jayvee/execution';
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
  Diagnostic as LspDiagnostic,
  DiagnosticSeverity as LspDiagnosticSeverity,
  Range,
} from 'vscode-languageserver';
import { uinteger } from 'vscode-languageserver-types';

export class DefaultLogger extends Logger {
  private readonly TAB_TO_SPACES = 4;

  constructor(
    private readonly enableDebugLogging: boolean,
    private readonly loggingContext?: string,
  ) {
    super();
  }

  override logDebug(message: string): void {
    if (this.enableDebugLogging) {
      console.log(`${chalk.bold(this.getContext())}${message}`);
    }
  }

  override logErr(message: string): void {
    console.error(`${chalk.bold(this.getContext())}${chalk.red(message)}`);
  }

  private getContext(): string {
    return this.loggingContext !== undefined
      ? chalk.grey(`[${this.loggingContext}] `)
      : '';
  }

  protected override logDiagnostic<N extends AstNode>(
    severity: DiagnosticSeverity,
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ) {
    const diagnosticSeverity = toDiagnosticSeverity(severity);
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

    const severityName = this.inferSeverityName(diagnostic.severity);
    this.logDiagnosticMessage(
      severityName,
      diagnostic.message,
      printFn,
      colorFn,
    );
    this.logDiagnosticInfo(diagnostic.range, document, printFn, colorFn);
    printFn('');
  }

  private logDiagnosticMessage(
    severityName: string,
    message: string,
    printFn: (message: string) => void,
    colorFn: (message: string) => string,
  ) {
    printFn(`${chalk.bold(colorFn(severityName))}: ${message}`);
  }

  private inferSeverityName(severity: LspDiagnosticSeverity): string {
    switch (severity) {
      case LspDiagnosticSeverity.Error:
        return 'error';
      case LspDiagnosticSeverity.Warning:
        return 'warning';
      case LspDiagnosticSeverity.Information:
        return 'info';
      case LspDiagnosticSeverity.Hint:
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
    severity: LspDiagnosticSeverity,
  ): (message: string) => void {
    switch (severity) {
      case LspDiagnosticSeverity.Error:
        return console.error;
      case LspDiagnosticSeverity.Warning:
        return console.warn;
      case LspDiagnosticSeverity.Information:
      case LspDiagnosticSeverity.Hint:
        return console.info;
      default:
        assertUnreachable(severity);
    }
  }

  private inferChalkColor(
    severity: LspDiagnosticSeverity,
  ): (message: string) => string {
    switch (severity) {
      case LspDiagnosticSeverity.Error:
        return chalk.red;
      case LspDiagnosticSeverity.Warning:
        return chalk.yellow;
      case LspDiagnosticSeverity.Information:
        return chalk.green;
      case LspDiagnosticSeverity.Hint:
        return chalk.blue;
      default:
        assertUnreachable(severity);
    }
  }
}
