// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DiagnosticSeverity } from './logger';

interface LogEntry {
  severity: DiagnosticSeverity;
  message: string;
}

export class LogCache {
  private logCacheMaxSize: number;
  private logs: LogEntry[] = [];

  constructor(maxCacheSize = Number.POSITIVE_INFINITY) {
    if (maxCacheSize <= 0) {
      throw new Error('maxCacheSize needs to be greater than 0');
    }
    this.logCacheMaxSize = maxCacheSize;
  }

  public insertLogMessage(message: string, severity: DiagnosticSeverity) {
    this.logs.push({ message, severity });
    this.removeOldestLogsIfSizeExceeded();
  }

  removeOldestLogsIfSizeExceeded() {
    if (this.logs.length > this.logCacheMaxSize) {
      this.logs = this.logs.slice(0, 1);
    }
  }

  public getLogMessages(): string[] {
    return this.logs.map((e) => e.message);
  }

  public getLogsFilteredBySeverity(
    severity: DiagnosticSeverity | DiagnosticSeverity[],
  ): {
    [key in DiagnosticSeverity]: string[];
  } {
    const ret = {
      [DiagnosticSeverity.ERROR]: [] as string[],
      [DiagnosticSeverity.HINT]: [] as string[],
      [DiagnosticSeverity.INFO]: [] as string[],
      [DiagnosticSeverity.WARNING]: [] as string[],
      [DiagnosticSeverity.DEBUG]: [] as string[],
    };
    const severities: DiagnosticSeverity[] = [];
    if (Array.isArray(severity)) {
      severities.push(...severity);
    } else {
      severities.push(severity);
    }
    for (const s of severities) {
      ret[s] = this.logs
        .filter((log) => log.severity === s)
        .map((s) => s.message);
    }

    return ret;
  }

  public clearLogs(): void {
    this.logs = [];
  }
}
