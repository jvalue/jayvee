import { AstNode, DiagnosticInfo } from 'langium';

export enum Severity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  HINT = 'hint',
}

export interface Logger {
  log<N extends AstNode>(
    severity: Severity,
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void;

  logErr<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void;

  logWarn<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void;

  logInfo<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void;

  logHint<N extends AstNode>(
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void;
}
