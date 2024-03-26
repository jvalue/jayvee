// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BinaryExpression,
  TernaryExpression,
  UnaryExpression,
} from '../generated/ast.js';
import {
  BinaryExpressionOperator,
  TernaryExpressionOperator,
  UnaryExpressionOperator,
} from '../model-util.js';

import { AdditionOperatorEvaluator } from './evaluators/addition-operator-evaluator.js';
import { AndOperatorEvaluator } from './evaluators/and-operator-evaluator.js';
import { CeilOperatorEvaluator } from './evaluators/ceil-operator-evaluator.js';
import { DivisionOperatorEvaluator } from './evaluators/division-operator-evaluator.js';
import { EqualityOperatorEvaluator } from './evaluators/equality-operator-evaluator.js';
import { FloorOperatorEvaluator } from './evaluators/floor-operator-evaluator.js';
import { GreaterEqualOperatorEvaluator } from './evaluators/greater-equal-operator-evaluator.js';
import { GreaterThanOperatorEvaluator } from './evaluators/greater-than-operator-evaluator.js';
import { InOperatorEvaluator } from './evaluators/in-operator-evaluator.js';
import { InequalityOperatorEvaluator } from './evaluators/inequality-operator-evaluator.js';
import { LessEqualOperatorEvaluator } from './evaluators/less-equal-operator-evaluator.js';
import { LessThanOperatorEvaluator } from './evaluators/less-than-operator-evaluator.js';
import { MatchesOperatorEvaluator } from './evaluators/matches-operator-evaluator.js';
import { MinusOperatorEvaluator } from './evaluators/minus-operator-evaluator.js';
import { ModuloOperatorEvaluator } from './evaluators/modulo-operator-evaluator.js';
import { MultiplicationOperatorEvaluator } from './evaluators/multiplication-operator-evaluator.js';
import { NotOperatorEvaluator } from './evaluators/not-operator-evaluator.js';
import { OrOperatorEvaluator } from './evaluators/or-operator-evaluator.js';
import { PlusOperatorEvaluator } from './evaluators/plus-operator-evaluator.js';
import { PowOperatorEvaluator } from './evaluators/pow-operator-evaluator.js';
import { ReplaceOperatorEvaluator } from './evaluators/replace-operator-evaluator.js';
import { RootOperatorEvaluator } from './evaluators/root-operator-evaluator.js';
import { RoundOperatorEvaluator } from './evaluators/round-operator-evaluator.js';
import { SqrtOperatorEvaluator } from './evaluators/sqrt-operator-evaluator.js';
import { SubtractionOperatorEvaluator } from './evaluators/subtraction-operator-evaluator.js';
import { XorOperatorEvaluator } from './evaluators/xor-operator-evaluator.js';
import { OperatorEvaluator } from './operator-evaluator.js';
import {
  BinaryOperatorTypeComputer,
  TernaryOperatorTypeComputer,
  UnaryOperatorTypeComputer,
} from './operator-type-computer.js';
import { BasicArithmeticOperatorTypeComputer } from './type-computers/basic-arithmetic-operator-type-computer.js';
import { DivisionOperatorTypeComputer } from './type-computers/division-operator-type-computer.js';
import { EqualityOperatorTypeComputer } from './type-computers/equality-operator-type-computer.js';
import { ExponentialOperatorTypeComputer } from './type-computers/exponential-operator-type-computer.js';
import { InOperatorTypeComputer } from './type-computers/in-operator-type-computer.js';
import { IntegerConversionOperatorTypeComputer } from './type-computers/integer-conversion-operator-type-computer.js';
import { LogicalOperatorTypeComputer } from './type-computers/logical-operator-type-computer.js';
import { MatchesOperatorTypeComputer } from './type-computers/matches-operator-type-computer.js';
import { NotOperatorTypeComputer } from './type-computers/not-operator-type-computer.js';
import { RelationalOperatorTypeComputer } from './type-computers/relational-operator-type-computer.js';
import { ReplaceOperatorTypeComputer } from './type-computers/replace-operator-type-computer.js';
import { SignOperatorTypeComputer } from './type-computers/sign-operator-type-computer.js';
import { SqrtOperatorTypeComputer } from './type-computers/sqrt-operator-type-computer.js';

export interface UnaryOperatorEntry {
  typeInference: UnaryOperatorTypeComputer;
  evaluation: OperatorEvaluator<UnaryExpression>;
}

export const unaryOperatorRegistry: Record<
  UnaryExpressionOperator,
  UnaryOperatorEntry
> = {
  not: {
    typeInference: new NotOperatorTypeComputer(),
    evaluation: new NotOperatorEvaluator(),
  },
  '+': {
    typeInference: new SignOperatorTypeComputer(),
    evaluation: new PlusOperatorEvaluator(),
  },
  '-': {
    typeInference: new SignOperatorTypeComputer(),
    evaluation: new MinusOperatorEvaluator(),
  },
  sqrt: {
    typeInference: new SqrtOperatorTypeComputer(),
    evaluation: new SqrtOperatorEvaluator(),
  },
  floor: {
    typeInference: new IntegerConversionOperatorTypeComputer(),
    evaluation: new FloorOperatorEvaluator(),
  },
  ceil: {
    typeInference: new IntegerConversionOperatorTypeComputer(),
    evaluation: new CeilOperatorEvaluator(),
  },
  round: {
    typeInference: new IntegerConversionOperatorTypeComputer(),
    evaluation: new RoundOperatorEvaluator(),
  },
};

export interface BinaryOperatorEntry {
  typeInference: BinaryOperatorTypeComputer;
  evaluation: OperatorEvaluator<BinaryExpression>;
}

export const binaryOperatorRegistry: Record<
  BinaryExpressionOperator,
  BinaryOperatorEntry
> = {
  pow: {
    typeInference: new ExponentialOperatorTypeComputer(),
    evaluation: new PowOperatorEvaluator(),
  },
  root: {
    typeInference: new ExponentialOperatorTypeComputer(),
    evaluation: new RootOperatorEvaluator(),
  },
  '*': {
    typeInference: new BasicArithmeticOperatorTypeComputer(),
    evaluation: new MultiplicationOperatorEvaluator(),
  },
  '/': {
    typeInference: new DivisionOperatorTypeComputer(),
    evaluation: new DivisionOperatorEvaluator(),
  },
  '%': {
    typeInference: new DivisionOperatorTypeComputer(),
    evaluation: new ModuloOperatorEvaluator(),
  },
  '+': {
    typeInference: new BasicArithmeticOperatorTypeComputer(),
    evaluation: new AdditionOperatorEvaluator(),
  },
  '-': {
    typeInference: new BasicArithmeticOperatorTypeComputer(),
    evaluation: new SubtractionOperatorEvaluator(),
  },
  matches: {
    typeInference: new MatchesOperatorTypeComputer(),
    evaluation: new MatchesOperatorEvaluator(),
  },
  in: {
    typeInference: new InOperatorTypeComputer(),
    evaluation: new InOperatorEvaluator(),
  },
  '<': {
    typeInference: new RelationalOperatorTypeComputer(),
    evaluation: new LessThanOperatorEvaluator(),
  },
  '<=': {
    typeInference: new RelationalOperatorTypeComputer(),
    evaluation: new LessEqualOperatorEvaluator(),
  },
  '>': {
    typeInference: new RelationalOperatorTypeComputer(),
    evaluation: new GreaterThanOperatorEvaluator(),
  },
  '>=': {
    typeInference: new RelationalOperatorTypeComputer(),
    evaluation: new GreaterEqualOperatorEvaluator(),
  },
  '==': {
    typeInference: new EqualityOperatorTypeComputer(),
    evaluation: new EqualityOperatorEvaluator(),
  },
  '!=': {
    typeInference: new EqualityOperatorTypeComputer(),
    evaluation: new InequalityOperatorEvaluator(),
  },
  xor: {
    typeInference: new LogicalOperatorTypeComputer(),
    evaluation: new XorOperatorEvaluator(),
  },
  and: {
    typeInference: new LogicalOperatorTypeComputer(),
    evaluation: new AndOperatorEvaluator(),
  },
  or: {
    typeInference: new LogicalOperatorTypeComputer(),
    evaluation: new OrOperatorEvaluator(),
  },
};

export interface TernaryOperatorEntry {
  typeInference: TernaryOperatorTypeComputer;
  evaluation: OperatorEvaluator<TernaryExpression>;
}

export const ternaryOperatorRegistry: Record<
  TernaryExpressionOperator,
  TernaryOperatorEntry
> = {
  replace: {
    typeInference: new ReplaceOperatorTypeComputer(),
    evaluation: new ReplaceOperatorEvaluator(),
  },
};
