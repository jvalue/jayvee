// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DefaultLogger, type Logger } from '@jvalue/jayvee-execution';

export class LoggerFactory {
  constructor(private readonly enableDebugLogging: boolean) {}

  createLogger(loggingContext?: string): Logger {
    return new DefaultLogger(this.enableDebugLogging, loggingContext);
  }
}
