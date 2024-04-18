// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type BinaryExpression,
  type TernaryExpression,
  type UnaryExpression,
} from '../generated/ast';
import {
  type ValueTypeProvider,
  type WrapperFactoryProvider,
} from '../wrappers';

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
import { LowercaseOperatorEvaluator } from './evaluators/lowercase-operator-evaluator';
import { MatchesOperatorEvaluator } from './evaluators/matches-operator-evaluator';
import { MinusOperatorEvaluator } from './evaluators/minus-operator-evaluator';
import { ModuloOperatorEvaluator } from './evaluators/modulo-operator-evaluator';
import { MultiplicationOperatorEvaluator } from './evaluators/multiplication-operator-evaluator';
import { NotOperatorEvaluator } from './evaluators/not-operator-evaluator';
import { OrOperatorEvaluator } from './evaluators/or-operator-evaluator';
import { PlusOperatorEvaluator } from './evaluators/plus-operator-evaluator';
import { PowOperatorEvaluator } from './evaluators/pow-operator-evaluator';
import { ReplaceOperatorEvaluator } from './evaluators/replace-operator-evaluator';
import { RootOperatorEvaluator } from './evaluators/root-operator-evaluator';
import { RoundOperatorEvaluator } from './evaluators/round-operator-evaluator';
import { SqrtOperatorEvaluator } from './evaluators/sqrt-operator-evaluator';
import { SubtractionOperatorEvaluator } from './evaluators/subtraction-operator-evaluator';
import { UppercaseOperatorEvaluator } from './evaluators/uppercase-operator-evaluator';
import { XorOperatorEvaluator } from './evaluators/xor-operator-evaluator';
import { type OperatorEvaluator } from './operator-evaluator';
import {
  type BinaryOperatorTypeComputer,
  type TernaryOperatorTypeComputer,
  type UnaryOperatorTypeComputer,
} from './operator-type-computer';
import {
  type BinaryExpressionOperator,
  type TernaryExpressionOperator,
  type UnaryExpressionOperator,
} from './operator-types';
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
import { ReplaceOperatorTypeComputer } from './type-computers/replace-operator-type-computer';
import { SignOperatorTypeComputer } from './type-computers/sign-operator-type-computer';
import { SqrtOperatorTypeComputer } from './type-computers/sqrt-operator-type-computer';
import { StringTransformTypeComputer } from './type-computers/string-transform-type-computer';

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
