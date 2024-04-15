// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type DiagnosticSeverity, type LogEntry } from './logger';

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

  public getLogs(): readonly LogEntry[] {
    return this.logs;
  }

  public clearLogs(): void {
    this.logs = [];
  }
}
