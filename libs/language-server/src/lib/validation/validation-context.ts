// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type DiagnosticInfo,
  type ValidationAcceptor,
} from 'langium';

import { type OperatorTypeComputerRegistry } from '../ast/expressions/operator-registry';

export class ValidationContext {
  private errorOccurred = false;

  constructor(
    private readonly validationAcceptor: ValidationAcceptor,
    public readonly typeComputerRegistry: OperatorTypeComputerRegistry,
  ) {}

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
