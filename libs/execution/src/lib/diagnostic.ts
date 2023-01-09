import { AstNode, DiagnosticInfo } from 'langium';

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Diagnostic<N extends AstNode = AstNode> {
  severity: DiagnosticSeverity;
  message: string;
  info: DiagnosticInfo<N>;
}

export function isDiagnostic(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
): obj is Diagnostic {
  return 'severity' in obj && 'message' in obj && 'info' in obj;
}
