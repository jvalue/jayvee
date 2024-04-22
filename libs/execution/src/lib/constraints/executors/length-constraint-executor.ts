// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context.js';
import { implementsStatic } from '../../util/implements-static-decorator.js';
import { type ConstraintExecutor } from '../constraint-executor.js';
import { type TypedConstraintExecutorClass } from '../typed-constraint-executor-class.js';

@implementsStatic<TypedConstraintExecutorClass>()
export class LengthConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'LengthConstraint';

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const minLength = context.getPropertyValue(
      'minLength',
      context.valueTypeProvider.Primitives.Integer,
    );
    const maxLength = context.getPropertyValue(
      'maxLength',
      context.valueTypeProvider.Primitives.Integer,
    );

    return minLength <= value.length && value.length <= maxLength;
  }
}
