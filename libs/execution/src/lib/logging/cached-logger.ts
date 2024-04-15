// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as chalk from 'chalk';
import { type LangiumDocument } from 'langium';
import { type Range } from 'vscode-languageserver';

import { DefaultLogger } from './default-logger';
import { LogCache } from './log-cache';
import { DiagnosticSeverity, type LogEntry } from './logger';

export class CachedLogger extends DefaultLogger {
  protected logCache: LogCache;
  constructor(
    enableDebugLogging: boolean,
    loggingContext?: string,
    protected printLogs = true,
    depth = 0,
    cacheSize = 200,
  ) {
    super(enableDebugLogging, loggingContext, depth);
    this.logCache = new LogCache(cacheSize);
  }

  /**
   * Gets all log entries with the specified log levels.
   * If no log level given, returns logs on all log levels.
   */
  public getLogs(...logLevel: DiagnosticSeverity[]): readonly LogEntry[] {
    const filterLevels =
      logLevel.length === 0 ? Object.values(DiagnosticSeverity) : logLevel;
    return this.logCache
      .getLogs()
      .filter((log) => filterLevels.includes(log.severity));
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
