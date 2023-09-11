// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as chalk from 'chalk';
import { LangiumDocument } from 'langium';
import { Range } from 'vscode-languageserver';

import { DefaultLogger, DiagnosticSeverity } from '../src/lib';

export interface ClearLogsOptions {
  clearInfo: boolean;
  clearError: boolean;
  clearDebug: boolean;
  clearDiagnostic: boolean;
}

export class TestLogger extends DefaultLogger {
  private infoLogs: string[] = [];
  private errorLogs: string[] = [];
  private debugLogs: string[] = [];
  private diagnosticLogs: string[] = [];

  constructor(
    enableDebugLogging: boolean,
    loggingContext?: string,
    private printLogs: boolean = true,
    depth = 0,
  ) {
    super(enableDebugLogging, loggingContext, depth);
  }

  public getLogs(): {
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

  public clearLogs(
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
}
