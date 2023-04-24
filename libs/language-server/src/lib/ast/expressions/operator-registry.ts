// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable import/no-cycle */

import { ValidationContext } from '../../validation/validation-context';
import {
  BinaryExpression,
  Expression,
  UnaryExpression,
} from '../generated/ast';
import { PropertyValuetype } from '../model-util';

import {
  evaluateBinaryAdditionExpression,
  evaluateBinaryDivisionExpression,
  evaluateBinaryModuloExpression,
  evaluateBinaryMultiplicationExpression,
  evaluateBinarySubtractionExpression,
  inferBinaryArithmeticExpressionType,
} from './operators/binary-arithmetic-expression';
import {
  evaluateBinaryEqualityExpression,
  evaluateBinaryInequalityExpression,
  inferBinaryEqualityExpressionType,
} from './operators/binary-equality-expression';
import {
  evaluateBinaryPowExpression,
  evaluateBinaryRootExpression,
  inferBinaryExponentialExpressionType,
} from './operators/binary-exponential-expression';
import {
  evaluateBinaryAndExpression,
  evaluateBinaryOrExpression,
  evaluateBinaryXorExpression,
  inferBinaryLogicalExpressionType,
} from './operators/binary-logical-expression';
import {
  evaluateBinaryGreaterEqualExpression,
  evaluateBinaryGreaterThanExpression,
  evaluateBinaryLessEqualExpression,
  evaluateBinaryLessThanExpression,
  inferBinaryRelationalExpressionType,
} from './operators/binary-relational-expression';
import {
  evaluateUnaryCeilExpression,
  evaluateUnaryFloorExpression,
  evaluateUnaryRoundExpression,
  inferUnaryIntegerConversionExpressionType,
} from './operators/unary-integer-conversion-expression';
import {
  evaluateUnaryNotExpression,
  inferUnaryNotExpressionType,
} from './operators/unary-not-expression';
import {
  evaluateUnaryMinusExpression,
  evaluateUnaryPlusExpression,
  inferUnarySignExpressionType,
} from './operators/unary-sign-expression';
import {
  evaluateUnarySqrtExpression,
  inferUnarySqrtExpressionType,
} from './operators/unary-sqrt-expression';

export type UnaryExpressionOperator = UnaryExpression['operator'];
export type BinaryExpressionOperator = BinaryExpression['operator'];

export type UnaryTypeInferenceFunction = (
  innerType: PropertyValuetype,
  expression: UnaryExpression,
  context: ValidationContext | undefined,
) => PropertyValuetype | undefined;

export type BinaryTypeInferenceFunction = (
  leftType: PropertyValuetype,
  rightType: PropertyValuetype,
  expression: BinaryExpression,
  context: ValidationContext | undefined,
) => PropertyValuetype | undefined;

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export type EvaluationFunction<T extends Expression> = (
  expression: T,
  strategy: EvaluationStrategy,
  context: ValidationContext | undefined,
) => boolean | number | string | undefined;

export interface UnaryOperatorEntry {
  typeInference: UnaryTypeInferenceFunction;
  evaluation: EvaluationFunction<UnaryExpression>;
}

export const unaryOperatorRegistry: Record<
  UnaryExpressionOperator,
  UnaryOperatorEntry
> = {
  not: {
    typeInference: inferUnaryNotExpressionType,
    evaluation: evaluateUnaryNotExpression,
  },
  '+': {
    typeInference: inferUnarySignExpressionType,
    evaluation: evaluateUnaryPlusExpression,
  },
  '-': {
    typeInference: inferUnarySignExpressionType,
    evaluation: evaluateUnaryMinusExpression,
  },
  sqrt: {
    typeInference: inferUnarySqrtExpressionType,
    evaluation: evaluateUnarySqrtExpression,
  },
  floor: {
    typeInference: inferUnaryIntegerConversionExpressionType,
    evaluation: evaluateUnaryFloorExpression,
  },
  ceil: {
    typeInference: inferUnaryIntegerConversionExpressionType,
    evaluation: evaluateUnaryCeilExpression,
  },
  round: {
    typeInference: inferUnaryIntegerConversionExpressionType,
    evaluation: evaluateUnaryRoundExpression,
  },
};

export interface BinaryOperatorEntry {
  typeInference: BinaryTypeInferenceFunction;
  evaluation: EvaluationFunction<BinaryExpression>;
}

export const binaryOperatorRegistry: Record<
  BinaryExpressionOperator,
  BinaryOperatorEntry
> = {
  pow: {
    typeInference: inferBinaryExponentialExpressionType,
    evaluation: evaluateBinaryPowExpression,
  },
  root: {
    typeInference: inferBinaryExponentialExpressionType,
    evaluation: evaluateBinaryRootExpression,
  },
  '*': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: evaluateBinaryMultiplicationExpression,
  },
  '/': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: evaluateBinaryDivisionExpression,
  },
  '%': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: evaluateBinaryModuloExpression,
  },
  '+': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: evaluateBinaryAdditionExpression,
  },
  '-': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: evaluateBinarySubtractionExpression,
  },
  '<': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: evaluateBinaryLessThanExpression,
  },
  '<=': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: evaluateBinaryLessEqualExpression,
  },
  '>': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: evaluateBinaryGreaterThanExpression,
  },
  '>=': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: evaluateBinaryGreaterEqualExpression,
  },
  '==': {
    typeInference: inferBinaryEqualityExpressionType,
    evaluation: evaluateBinaryEqualityExpression,
  },
  '!=': {
    typeInference: inferBinaryEqualityExpressionType,
    evaluation: evaluateBinaryInequalityExpression,
  },
  xor: {
    typeInference: inferBinaryLogicalExpressionType,
    evaluation: evaluateBinaryXorExpression,
  },
  and: {
    typeInference: inferBinaryLogicalExpressionType,
    evaluation: evaluateBinaryAndExpression,
  },
  or: {
    typeInference: inferBinaryLogicalExpressionType,
    evaluation: evaluateBinaryOrExpression,
  },
};
