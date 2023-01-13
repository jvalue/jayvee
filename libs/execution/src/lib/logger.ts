import { AstNode, DiagnosticInfo } from 'langium';

export type Severity = 'error' | 'warning' | 'info' | 'hint';

export interface Logger {
  log<N extends AstNode>(
    severity: Severity,
    message: string,
    diagnostic?: DiagnosticInfo<N>,
  ): void;
}
