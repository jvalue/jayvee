// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { type ValidationContext } from '../../../validation/validation-context';
import { type BinaryExpression } from '../../generated/ast';
import { type WrapperFactoryProvider } from '../../wrappers';
import {
  type CollectionValueType,
  type ValueType,
  type ValueTypeProvider,
  isCollectionValueType,
} from '../../wrappers/value-type';
import { type BinaryOperatorTypeComputer } from '../operator-type-computer';

export class InOperatorTypeComputer implements BinaryOperatorTypeComputer {
  private readonly ALLOWED_LEFT_OPERAND_TYPES: ValueType[];
  private readonly ALLOWED_RIGHT_OPERAND_TYPES: CollectionValueType[];

  constructor(
    protected readonly valueTypeProvider: ValueTypeProvider,
    protected readonly wrapperFactories: WrapperFactoryProvider,
  ) {
    this.ALLOWED_LEFT_OPERAND_TYPES = [
      valueTypeProvider.Primitives.Text,
      valueTypeProvider.Primitives.Integer,
      valueTypeProvider.Primitives.Decimal,
    ];
    this.ALLOWED_RIGHT_OPERAND_TYPES = this.ALLOWED_LEFT_OPERAND_TYPES.map(
      (v) => valueTypeProvider.createCollectionValueTypeOf(v),
    );
  }

  computeType(
    leftOperandType: ValueType,
    rightOperandType: ValueType,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): ValueType | undefined {
    const isLeftOperandTypeValid =
      this.ALLOWED_LEFT_OPERAND_TYPES.includes(leftOperandType);
    const isRightOperandTypeValid = this.ALLOWED_RIGHT_OPERAND_TYPES.some((v) =>
      v.equals(rightOperandType),
    );
    if (!isLeftOperandTypeValid || !isRightOperandTypeValid) {
      if (!isLeftOperandTypeValid) {
        context?.accept(
          'error',
          `Operator does not support type ${leftOperandType.getName()}`,
          {
            node: expression.left,
          },
        );
      }
      if (!isRightOperandTypeValid) {
        context?.accept(
          'error',
          `Operator does not support type ${rightOperandType.getName()}`,
          {
            node: expression.right,
          },
        );
      }
      return undefined;
    }
    assert(
      isCollectionValueType(
        rightOperandType,
        this.valueTypeProvider.Primitives.Decimal,
      ) ||
        isCollectionValueType(
          rightOperandType,
          this.valueTypeProvider.Primitives.Integer,
        ) ||
        isCollectionValueType(
          rightOperandType,
          this.valueTypeProvider.Primitives.Text,
        ),
    );

    // allow 3 in [3.5, 5.3]
    const isLeftConvertibleToRight = leftOperandType.isConvertibleTo(
      rightOperandType.elementType,
    );

    // allow 3.5 in [3.0, 2.0]
    const isRightConvertibleToLeft =
      rightOperandType.elementType.isConvertibleTo(leftOperandType);

    if (!isLeftConvertibleToRight && !isRightConvertibleToLeft) {
      context?.accept(
        'error',
        `The type of the left operand needs to be compatible to the collection element type of the right operand but they differ (left: ${leftOperandType.getName()}, right: ${rightOperandType.elementType.getName()})`,
        { node: expression },
      );
      return undefined;
    }

    return this.valueTypeProvider.Primitives.Boolean;
  }
}
