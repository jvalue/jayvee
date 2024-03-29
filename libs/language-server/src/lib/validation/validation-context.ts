// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, DiagnosticInfo, ValidationAcceptor } from 'langium';

export class ValidationContext {
  private errorOccurred = false;

  constructor(private readonly validationAcceptor: ValidationAcceptor) {}

  accept: ValidationAcceptor = <N extends AstNode>(
    severity: 'error' | 'warning' | 'info' | 'hint',
    message: string,
    info: DiagnosticInfo<N>,
  ): void => {
    if (severity === 'error') {
      this.errorOccurred = true;
    }
    this.validationAcceptor(severity, message, info);
  };

  hasErrorOccurred(): boolean {
    return this.errorOccurred;
  }
}
