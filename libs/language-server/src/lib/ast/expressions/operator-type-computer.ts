// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { ValidationContext } from '../../validation/validation-context';
import { BinaryExpression, UnaryExpression } from '../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../model-util';

export interface UnaryOperatorTypeComputer {
  /**
   * Computes the type of a unary operator by the type of its operand.
   * @param operandType the type of the operand
   * @param expression the expression to use for diagnostics
   * @param context the validation context to use for diagnostics
   * @returns the resulting type of the operator or `undefined` if the type could not be inferred
   */
  computeType(
    operandType: PropertyValuetype,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined;
}

export abstract class DefaultUnaryOperatorTypeComputer
  implements UnaryOperatorTypeComputer
{
  constructor(protected readonly expectedOperandType: PropertyValuetype) {}

  computeType(
    operandType: PropertyValuetype,
    expression: UnaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined {
    if (!convertsImplicitlyTo(operandType, this.expectedOperandType)) {
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

  protected abstract doComputeType(
    operandType: PropertyValuetype,
  ): PropertyValuetype;
}

export function convertsImplicitlyTo(
  from: PropertyValuetype,
  to: PropertyValuetype,
) {
  return (
    from === to ||
    (from === PropertyValuetype.INTEGER && to === PropertyValuetype.DECIMAL)
  );
}

function generateUnexpectedTypeMessage(
  expectedTypes: PropertyValuetype | PropertyValuetype[],
  actualType: PropertyValuetype,
) {
  return `The operand needs to be of type ${
    Array.isArray(expectedTypes) ? expectedTypes.join(' or ') : expectedTypes
  } but is of type ${actualType}`;
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
    leftType: PropertyValuetype,
    rightType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined;
}

export abstract class DefaultBinaryOperatorTypeComputer
  implements BinaryOperatorTypeComputer
{
  constructor(
    protected readonly expectedLeftOperandType: PropertyValuetype,
    protected readonly expectedRightOperandType: PropertyValuetype,
  ) {}

  computeType(
    leftOperandType: PropertyValuetype,
    rightOperandType: PropertyValuetype,
    expression: BinaryExpression,
    context: ValidationContext | undefined,
  ): PropertyValuetype | undefined {
    let typeErrorOccurred = false;

    if (!convertsImplicitlyTo(leftOperandType, this.expectedLeftOperandType)) {
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

    if (
      !convertsImplicitlyTo(rightOperandType, this.expectedRightOperandType)
    ) {
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
    leftOperandType: PropertyValuetype,
    rightOperandType: PropertyValuetype,
  ): PropertyValuetype;
}
