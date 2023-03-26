// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Logger } from '@jvalue/execution';

import { DefaultLogger } from './default-logger';

export class LoggerFactory {
  constructor(private readonly enableDebugLogging: boolean) {}

  createLogger(loggingContext?: string): Logger {
    return new DefaultLogger(this.enableDebugLogging, loggingContext);
  }
}
