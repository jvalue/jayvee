// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/* eslint-disable import/no-cycle */

import { BinaryExpression, UnaryExpression } from '../generated/ast';
import {
  BinaryExpressionOperator,
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
import { InOperatorEvaluator } from './evaluators/in-operator-evaluator';
import { InequalityOperatorEvaluator } from './evaluators/inequality-operator-evaluator';
import { LessEqualOperatorEvaluator } from './evaluators/less-equal-operator-evaluator';
import { LessThanOperatorEvaluator } from './evaluators/less-than-operator-evaluator';
import { MatchesOperatorEvaluator } from './evaluators/matches-operator-evaluator';
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
import {
  BinaryOperatorTypeComputer,
  UnaryOperatorTypeComputer,
} from './operator-type-computer';
import { BasicArithmeticOperatorTypeComputer } from './type-computers/basic-arithmetic-operator-type-computer';
import { DivisionOperatorTypeComputer } from './type-computers/division-operator-type-computer';
import { EqualityOperatorTypeComputer } from './type-computers/equality-operator-type-computer';
import { ExponentialOperatorTypeComputer } from './type-computers/exponential-operator-type-computer';
import { InOperatorTypeComputer } from './type-computers/in-operator-type-computer';
import { IntegerConversionOperatorTypeComputer } from './type-computers/integer-conversion-operator-type-computer';
import { LogicalOperatorTypeComputer } from './type-computers/logical-operator-type-computer';
import { MatchesOperatorTypeComputer } from './type-computers/matches-operator-type-computer';
import { NotOperatorTypeComputer } from './type-computers/not-operator-type-computer';
import { RelationalOperatorTypeComputer } from './type-computers/relational-operator-type-computer';
import { SignOperatorTypeComputer } from './type-computers/sign-operator-type-computer';
import { SqrtOperatorTypeComputer } from './type-computers/sqrt-operator-type-computer';

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
