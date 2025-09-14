// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValidationContext } from '../../../validation';
import { type TernaryExpression } from '../../generated/ast';
import {
  type ValueTypeProvider,
  type ValueType,
} from '../../wrappers/value-type';
import {
  generateUnexpectedTypeMessage,
  type TernaryOperatorTypeComputer,
} from '../operator-type-computer';

export class IfOperatorTypeComputer implements TernaryOperatorTypeComputer {
  constructor(private readonly valueTypes: ValueTypeProvider) {}

  computeType(
    firstOperandType: ValueType,
    secondOperandType: ValueType,
    thirdOperandType: ValueType,
    expression: TernaryExpression,
    context: ValidationContext | undefined,
  ): ValueType | undefined {
    if (
      !secondOperandType.isConvertibleTo(this.valueTypes.Primitives.Boolean)
    ) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(
          this.valueTypes.Primitives.Boolean,
          secondOperandType,
        ),
        {
          node: expression.second,
        },
      );
      return undefined;
    }

    if (firstOperandType.isConvertibleTo(thirdOperandType)) {
      return thirdOperandType;
    } else if (thirdOperandType.isConvertibleTo(firstOperandType)) {
      return firstOperandType;
    } else {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(firstOperandType, thirdOperandType),
        {
          node: expression.third,
        },
      );
      return undefined;
    }
  }
}
