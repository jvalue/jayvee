// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { AstNode, assertUnreachable } from 'langium';

// eslint-disable-next-line import/no-cycle
import { getMetaInformation } from '../meta-information/meta-inf-registry';
// eslint-disable-next-line import/no-cycle
import { ValidationContext } from '../validation';

import {
  BinaryExpression,
  BlockDefinition,
  Expression,
  ExpressionLiteral,
  PipelineDefinition,
  PrimitiveValuetypeKeywordLiteral,
  PropertyValueLiteral,
  UnaryExpression,
  ValuetypeDefinitionReference,
  isBinaryExpression,
  isBooleanLiteral,
  isCellRangeLiteral,
  isCollectionLiteral,
  isConstraintReferenceLiteral,
  isExpression,
  isExpressionLiteral,
  isNumericLiteral,
  isRegexLiteral,
  isTextLiteral,
  isUnaryExpression,
  isValuetypeAssignmentLiteral,
  isValuetypeDefinitionReference,
} from './generated/ast';
import { PipeWrapper, createSemanticPipes } from './wrappers/pipe-wrapper';

export function collectStartingBlocks(
  pipeline: PipelineDefinition,
): BlockDefinition[] {
  const result: BlockDefinition[] = [];
  for (const block of pipeline.blocks) {
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      continue;
    }

    if (!blockMetaInf.hasInput()) {
      result.push(block);
    }
  }
  return result;
}

export function collectChildren(block: BlockDefinition): BlockDefinition[] {
  const outgoingPipes = collectOutgoingPipes(block);
  return outgoingPipes.map((pipe) => pipe.to);
}

export function collectParents(block: BlockDefinition): BlockDefinition[] {
  const ingoingPipes = collectIngoingPipes(block);
  return ingoingPipes.map((pipe) => pipe.from);
}

export function collectOutgoingPipes(block: BlockDefinition) {
  return collectPipes(block, 'outgoing');
}

export function collectIngoingPipes(block: BlockDefinition) {
  return collectPipes(block, 'ingoing');
}

function collectPipes(
  block: BlockDefinition,
  kind: 'outgoing' | 'ingoing',
): PipeWrapper[] {
  const pipeline = block.$container;
  const allPipes = collectAllPipes(pipeline);

  return allPipes.filter((semanticPipe) => {
    switch (kind) {
      case 'outgoing':
        return semanticPipe.from === block;
      case 'ingoing':
        return semanticPipe.to === block;
    }
    return assertUnreachable(kind);
  });
}

export function collectAllPipes(pipeline: PipelineDefinition): PipeWrapper[] {
  const result: PipeWrapper[] = [];
  for (const pipe of pipeline.pipes) {
    result.push(...createSemanticPipes(pipe));
  }
  return result;
}

/**
 * Returns blocks in a pipeline in topological order, based on
 * Kahn's algorithm.
 *
 * Considers a pipeline as a directed, acyclical graph where
 * blocks are nodes and pipes are edges. A list in topological
 * order has the property that parent nodes are always listed
 * before their children.
 *
 * "[...] a list in topological order is such that no element
 * appears in it until after all elements appearing on all paths
 * leading to the particular element have been listed."
 *
 * Kahn, A. B. (1962). Topological sorting of large networks. Communications of the ACM, 5(11), 558–562.
 */
export function getBlocksInTopologicalSorting(
  pipeline: PipelineDefinition,
): BlockDefinition[] {
  const sortedNodes = [];
  const currentNodes = [...collectStartingBlocks(pipeline)];
  let unvisitedEdges = [...collectAllPipes(pipeline)];

  while (currentNodes.length > 0) {
    const node = currentNodes.pop();
    assert(node !== undefined);

    sortedNodes.push(node);

    for (const childNode of collectChildren(node)) {
      // Mark edges between parent and child as visited
      collectIngoingPipes(childNode)
        .filter((e) => e.from === node)
        .forEach((e) => {
          unvisitedEdges = unvisitedEdges.filter((edge) => !edge.equals(e));
        });

      // If all edges to the child have been visited
      const notRemovedEdges = collectIngoingPipes(childNode).filter((e) =>
        unvisitedEdges.some((edge) => edge.equals(e)),
      );
      if (notRemovedEdges.length === 0) {
        // Insert it into currentBlocks
        currentNodes.push(childNode);
      }
    }
  }

  // If the graph still contains unvisited edges it is not a DAG
  assert(
    unvisitedEdges.length === 0,
    `The pipeline ${pipeline.name} is expected to have no cycles`,
  );

  return sortedNodes;
}

export enum IOType {
  NONE = 'None',
  FILE = 'File',
  TEXT_FILE = 'TextFile',
  FILE_SYSTEM = 'FileSystem',
  SHEET = 'Sheet',
  TABLE = 'Table',
}

export enum PropertyValuetype {
  TEXT = 'text',
  INTEGER = 'integer',
  DECIMAL = 'decimal',
  BOOLEAN = 'boolean',
  CELL_RANGE = 'cell-range',
  REGEX = 'regex',
  COLLECTION = 'collection',
  VALUETYPE_ASSIGNMENT = 'valuetype-assignment',
  CONSTRAINT = 'constraint',
}

export function runtimeParameterAllowedForType(
  type: PropertyValuetype,
): boolean {
  switch (type) {
    case PropertyValuetype.CELL_RANGE:
    case PropertyValuetype.REGEX:
    case PropertyValuetype.VALUETYPE_ASSIGNMENT:
    case PropertyValuetype.COLLECTION:
    case PropertyValuetype.CONSTRAINT:
      return false;
    case PropertyValuetype.TEXT:
    case PropertyValuetype.INTEGER:
    case PropertyValuetype.DECIMAL:
    case PropertyValuetype.BOOLEAN:
      return true;
    default:
      assertUnreachable(type);
  }
}

export function isNumericType(
  type: PropertyValuetype | undefined,
): type is PropertyValuetype.INTEGER | PropertyValuetype.DECIMAL {
  if (type === undefined) {
    return false;
  }
  return (
    type === PropertyValuetype.INTEGER || type === PropertyValuetype.DECIMAL
  );
}

export function inferTypeFromValue(
  value: PropertyValueLiteral,
  context?: ValidationContext,
): PropertyValuetype | undefined {
  if (isCollectionLiteral(value)) {
    return PropertyValuetype.COLLECTION;
  }
  if (isCellRangeLiteral(value)) {
    return PropertyValuetype.CELL_RANGE;
  }
  if (isRegexLiteral(value)) {
    return PropertyValuetype.REGEX;
  }
  if (isValuetypeAssignmentLiteral(value)) {
    return PropertyValuetype.VALUETYPE_ASSIGNMENT;
  }
  if (isConstraintReferenceLiteral(value)) {
    return PropertyValuetype.CONSTRAINT;
  }
  if (isExpression(value)) {
    return inferTypeFromExpression(value, context);
  }
  assertUnreachable(value);
}

function inferTypeFromExpression(
  expression: Expression | undefined,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  if (expression === undefined) {
    return undefined;
  }
  if (isExpressionLiteral(expression)) {
    return inferTypeFromExpressionLiteral(expression);
  }
  if (isUnaryExpression(expression)) {
    const unaryOperator = expression.operator;
    switch (unaryOperator) {
      case 'not':
        return inferTypeFromUnaryLogicalExpression(expression, context);
      case '+':
      case '-':
        return inferTypeFromUnarySignExpression(expression, context);
      case 'sqrt':
        return inferTypeFromUnarySqrtExpression(expression, context);
      case 'floor':
      case 'ceil':
      case 'round':
        return inferTypeFromUnaryIntegerConversionExpression(
          expression,
          context,
        );
      default:
        assertUnreachable(unaryOperator);
    }
  }
  if (isBinaryExpression(expression)) {
    const binaryOperator = expression.operator;
    switch (binaryOperator) {
      case 'pow':
      case 'root':
        return inferTypeFromBinaryExponentialExpression(expression, context);
      case '*':
      case '/':
      case '%':
      case '+':
      case '-':
        return inferTypeFromBinaryArithmeticExpression(expression, context);
      case '<':
      case '<=':
      case '>':
      case '>=':
        return inferTypeFromBinaryRelationalExpression(expression, context);
      case '==':
      case '!=':
        return inferTypeFromBinaryEqualityExpression(expression, context);
      case 'xor':
      case 'and':
      case 'or':
        return inferTypeFromBinaryLogicalExpression(expression, context);
      default:
        assertUnreachable(binaryOperator);
    }
  }
  assertUnreachable(expression);
}

function inferTypeFromExpressionLiteral(
  expression: ExpressionLiteral,
): PropertyValuetype {
  if (isTextLiteral(expression)) {
    return PropertyValuetype.TEXT;
  }
  if (isBooleanLiteral(expression)) {
    return PropertyValuetype.BOOLEAN;
  }
  if (isNumericLiteral(expression)) {
    if (Number.isInteger(expression.value)) {
      return PropertyValuetype.INTEGER;
    }
    return PropertyValuetype.DECIMAL;
  }
  assertUnreachable(expression);
}

function inferTypeFromUnaryLogicalExpression(
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(expression.operator === 'not');
  const innerType = inferTypeFromExpression(expression.expression, context);
  if (innerType === undefined) {
    return undefined;
  }
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
}

function inferTypeFromUnarySignExpression(
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(expression.operator === '+' || expression.operator === '-');
  const innerType = inferTypeFromExpression(expression.expression, context);
  if (innerType === undefined) {
    return undefined;
  }
  if (!isNumericType(innerType)) {
    context?.accept(
      'error',
      `The operand needs to be of type ${PropertyValuetype.INTEGER} or ${PropertyValuetype.DECIMAL} but is of type ${innerType}`,
      {
        node: expression.expression,
      },
    );
    return undefined;
  }
  return innerType;
}

function inferTypeFromUnarySqrtExpression(
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(expression.operator === 'sqrt');
  const innerType = inferTypeFromExpression(expression.expression, context);
  if (innerType === undefined) {
    return undefined;
  }
  if (!isNumericType(innerType)) {
    context?.accept(
      'error',
      `The operand needs to be of type ${PropertyValuetype.INTEGER} or ${PropertyValuetype.DECIMAL} but is of type ${innerType}`,
      {
        node: expression.expression,
      },
    );
    return undefined;
  }
  return PropertyValuetype.DECIMAL;
}

function inferTypeFromUnaryIntegerConversionExpression(
  expression: UnaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(
    expression.operator === 'floor' ||
      expression.operator === 'ceil' ||
      expression.operator === 'round',
  );
  const innerType = inferTypeFromExpression(expression.expression, context);
  if (innerType === undefined) {
    return undefined;
  }
  if (!isNumericType(innerType)) {
    context?.accept(
      'error',
      `The operand needs to be of type ${PropertyValuetype.DECIMAL} but is of type ${innerType}`,
      {
        node: expression.expression,
      },
    );
    return undefined;
  }
  if (innerType === PropertyValuetype.INTEGER) {
    context?.accept(
      'warning',
      `The operator ${expression.operator} has no effect because the operand is already of type ${PropertyValuetype.INTEGER}`,
      {
        node: expression.expression,
      },
    );
  }
  return PropertyValuetype.INTEGER;
}

function inferTypeFromBinaryExponentialExpression(
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(expression.operator === 'pow' || expression.operator === 'root');

  const leftType = inferTypeFromExpression(expression.left, context);
  const rightType = inferTypeFromExpression(expression.right, context);
  if (leftType === undefined || rightType === undefined) {
    return undefined;
  }
  if (!isNumericType(leftType) || !isNumericType(rightType)) {
    if (!isNumericType(leftType)) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} or ${PropertyValuetype.INTEGER} but is of type ${leftType}`,
        {
          node: expression.left,
        },
      );
    }
    if (!isNumericType(rightType)) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} or ${PropertyValuetype.INTEGER} but is of type ${rightType}`,
        {
          node: expression.right,
        },
      );
    }
    return undefined;
  }
  return PropertyValuetype.DECIMAL;
}

function inferTypeFromBinaryArithmeticExpression(
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(
    expression.operator === '+' ||
      expression.operator === '-' ||
      expression.operator === '*' ||
      expression.operator === '/' ||
      expression.operator === '%',
  );

  const leftType = inferTypeFromExpression(expression.left, context);
  const rightType = inferTypeFromExpression(expression.right, context);
  if (leftType === undefined || rightType === undefined) {
    return undefined;
  }
  if (!isNumericType(leftType) || !isNumericType(rightType)) {
    if (!isNumericType(leftType)) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} or ${PropertyValuetype.INTEGER} but is of type ${leftType}`,
        {
          node: expression.left,
        },
      );
    }
    if (!isNumericType(rightType)) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} or ${PropertyValuetype.INTEGER} but is of type ${rightType}`,
        {
          node: expression.right,
        },
      );
    }
    return undefined;
  }
  if (
    leftType === PropertyValuetype.INTEGER &&
    rightType === PropertyValuetype.INTEGER &&
    expression.operator !== '/'
  ) {
    return PropertyValuetype.INTEGER;
  }
  return PropertyValuetype.DECIMAL;
}

function inferTypeFromBinaryRelationalExpression(
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(
    expression.operator === '<' ||
      expression.operator === '<=' ||
      expression.operator === '>' ||
      expression.operator === '>=',
  );

  const leftType = inferTypeFromExpression(expression.left, context);
  const rightType = inferTypeFromExpression(expression.right, context);
  if (leftType === undefined || rightType === undefined) {
    return undefined;
  }
  if (!isNumericType(leftType) || !isNumericType(rightType)) {
    if (!isNumericType(leftType)) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} or ${PropertyValuetype.INTEGER} but is of type ${leftType}`,
        {
          node: expression.left,
        },
      );
    }
    if (!isNumericType(rightType)) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.DECIMAL} or ${PropertyValuetype.INTEGER} but is of type ${rightType}`,
        {
          node: expression.right,
        },
      );
    }
    return undefined;
  }
  if (leftType !== rightType) {
    context?.accept(
      'warning',
      `The operands are of different numeric types (left: ${leftType}, right: ${rightType})`,
      {
        node: expression,
      },
    );
  }
  return PropertyValuetype.BOOLEAN;
}

function inferTypeFromBinaryEqualityExpression(
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(expression.operator === '==' || expression.operator === '!=');

  const leftType = inferTypeFromExpression(expression.left, context);
  const rightType = inferTypeFromExpression(expression.right, context);
  if (leftType === undefined || rightType === undefined) {
    return undefined;
  }
  if (leftType !== rightType) {
    if (isNumericType(leftType) && isNumericType(rightType)) {
      context?.accept(
        'warning',
        `The operands are of different numeric types (left: ${leftType}, right: ${rightType})`,
        {
          node: expression,
        },
      );
    } else {
      context?.accept(
        'error',
        `The types of the operands need to be equal but they differ (left: ${leftType}, right: ${rightType})`,
        { node: expression },
      );
      return undefined;
    }
  }

  return PropertyValuetype.BOOLEAN;
}

function inferTypeFromBinaryLogicalExpression(
  expression: BinaryExpression,
  context: ValidationContext | undefined,
): PropertyValuetype | undefined {
  assert(
    expression.operator === 'xor' ||
      expression.operator === 'and' ||
      expression.operator === 'or',
  );

  const leftType = inferTypeFromExpression(expression.left, context);
  const rightType = inferTypeFromExpression(expression.right, context);
  if (leftType === undefined || rightType === undefined) {
    return undefined;
  }
  if (
    leftType !== PropertyValuetype.BOOLEAN ||
    rightType !== PropertyValuetype.BOOLEAN
  ) {
    if (leftType !== PropertyValuetype.BOOLEAN) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.BOOLEAN} but is of type ${leftType}`,
        {
          node: expression.left,
        },
      );
    }
    if (rightType !== PropertyValuetype.BOOLEAN) {
      context?.accept(
        'error',
        `The operand needs to be of type ${PropertyValuetype.BOOLEAN} but is of type ${rightType}`,
        {
          node: expression.right,
        },
      );
    }
    return undefined;
  }
  return PropertyValuetype.BOOLEAN;
}

export enum EvaluationStrategy {
  EXHAUSTIVE,
  LAZY,
}

export function evaluateExpression(
  expression: Expression,
  strategy: EvaluationStrategy = EvaluationStrategy.LAZY,
  context: ValidationContext | undefined = undefined,
): boolean | number | string | undefined {
  if (isExpressionLiteral(expression)) {
    return expression.value;
  }
  if (isUnaryExpression(expression)) {
    const innerValue = evaluateExpression(
      expression.expression,
      strategy,
      context,
    );
    if (innerValue === undefined) {
      return undefined;
    }

    const unaryOperator = expression.operator;
    switch (unaryOperator) {
      case 'not': {
        assert(typeof innerValue === 'boolean');
        return !innerValue;
      }
      case '+': {
        assert(typeof innerValue === 'number');
        return innerValue;
      }
      case '-': {
        assert(typeof innerValue === 'number');
        return -innerValue;
      }
      case 'sqrt': {
        assert(typeof innerValue === 'number');

        const resultingValue = Math.sqrt(innerValue);

        if (!isFinite(resultingValue)) {
          assert(innerValue < 0);
          context?.accept(
            'error',
            'Arithmetic error: square root of negative number',
            { node: expression },
          );
          return undefined;
        }
        return resultingValue;
      }
      case 'floor': {
        assert(typeof innerValue === 'number');
        return Math.floor(innerValue);
      }
      case 'ceil': {
        assert(typeof innerValue === 'number');
        return Math.ceil(innerValue);
      }
      case 'round': {
        assert(typeof innerValue === 'number');
        return Math.round(innerValue);
      }
      default:
        assertUnreachable(unaryOperator);
    }
  }
  if (isBinaryExpression(expression)) {
    const binaryOperator = expression.operator;
    const leftValue = evaluateExpression(expression.left, strategy, context);
    if (leftValue === undefined && strategy === EvaluationStrategy.LAZY) {
      return undefined;
    }
    switch (binaryOperator) {
      case 'pow': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');

        const resultingValue = leftValue ** rightValue;

        if (!isFinite(resultingValue)) {
          assert(leftValue === 0 && rightValue < 0);
          context?.accept(
            'error',
            'Arithmetic error: zero raised to a negative number',
            { node: expression },
          );
          return undefined;
        }

        return resultingValue;
      }
      case 'root': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');

        const resultingValue = leftValue ** (1 / rightValue);

        if (!isFinite(resultingValue)) {
          if (leftValue === 0 && rightValue < 0) {
            context?.accept(
              'error',
              'Arithmetic error: root of zero with negative degree',
              { node: expression },
            );
          } else if (rightValue === 0) {
            context?.accept('error', 'Arithmetic error: root of degree zero', {
              node: expression,
            });
          } else {
            assert(false);
          }
          return undefined;
        }

        return resultingValue;
      }
      case '*': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue * rightValue;
      }
      case '/': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');

        const resultingValue = leftValue / rightValue;

        if (!isFinite(resultingValue)) {
          assert(rightValue === 0);
          context?.accept('error', 'Arithmetic error: division by zero', {
            node: expression,
          });
          return undefined;
        }

        return resultingValue;
      }
      case '%': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');

        const resultingValue = leftValue % rightValue;

        if (!isFinite(resultingValue)) {
          assert(rightValue === 0);
          context?.accept('error', 'Arithmetic error: modulo by zero', {
            node: expression,
          });
          return undefined;
        }

        return resultingValue;
      }
      case '+': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue + rightValue;
      }
      case '-': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue - rightValue;
      }
      case '<': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue < rightValue;
      }
      case '<=': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue <= rightValue;
      }
      case '>': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue > rightValue;
      }
      case '>=': {
        assert(typeof leftValue === 'number');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'number');
        return leftValue >= rightValue;
      }
      case '==': {
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof leftValue === typeof rightValue);
        return leftValue === rightValue;
      }
      case '!=': {
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof leftValue === typeof rightValue);
        return leftValue !== rightValue;
      }
      case 'xor': {
        assert(typeof leftValue === 'boolean');
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'boolean');
        return (leftValue && !rightValue) || (!leftValue && rightValue);
      }
      case 'and': {
        assert(typeof leftValue === 'boolean');
        if (!leftValue && strategy === EvaluationStrategy.LAZY) {
          return false;
        }
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'boolean');
        return rightValue;
      }
      case 'or': {
        assert(typeof leftValue === 'boolean');
        if (leftValue && strategy === EvaluationStrategy.LAZY) {
          return true;
        }
        const rightValue = evaluateExpression(
          expression.right,
          strategy,
          context,
        );
        if (rightValue === undefined) {
          return undefined;
        }
        assert(typeof rightValue === 'boolean');
        return rightValue;
      }
      default:
        assertUnreachable(binaryOperator);
    }
  }
  assertUnreachable(expression);
}

export function getValuetypeName(
  valuetype: PrimitiveValuetypeKeywordLiteral | ValuetypeDefinitionReference,
): string {
  if (isValuetypeDefinitionReference(valuetype)) {
    return valuetype.reference.$refText;
  }
  return valuetype.keyword;
}

export type AstTypeGuard<T extends AstNode = AstNode> = (
  obj: unknown,
) => obj is T;
