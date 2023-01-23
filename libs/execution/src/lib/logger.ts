import { strict as assert } from 'assert';

import {
  AstNode,
  DiagnosticInfo,
  LangiumDocument,
  getDiagnosticRange,
  getDocument,
} from 'langium';
import * as ls from 'vscode-languageserver';

export enum DiagnosticSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  HINT = 'hint',
}

export abstract class Logger {
  abstract logDebug(message: string): void;
  abstract logErr(message: string): void;

  protected abstract logDiagnostic(
    severity: DiagnosticSeverity,
    message: string,
    range: ls.Range,
    document: LangiumDocument,
  ): void;

  protected logLangiumDiagnostic<N extends AstNode>(
    severity: DiagnosticSeverity,
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ) {
    this.logDiagnostic(
      severity,
      message,
      getDiagnosticRange(diagnostic),
      getDocument(diagnostic.node),
    );
  }

  logErrDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logLangiumDiagnostic(DiagnosticSeverity.ERROR, message, diagnostic);
  }

  logWarnDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logLangiumDiagnostic(DiagnosticSeverity.WARNING, message, diagnostic);
  }

  logInfoDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logLangiumDiagnostic(DiagnosticSeverity.INFO, message, diagnostic);
  }

  logHintDiagnostic<N extends AstNode>(
    message: string,
    diagnostic: DiagnosticInfo<N>,
  ): void {
    this.logLangiumDiagnostic(DiagnosticSeverity.HINT, message, diagnostic);
  }

  logLanguageServerDiagnostic(
    lsDiagnostic: ls.Diagnostic,
    document: LangiumDocument,
  ) {
    assert(
      lsDiagnostic.severity !== undefined,
      'The diagnostic severity is assumed to be present',
    );

    this.logDiagnostic(
      this.toDiagnosticSeverity(lsDiagnostic.severity),
      lsDiagnostic.message,
      lsDiagnostic.range,
      document,
    );
  }

  private toDiagnosticSeverity(
    severity: ls.DiagnosticSeverity,
  ): DiagnosticSeverity {
    switch (severity) {
      case ls.DiagnosticSeverity.Error:
        return DiagnosticSeverity.ERROR;
      case ls.DiagnosticSeverity.Warning:
        return DiagnosticSeverity.WARNING;
      case ls.DiagnosticSeverity.Information:
        return DiagnosticSeverity.INFO;
      case ls.DiagnosticSeverity.Hint:
        return DiagnosticSeverity.HINT;
    }
  }
}
