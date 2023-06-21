// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import {
  CollectionValuetype,
  type Valuetype,
  isCollectionValuetype,
} from '../../wrappers/value-type';
import { PrimitiveValuetypes } from '../../wrappers/value-type/primitive/primitive-valuetypes';
import { BinaryOperatorTypeComputer } from '../operator-type-computer';

export class InOperatorTypeComputer implements BinaryOperatorTypeComputer {
  private readonly ALLOWED_LEFT_OPERAND_TYPES: Valuetype[] = [
    PrimitiveValuetypes.Text,
    PrimitiveValuetypes.Integer,
    PrimitiveValuetypes.Decimal,
  ];
  private readonly ALLOWED_RIGHT_OPERAND_TYPES: CollectionValuetype[] =
    this.ALLOWED_LEFT_OPERAND_TYPES.map((v) => new CollectionValuetype(v));

  computeType(
    leftOperandType: Valuetype,
    rightOperandType: Valuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined {
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
      isCollectionValuetype(rightOperandType, PrimitiveValuetypes.Decimal) ||
        isCollectionValuetype(rightOperandType, PrimitiveValuetypes.Integer) ||
        isCollectionValuetype(rightOperandType, PrimitiveValuetypes.Text),
    );

    if (!leftOperandType.isConvertibleTo(rightOperandType.elementType)) {
      context?.accept(
        'error',
        `The type of the left operand needs to be compatible to the collection element type of the right operand but they differ (left: ${leftOperandType.getName()}, right: ${rightOperandType.elementType.getName()})`,
        { node: expression },
      );
      return undefined;
    }

    return PrimitiveValuetypes.Boolean;
  }
}
