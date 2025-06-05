// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type ValidationContext } from '../../../validation/validation-context';
import { type UnaryExpression } from '../../generated/ast';
import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { type UnaryOperatorTypeComputer } from '../operator-type-computer';

export class LengthofOperatorTypeComputer implements UnaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {}

  computeType(
    operandType: ValueType,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): ValueType | undefined {
    if (
      !operandType.isConvertibleTo(this.valueTypeProvider.EmptyCollection) &&
      this.valueTypeProvider.Primitives.getAll().every(
        (vt) =>
          !operandType.isConvertibleTo(
            this.valueTypeProvider.createCollectionValueTypeOf(vt),
          ),
      ) &&
      !operandType.isConvertibleTo(this.valueTypeProvider.Primitives.Text)
    ) {
      context?.accept(
        'error',
        `The operand needs to be of type ${this.valueTypeProvider.Primitives.Text.getName()} or ${this.valueTypeProvider.EmptyCollection.getName()} but is of type ${operandType.getName()}`,
        {
          node: expression.expression,
        },
      );
      return undefined;
    }
    return this.valueTypeProvider.Primitives.Integer;
  }
}
