import { AstNode, DiagnosticInfo } from 'langium';

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Diagnostic<N extends AstNode = AstNode> {
  severity: DiagnosticSeverity;
  message: string;
  info: DiagnosticInfo<N>;
}

export function isDiagnostic(obj: unknown): obj is Diagnostic {
  return (
    typeof obj === 'object' &&
    obj != null &&
    'severity' in obj &&
    'message' in obj &&
    'info' in obj
  );
}
