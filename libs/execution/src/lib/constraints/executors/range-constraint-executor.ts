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
export class RangeConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'RangeConstraint';

  isValid(
    value: InternalValueRepresentation,
    context: ExecutionContext,
  ): boolean {
    let numericValue: number;
    if (typeof value === 'string') {
      numericValue = Number.parseFloat(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      return false;
    }

    const lowerBound = context.getPropertyValue(
      'lowerBound',
      PrimitiveValuetypes.Decimal,
    );
    const lowerBoundInclusive = context.getPropertyValue(
      'lowerBoundInclusive',
      PrimitiveValuetypes.Boolean,
    );
    const upperBound = context.getPropertyValue(
      'upperBound',
      PrimitiveValuetypes.Decimal,
    );
    const upperBoundInclusive = context.getPropertyValue(
      'upperBoundInclusive',
      PrimitiveValuetypes.Boolean,
    );

    const lowerBoundFulfilled = lowerBoundInclusive
      ? lowerBound <= numericValue
      : lowerBound < numericValue;

    const upperBoundFulfilled = upperBoundInclusive
      ? numericValue <= upperBound
      : numericValue < upperBound;

    return lowerBoundFulfilled && upperBoundFulfilled;
  }
}
