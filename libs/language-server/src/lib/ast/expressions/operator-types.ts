import {
  BinaryExpression,
  TernaryExpression,
  UnaryExpression,
} from '../generated/ast';

export type UnaryExpressionOperator = UnaryExpression['operator'];
export type BinaryExpressionOperator = BinaryExpression['operator'];
export type TernaryExpressionOperator = TernaryExpression['operator'];
