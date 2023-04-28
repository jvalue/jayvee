// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable import/no-cycle */

import { ValidationContext } from '../../validation/validation-context';
import { BinaryExpression, UnaryExpression } from '../generated/ast';
import {
  BinaryExpressionOperator,
  PropertyValuetype,
  UnaryExpressionOperator,
} from '../model-util';

import { AdditionOperatorEvaluator } from './evaluators/addition-operator-evaluator';
import { AndOperatorEvaluator } from './evaluators/and-operator-evaluator';
import { CeilOperatorEvaluator } from './evaluators/ceil-operator-evaluator';
import { DivisionOperatorEvaluator } from './evaluators/division-operator-evaluator';
import { EqualityOperatorEvaluator } from './evaluators/equality-operator-evaluator';
import { FloorOperatorEvaluator } from './evaluators/floor-operator-evaluator';
import { GreaterEqualOperatorEvaluator } from './evaluators/greater-equal-operator-evaluator';
import { GreaterThanOperatorEvaluator } from './evaluators/greater-than-operator-evaluator';
import { InequalityOperatorEvaluator } from './evaluators/inequality-operator-evaluator';
import { LessEqualOperatorEvaluator } from './evaluators/less-equal-operator-evaluator';
import { LessThanOperatorEvaluator } from './evaluators/less-than-operator-evaluator';
import { MinusOperatorEvaluator } from './evaluators/minus-operator-evaluator';
import { ModuloOperatorEvaluator } from './evaluators/modulo-operator-evaluator';
import { MultiplicationOperatorEvaluator } from './evaluators/multiplication-operator-evaluator';
import { NotOperatorEvaluator } from './evaluators/not-operator-evaluator';
import { OrOperatorEvaluator } from './evaluators/or-operator-evaluator';
import { PlusOperatorEvaluator } from './evaluators/plus-operator-evaluator';
import { PowOperatorEvaluator } from './evaluators/pow-operator-evaluator';
import { RootOperatorEvaluator } from './evaluators/root-operator-evaluator';
import { RoundOperatorEvaluator } from './evaluators/round-operator-evaluator';
import { SqrtOperatorEvaluator } from './evaluators/sqrt-operator-evaluator';
import { SubtractionOperatorEvaluator } from './evaluators/subtraction-operator-evaluator';
import { XorOperatorEvaluator } from './evaluators/xor-operator-evaluator';
import { OperatorEvaluator } from './operator-evaluator';
import { inferBinaryArithmeticExpressionType } from './operators/binary-arithmetic-expression';
import { inferBinaryEqualityExpressionType } from './operators/binary-equality-expression';
import { inferBinaryExponentialExpressionType } from './operators/binary-exponential-expression';
import { inferBinaryLogicalExpressionType } from './operators/binary-logical-expression';
import { inferBinaryRelationalExpressionType } from './operators/binary-relational-expression';
import { inferUnaryIntegerConversionExpressionType } from './operators/unary-integer-conversion-expression';
import { inferUnaryNotExpressionType } from './operators/unary-not-expression';
import { inferUnarySignExpressionType } from './operators/unary-sign-expression';
import { inferUnarySqrtExpressionType } from './operators/unary-sqrt-expression';

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

export interface UnaryOperatorEntry {
  typeInference: UnaryTypeInferenceFunction;
  evaluation: OperatorEvaluator<UnaryExpression>;
}

export const unaryOperatorRegistry: Record<
  UnaryExpressionOperator,
  UnaryOperatorEntry
> = {
  not: {
    typeInference: inferUnaryNotExpressionType,
    evaluation: new NotOperatorEvaluator(),
  },
  '+': {
    typeInference: inferUnarySignExpressionType,
    evaluation: new PlusOperatorEvaluator(),
  },
  '-': {
    typeInference: inferUnarySignExpressionType,
    evaluation: new MinusOperatorEvaluator(),
  },
  sqrt: {
    typeInference: inferUnarySqrtExpressionType,
    evaluation: new SqrtOperatorEvaluator(),
  },
  floor: {
    typeInference: inferUnaryIntegerConversionExpressionType,
    evaluation: new FloorOperatorEvaluator(),
  },
  ceil: {
    typeInference: inferUnaryIntegerConversionExpressionType,
    evaluation: new CeilOperatorEvaluator(),
  },
  round: {
    typeInference: inferUnaryIntegerConversionExpressionType,
    evaluation: new RoundOperatorEvaluator(),
  },
};

export interface BinaryOperatorEntry {
  typeInference: BinaryTypeInferenceFunction;
  evaluation: OperatorEvaluator<BinaryExpression>;
}

export const binaryOperatorRegistry: Record<
  BinaryExpressionOperator,
  BinaryOperatorEntry
> = {
  pow: {
    typeInference: inferBinaryExponentialExpressionType,
    evaluation: new PowOperatorEvaluator(),
  },
  root: {
    typeInference: inferBinaryExponentialExpressionType,
    evaluation: new RootOperatorEvaluator(),
  },
  '*': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: new MultiplicationOperatorEvaluator(),
  },
  '/': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: new DivisionOperatorEvaluator(),
  },
  '%': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: new ModuloOperatorEvaluator(),
  },
  '+': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: new AdditionOperatorEvaluator(),
  },
  '-': {
    typeInference: inferBinaryArithmeticExpressionType,
    evaluation: new SubtractionOperatorEvaluator(),
  },
  '<': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: new LessThanOperatorEvaluator(),
  },
  '<=': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: new LessEqualOperatorEvaluator(),
  },
  '>': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: new GreaterThanOperatorEvaluator(),
  },
  '>=': {
    typeInference: inferBinaryRelationalExpressionType,
    evaluation: new GreaterEqualOperatorEvaluator(),
  },
  '==': {
    typeInference: inferBinaryEqualityExpressionType,
    evaluation: new EqualityOperatorEvaluator(),
  },
  '!=': {
    typeInference: inferBinaryEqualityExpressionType,
    evaluation: new InequalityOperatorEvaluator(),
  },
  xor: {
    typeInference: inferBinaryLogicalExpressionType,
    evaluation: new XorOperatorEvaluator(),
  },
  and: {
    typeInference: inferBinaryLogicalExpressionType,
    evaluation: new AndOperatorEvaluator(),
  },
  or: {
    typeInference: inferBinaryLogicalExpressionType,
    evaluation: new OrOperatorEvaluator(),
  },
};
