// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as chalk from 'chalk';
import { type LangiumDocument } from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';
import { type Range } from 'vscode-languageserver';
import { uinteger } from 'vscode-languageserver-types';

import { DiagnosticSeverity, Logger } from './logger';

export class DefaultLogger extends Logger {
  private readonly TAB_TO_SPACES = 4;

  constructor(
    protected readonly enableDebugLogging: boolean,
    protected loggingContext?: string,
    protected depth = 0,
  ) {
    super();
  }

  override logInfo(message: string): void {
    console.log(
      `${this.getDepthTabs()}${chalk.bold(this.getContext())}${message}`,
    );
  }

  override logDebug(message: string): void {
    if (this.enableDebugLogging) {
      console.log(
        `${this.getDepthTabs()}${chalk.bold(this.getContext())}${message}`,
      );
    }
  }

  override logErr(message: string): void {
    console.error(
      `${this.getDepthTabs()}${chalk.bold(this.getContext())}${chalk.red(
        message,
      )}`,
    );
  }

  override setLoggingContext(loggingContext: string | undefined) {
    this.loggingContext = loggingContext;
  }

  override setLoggingDepth(depth: number): void {
    this.depth = depth;
  }

  private getDepthTabs(): string {
    return '\t'.repeat(this.depth);
  }

  protected getContext(): string {
    return this.loggingContext !== undefined
      ? chalk.grey(`[${this.loggingContext}] `)
      : '';
  }

  protected override logDiagnostic(
    severity: DiagnosticSeverity,
    message: string,
    range: Range,
    document: LangiumDocument,
  ) {
    const printFn = this.inferPrintFunction(severity);
    const colorFn = this.inferChalkColor(severity);

    this.logDiagnosticMessage(severity, message, printFn, colorFn);
    this.logDiagnosticInfo(range, document, printFn, colorFn);
    printFn('');
  }

  protected logDiagnosticMessage(
    severityName: string,
    message: string,
    printFn: (message: string) => void,
    colorFn: (message: string) => string,
  ) {
    printFn(
      `${this.getDepthTabs()}${chalk.bold(colorFn(severityName))}: ${message}`,
    );
  }

  protected logDiagnosticInfo(
    range: Range,
    document: LangiumDocument,
    printFn: (message: string) => void,
    colorFn: (message: string) => string,
  ): void {
    const startLineNumber = range.start.line + 1;
    const endLineNumber = range.end.line + 1;

    const fullRange: Range = {
      start: {
        line: range.start.line,
        character: 0,
      },
      end: {
        line: range.end.line,
        character: uinteger.MAX_VALUE,
      },
    };
    const text = document.textDocument.getText(fullRange).trimEnd();
    const lines = text.split('\n');

    const lineNumberLength = Math.floor(Math.log10(endLineNumber)) + 1;

    printFn(
      `${this.getDepthTabs()}$In ${document.uri.path}:${startLineNumber}:${
        range.start.character + 1
      }`,
    );
    lines.forEach((line, i) => {
      const lineNumber = startLineNumber + i;
      const paddedLineNumber = String(lineNumber).padStart(
        lineNumberLength,
        ' ',
      );
      printFn(
        `${this.getDepthTabs()}${chalk.grey(
          `${paddedLineNumber} |`,
        )} ${line.replace(/\t/g, ' '.repeat(this.TAB_TO_SPACES))}`,
      );

      let underlineFrom = 0;
      let underlineTo = line.length;
      if (lineNumber === startLineNumber) {
        underlineFrom = range.start.character;
      }
      if (lineNumber === endLineNumber) {
        underlineTo = range.end.character;
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
        `${this.getDepthTabs()}${chalk.grey(
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

  protected inferPrintFunction(
    severity: DiagnosticSeverity,
  ): (message: string) => void {
    switch (severity) {
      case DiagnosticSeverity.ERROR:
        return console.error;
      case DiagnosticSeverity.WARNING:
        return console.warn;
      case DiagnosticSeverity.INFO:
      case DiagnosticSeverity.HINT:
      case DiagnosticSeverity.DEBUG:
        return console.info;
      default:
        assertUnreachable(severity);
    }
  }

  protected inferChalkColor(
    severity: DiagnosticSeverity,
  ): (message: string) => string {
    switch (severity) {
      case DiagnosticSeverity.ERROR:
        return chalk.red;
      case DiagnosticSeverity.WARNING:
        return chalk.yellow;
      case DiagnosticSeverity.INFO:
        return chalk.green;
      case DiagnosticSeverity.HINT:
        return chalk.blue;
      case DiagnosticSeverity.DEBUG:
        return chalk.grey;
      default:
        assertUnreachable(severity);
    }
  }
}
