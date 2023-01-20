import { AstNode, DiagnosticInfo } from 'langium';

export enum DiagnosticSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  HINT = 'hint',
}

export abstract class Logger {
  abstract logDebug(message: string): void;
  abstract logErr(message: string): void;

  protected abstract logDiagnostic<N extends AstNode>(
    severity: DiagnosticSeverity,
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void;

  logErrDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logDiagnostic(DiagnosticSeverity.ERROR, message, diagnostic);
  }

  logWarnDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logDiagnostic(DiagnosticSeverity.WARNING, message, diagnostic);
  }

  logInfoDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logDiagnostic(DiagnosticSeverity.INFO, message, diagnostic);
  }

  logHintDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logDiagnostic(DiagnosticSeverity.HINT, message, diagnostic);
  }
}
