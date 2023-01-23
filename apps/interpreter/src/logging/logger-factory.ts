import { Logger } from '@jayvee/execution';

import { DefaultLogger } from './default-logger';

export class LoggerFactory {
  constructor(private readonly enableDebugLogging: boolean) {}

  createLogger(loggingContext?: string): Logger {
    return new DefaultLogger(this.enableDebugLogging, loggingContext);
  }
}
