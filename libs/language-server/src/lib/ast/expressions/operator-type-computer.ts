// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationContext } from '../../validation/validation-context';
import {
  BinaryExpression,
  TernaryExpression,
  UnaryExpression,
} from '../generated/ast';
import { type Valuetype } from '../wrappers/value-type/valuetype';

export interface UnaryOperatorTypeComputer {
  /**
   * Computes the type of a unary operator by the type of its operand.
   * @param operandType the type of the operand
   * @param expression the expression to use for diagnostics
   * @param context the validation context to use for diagnostics
   * @returns the resulting type of the operator or `undefined` if the type could not be inferred
   */
  computeType(
    operandType: Valuetype,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined;
}

export abstract class DefaultUnaryOperatorTypeComputer
  implements UnaryOperatorTypeComputer
{
  constructor(protected readonly expectedOperandType: Valuetype) {}

  computeType(
    operandType: Valuetype,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined {
    if (!operandType.isConvertibleTo(this.expectedOperandType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(this.expectedOperandType, operandType),
        {
          node: expression.expression,
        },
      );
      return undefined;
    }
    return this.doComputeType(operandType);
  }

  protected abstract doComputeType(operandType: Valuetype): Valuetype;
}

export interface BinaryOperatorTypeComputer {
  /**
   * Computes the type of a binary operator by the type of its operands.
   * @param leftType the type of the left operand
   * @param rightType the type of the right operand
   * @param expression the expression to use for diagnostics
   * @param context the validation context to use for diagnostics
   * @returns the resulting type of the operator or `undefined` if the type could not be inferred
   */
  computeType(
    leftType: Valuetype,
    rightType: Valuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined;
}

export abstract class DefaultBinaryOperatorTypeComputer
  implements BinaryOperatorTypeComputer
{
  constructor(
    protected readonly expectedLeftOperandType: Valuetype,
    protected readonly expectedRightOperandType: Valuetype,
  ) {}

  computeType(
    leftOperandType: Valuetype,
    rightOperandType: Valuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined {
    let typeErrorOccurred = false;

    if (!leftOperandType.isConvertibleTo(this.expectedLeftOperandType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(
          this.expectedLeftOperandType,
          leftOperandType,
        ),
        {
          node: expression.left,
        },
      );
      typeErrorOccurred = true;
    }

    if (!rightOperandType.isConvertibleTo(this.expectedRightOperandType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(
          this.expectedRightOperandType,
          rightOperandType,
        ),
        {
          node: expression.right,
        },
      );
      typeErrorOccurred = true;
    }

    if (typeErrorOccurred) {
      return undefined;
    }

    return this.doComputeType(leftOperandType, rightOperandType);
  }

  protected abstract doComputeType(
    leftOperandType: Valuetype,
    rightOperandType: Valuetype,
  ): Valuetype;
}

export function generateUnexpectedTypeMessage(
  expectedType: Valuetype,
  actualType: Valuetype,
) {
  return `The operand needs to be of type ${expectedType.getName()} but is of type ${actualType.getName()}`;
}

export abstract class DefaultTernaryOperatorTypeComputer
  implements TernaryOperatorTypeComputer
{
  constructor(
    protected readonly expectedFirstOperandType: Valuetype,
    protected readonly expectedSecondOperandType: Valuetype,
    protected readonly expectedThirdOperandType: Valuetype,
  ) {}

  computeType(
    firstOperandType: Valuetype,
    secondOperandType: Valuetype,
    thirdOperandType: Valuetype,
    expression: TernaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined {
    let typeErrorOccurred = false;

    if (!firstOperandType.isConvertibleTo(this.expectedFirstOperandType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(
          this.expectedFirstOperandType,
          firstOperandType,
        ),
        {
          node: expression.first,
        },
      );
      typeErrorOccurred = true;
    }

    if (!secondOperandType.isConvertibleTo(this.expectedSecondOperandType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(
          this.expectedSecondOperandType,
          secondOperandType,
        ),
        {
          node: expression.second,
        },
      );
      typeErrorOccurred = true;
    }

    if (!thirdOperandType.isConvertibleTo(this.expectedThirdOperandType)) {
      context?.accept(
        'error',
        generateUnexpectedTypeMessage(
          this.expectedThirdOperandType,
          thirdOperandType,
        ),
        {
          node: expression.third,
        },
      );
      typeErrorOccurred = true;
    }

    if (typeErrorOccurred) {
      return undefined;
    }

    return this.doComputeType(
      firstOperandType,
      secondOperandType,
      thirdOperandType,
    );
  }

  protected abstract doComputeType(
    firstOperandType: Valuetype,
    secondOperandType: Valuetype,
    thirdOperandType: Valuetype,
  ): Valuetype;
}

export interface TernaryOperatorTypeComputer {
  /**
   * Computes the type of a ternary operator by the type of its operands.
   * @param firstType the type of the first operand
   * @param secondType the type of the second operand
   * @param thirdType the type of the third operand
   * @param expression the expression to use for diagnostics
   * @param context the validation context to use for diagnostics
   * @returns the resulting type of the operator or `undefined` if the type could not be inferred
   */
  computeType(
    firstType: Valuetype,
    secondType: Valuetype,
    thirdType: Valuetype,
    expression: TernaryExpression,
    context: ValidationContext | undefined,
  ): Valuetype | undefined;
}
