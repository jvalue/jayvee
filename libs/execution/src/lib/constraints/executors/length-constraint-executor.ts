// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  InternalValueRepresentation,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { TypedConstraintExecutorClass } from '../typed-constraint-executor-class';

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
      PrimitiveValuetypes.Integer,
    );
    const maxLength = context.getPropertyValue(
      'maxLength',
      PrimitiveValuetypes.Integer,
    );

    return minLength <= value.length && value.length <= maxLength;
  }
}
