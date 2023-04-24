// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { ValidationContext } from '../../../validation/validation-context';
import { UnaryExpression } from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { PropertyValuetype } from '../../model-util';
import { evaluateExpression } from '../evaluation';
import {
  EvaluationFunction,
  EvaluationStrategy,
  UnaryTypeInferenceFunction,
} from '../operator-registry';

export const inferUnaryNotExpressionType: UnaryTypeInferenceFunction = (
  innerType: PropertyValuetype,
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined => {
  assert(expression.operator === 'not');
  if (innerType !== PropertyValuetype.BOOLEAN) {
    context?.accept(
      'error',
      `The operand needs to be of type ${PropertyValuetype.BOOLEAN} but is of type ${innerType}`,
      {
        node: expression.expression,
      },
    );
    return undefined;
  }
  return PropertyValuetype.BOOLEAN;
};

export const evaluateUnaryNotExpression: EvaluationFunction<UnaryExpression> = (
  expression: UnaryExpression,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
): boolean | number | string | undefined => {
  assert(expression.operator === 'not');
  const innerValue = evaluateExpression(
    expression.expression,
    strategy,
    context,
  );
  if (innerValue === undefined) {
    return undefined;
  }
  assert(typeof innerValue === 'boolean');
  return !innerValue;
};
