// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as chalk from 'chalk';
import { LangiumDocument } from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';
import { Range } from 'vscode-languageserver';
import { uinteger } from 'vscode-languageserver-types';

import { DiagnosticSeverity, Logger } from '../src/lib';

interface ClearLogsOptions {
  clearInfo: boolean;
  clearError: boolean;
  clearDebug: boolean;
  clearDiagnostic: boolean;
}

export class TestLogger extends Logger {
  private readonly TAB_TO_SPACES = 4;

  private infoLogs: string[] = [];
  private errorLogs: string[] = [];
  private debugLogs: string[] = [];
  private diagnosticLogs: string[] = [];

  constructor(
    private readonly enableDebugLogging: boolean,
    private loggingContext?: string,
    private printLogs: boolean = true,
  ) {
    super();
  }

  getLogs(): {
    infoLogs: string[];
    errorLogs: string[];
    debugLogs: string[];
    diagnosticLogs: string[];
  } {
    return {
      infoLogs: Array.from(this.infoLogs),
      errorLogs: Array.from(this.errorLogs),
      debugLogs: Array.from(this.debugLogs),
      diagnosticLogs: Array.from(this.diagnosticLogs),
    };
  }

  clearLogs(
    options: ClearLogsOptions = {
      clearInfo: true,
      clearDebug: true,
      clearError: true,
      clearDiagnostic: true,
    },
  ): void {
    if (options.clearInfo) {
      this.infoLogs = [];
    }
    if (options.clearError) {
      this.errorLogs = [];
    }
    if (options.clearDebug) {
      this.debugLogs = [];
    }
    if (options.clearDiagnostic) {
      this.diagnosticLogs = [];
    }
  }

  override logInfo(message: string): void {
    const msg = `${chalk.bold(this.getContext())}${message}`;
    this.infoLogs.push(msg);
    if (this.printLogs) {
      console.log(msg);
    }
  }

  override logDebug(message: string): void {
    if (this.enableDebugLogging) {
      const msg = `${chalk.bold(this.getContext())}${message}`;
      this.debugLogs.push(msg);
      if (this.printLogs) {
        console.log(msg);
      }
    }
  }

  override logErr(message: string): void {
    const msg = `${chalk.bold(this.getContext())}${chalk.red(message)}`;
    this.errorLogs.push(msg);
    if (this.printLogs) {
      console.error(msg);
    }
  }

  override setLoggingContext(loggingContext: string | undefined) {
    this.loggingContext = loggingContext;
  }

  private getContext(): string {
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
    const printFn = (msg: string) => {
      const basePrintFn = this.inferPrintFunction(severity);

      this.diagnosticLogs.push(msg);
      if (this.printLogs) {
        basePrintFn(msg);
      }
    };
    const colorFn = this.inferChalkColor(severity);

    this.logDiagnosticMessage(severity, message, printFn, colorFn);
    this.logDiagnosticInfo(range, document, printFn, colorFn);
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

  private logDiagnosticInfo(
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
      `In ${document.uri.path}:${startLineNumber}:${range.start.character + 1}`,
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
      case DiagnosticSeverity.ERROR:
        return console.error;
      case DiagnosticSeverity.WARNING:
        return console.warn;
      case DiagnosticSeverity.INFO:
      case DiagnosticSeverity.HINT:
        return console.info;
      default:
        assertUnreachable(severity);
    }
  }

  private inferChalkColor(
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
      default:
        assertUnreachable(severity);
    }
  }
}
