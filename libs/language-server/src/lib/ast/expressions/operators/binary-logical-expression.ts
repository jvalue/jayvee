// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { BinaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../../model-util';
import { BinaryTypeInferenceFunction } from '../operator-registry';
import { generateUnexpectedTypeMessage } from '../type-inference';

export const inferBinaryLogicalExpressionType: BinaryTypeInferenceFunction = (
  leftType: PropertyValuetype,
  rightType: PropertyValuetype,
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(
    expression.operator === 'xor' ||
      expression.operator === 'and' ||
      expression.operator === 'or',
  );

  if (leftType !== PropertyValuetype.BOOLEAN) {
    context?.accept(
      'error',
      generateUnexpectedTypeMessage(PropertyValuetype.BOOLEAN, leftType),
      {
        node: expression.left,
      },
    );
  }
  if (rightType !== PropertyValuetype.BOOLEAN) {
    context?.accept(
      'error',
      generateUnexpectedTypeMessage(PropertyValuetype.BOOLEAN, leftType),
      {
        node: expression.right,
      },
    );
  }
  if (
    leftType !== PropertyValuetype.BOOLEAN ||
    rightType !== PropertyValuetype.BOOLEAN
  ) {
    return undefined;
  }
  return PropertyValuetype.BOOLEAN;
};
