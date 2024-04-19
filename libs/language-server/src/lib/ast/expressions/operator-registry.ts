// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BinaryExpression,
  type TernaryExpression,
  type UnaryExpression,
} from '../generated/ast.js';
import {
  type ValueTypeProvider,
  type WrapperFactoryProvider,
} from '../wrappers/index.js';

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
import { LowercaseOperatorEvaluator } from './evaluators/lowercase-operator-evaluator.js';
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
import { UppercaseOperatorEvaluator } from './evaluators/uppercase-operator-evaluator.js';
import { XorOperatorEvaluator } from './evaluators/xor-operator-evaluator.js';
import { type OperatorEvaluator } from './operator-evaluator.js';
import {
  type BinaryOperatorTypeComputer,
  type TernaryOperatorTypeComputer,
  type UnaryOperatorTypeComputer,
} from './operator-type-computer.js';
import {
  type BinaryExpressionOperator,
  type TernaryExpressionOperator,
  type UnaryExpressionOperator,
} from './operator-types.js';
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
import { StringTransformTypeComputer } from './type-computers/string-transform-type-computer.js';

export interface OperatorEvaluatorRegistry {
  unary: Record<UnaryExpressionOperator, OperatorEvaluator<UnaryExpression>>;
  binary: Record<BinaryExpressionOperator, OperatorEvaluator<BinaryExpression>>;
  ternary: Record<
    TernaryExpressionOperator,
    OperatorEvaluator<TernaryExpression>
  >;
}

export interface OperatorTypeComputerRegistry {
  unary: Record<UnaryExpressionOperator, UnaryOperatorTypeComputer>;
  binary: Record<BinaryExpressionOperator, BinaryOperatorTypeComputer>;
  ternary: Record<TernaryExpressionOperator, TernaryOperatorTypeComputer>;
}

export class DefaultOperatorEvaluatorRegistry
  implements OperatorEvaluatorRegistry
{
  unary = {
    not: new NotOperatorEvaluator(),
    '+': new PlusOperatorEvaluator(),
    '-': new MinusOperatorEvaluator(),
    sqrt: new SqrtOperatorEvaluator(),
    floor: new FloorOperatorEvaluator(),
    ceil: new CeilOperatorEvaluator(),
    round: new RoundOperatorEvaluator(),
    lowercase: new LowercaseOperatorEvaluator(),
    uppercase: new UppercaseOperatorEvaluator(),
  };
  binary = {
    pow: new PowOperatorEvaluator(),
    root: new RootOperatorEvaluator(),
    '*': new MultiplicationOperatorEvaluator(),
    '/': new DivisionOperatorEvaluator(),
    '%': new ModuloOperatorEvaluator(),
    '+': new AdditionOperatorEvaluator(),
    '-': new SubtractionOperatorEvaluator(),
    matches: new MatchesOperatorEvaluator(),
    in: new InOperatorEvaluator(),
    '<': new LessThanOperatorEvaluator(),
    '<=': new LessEqualOperatorEvaluator(),
    '>': new GreaterThanOperatorEvaluator(),
    '>=': new GreaterEqualOperatorEvaluator(),
    '==': new EqualityOperatorEvaluator(),
    '!=': new InequalityOperatorEvaluator(),
    xor: new XorOperatorEvaluator(),
    and: new AndOperatorEvaluator(),
    or: new OrOperatorEvaluator(),
  };
  ternary = {
    replace: new ReplaceOperatorEvaluator(),
  };
}

export class DefaultOperatorTypeComputerRegistry
  implements OperatorTypeComputerRegistry
{
  unary = {
    not: new NotOperatorTypeComputer(this.valueTypeProvider),
    '+': new SignOperatorTypeComputer(this.valueTypeProvider),
    '-': new SignOperatorTypeComputer(this.valueTypeProvider),
    sqrt: new SqrtOperatorTypeComputer(this.valueTypeProvider),
    floor: new IntegerConversionOperatorTypeComputer(this.valueTypeProvider),
    ceil: new IntegerConversionOperatorTypeComputer(this.valueTypeProvider),
    round: new IntegerConversionOperatorTypeComputer(this.valueTypeProvider),
    lowercase: new StringTransformTypeComputer(this.valueTypeProvider),
    uppercase: new StringTransformTypeComputer(this.valueTypeProvider),
  };
  binary = {
    pow: new ExponentialOperatorTypeComputer(this.valueTypeProvider),
    root: new ExponentialOperatorTypeComputer(this.valueTypeProvider),
    '*': new BasicArithmeticOperatorTypeComputer(this.valueTypeProvider),
    '/': new DivisionOperatorTypeComputer(this.valueTypeProvider),
    '%': new DivisionOperatorTypeComputer(this.valueTypeProvider),
    '+': new BasicArithmeticOperatorTypeComputer(this.valueTypeProvider),
    '-': new BasicArithmeticOperatorTypeComputer(this.valueTypeProvider),
    matches: new MatchesOperatorTypeComputer(this.valueTypeProvider),
    in: new InOperatorTypeComputer(
      this.valueTypeProvider,
      this.wrapperFactories,
    ),
    '<': new RelationalOperatorTypeComputer(this.valueTypeProvider),
    '<=': new RelationalOperatorTypeComputer(this.valueTypeProvider),
    '>': new RelationalOperatorTypeComputer(this.valueTypeProvider),
    '>=': new RelationalOperatorTypeComputer(this.valueTypeProvider),
    '==': new EqualityOperatorTypeComputer(this.valueTypeProvider),
    '!=': new EqualityOperatorTypeComputer(this.valueTypeProvider),
    xor: new LogicalOperatorTypeComputer(this.valueTypeProvider),
    and: new LogicalOperatorTypeComputer(this.valueTypeProvider),
    or: new LogicalOperatorTypeComputer(this.valueTypeProvider),
  };
  ternary = {
    replace: new ReplaceOperatorTypeComputer(this.valueTypeProvider),
  };

  constructor(
    private readonly valueTypeProvider: ValueTypeProvider,
    private readonly wrapperFactories: WrapperFactoryProvider,
  ) {}
}
