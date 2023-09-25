// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as chalk from 'chalk';
import { LangiumDocument } from 'langium';
import { Range } from 'vscode-languageserver';

import { DefaultLogger, DiagnosticSeverity } from '../src/lib';

import { LogCache } from './log-cache';

export class TestLogger extends DefaultLogger {
  private logCache: LogCache = new LogCache();
  constructor(
    enableDebugLogging: boolean,
    loggingContext?: string,
    private printLogs: boolean = true,
    depth = 0,
  ) {
    super(enableDebugLogging, loggingContext, depth);
  }

  public getLogs() {
    return this.logCache.getLogsFilteredBySeverity([
      DiagnosticSeverity.ERROR,
      DiagnosticSeverity.HINT,
      DiagnosticSeverity.INFO,
      DiagnosticSeverity.WARNING,
    ]);
  }

  public clearLogs(): void {
    this.logCache.clearLogs();
  }

  override logInfo(message: string): void {
    const msg = `${chalk.bold(this.getContext())}${message}`;
    this.logCache.insertLogMessage(msg, DiagnosticSeverity.INFO);
    this.printMessageToPrintFnIfEnabled(msg, console.log);
  }

  override logDebug(message: string): void {
    if (this.enableDebugLogging) {
      const msg = `${chalk.bold(this.getContext())}${message}`;
      this.logCache.insertLogMessage(msg, DiagnosticSeverity.DEBUG);
      this.printMessageToPrintFnIfEnabled(msg, console.log);
    }
  }

  override logErr(message: string): void {
    const msg = `${chalk.bold(this.getContext())}${chalk.red(message)}`;
    this.logCache.insertLogMessage(msg, DiagnosticSeverity.ERROR);
    this.printMessageToPrintFnIfEnabled(msg, console.error);
  }

  protected override logDiagnostic(
    severity: DiagnosticSeverity,
    message: string,
    range: Range,
    document: LangiumDocument,
  ) {
    const printFn = (msg: string) => {
      const basePrintFn = this.inferPrintFunction(severity);

      this.logCache.insertLogMessage(msg, severity);
      this.printMessageToPrintFnIfEnabled(msg, basePrintFn);
    };
    const colorFn = this.inferChalkColor(severity);

    this.logDiagnosticMessage(severity, message, printFn, colorFn);
    this.logDiagnosticInfo(range, document, printFn, colorFn);
    printFn('');
  }

  printMessageToPrintFnIfEnabled(
    message: string,
    printFn: (message: string) => void,
  ) {
    if (this.printLogs) {
      printFn(message);
    }
  }
}
