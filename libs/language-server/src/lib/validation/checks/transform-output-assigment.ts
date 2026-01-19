// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */

import { assertUnreachable } from 'langium';

import { inferExpressionType } from '../../ast/expressions/type-inference';
import {
  type Expression,
  type ReferenceLiteral,
  type TransformOutputAssignment,
  isBinaryExpression,
  isExpressionLiteral,
  isReferenceLiteral,
  isTableRowLiteral,
  isTernaryExpression,
  isTransformPortDefinition,
  isUnaryExpression,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';
import { checkExpressionSimplification } from '../validation-util';
import { isAtomicValueType } from '../../ast';
// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

export function validateTransformOutputAssignment(
  outputAssignment: TransformOutputAssignment,
  props: JayveeValidationProps,
): void {
  checkOutputValueTyping(outputAssignment, props);
  checkOutputNotInAssignmentExpression(outputAssignment, props);
}

function checkOutputValueTyping(
  outputAssignment: TransformOutputAssignment,
  props: JayveeValidationProps,
): void {
  const assignmentExpression = outputAssignment?.expression;
  if (assignmentExpression === undefined) {
    return;
  }

  const outputType = outputAssignment?.outPortName?.ref?.valueType;
  if (outputType === undefined) {
    return;
  }

  const inferredType = inferExpressionType(
    assignmentExpression,
    props.validationContext,
    props.valueTypeProvider,
    props.wrapperFactories,
  );

  const expectedType = props.wrapperFactories.ValueType.wrap(outputType);
  if (expectedType === undefined) {
    return;
  }

  if (
    isTableRowLiteral(assignmentExpression) &&
    !isAtomicValueType(expectedType)
  ) {
    props.validationContext.accept(
      'error',
      `The output type of a Table Row transform must be user created`,
      { node: outputType },
    );
    return;
  }

  if (inferredType === undefined && isTableRowLiteral(assignmentExpression)) {
    assert(isAtomicValueType(expectedType));

    const schema = expectedType.getSchema();
    for (const [columnName, columnValueType] of schema) {
      const cell = assignmentExpression.cells.find(
        (cell) => cell.name == columnName,
      );
      if (cell === undefined) {
        props.validationContext.accept(
          'error',
          `The table row expression must contain an assignment for the property ${columnName}`,
          { node: assignmentExpression },
        );
        return;
      }
      const cellValueType = inferExpressionType(
        cell.expression,
        props.validationContext,
        props.valueTypeProvider,
        props.wrapperFactories,
      );
      if (cellValueType === undefined) {
        props.validationContext.accept('error', `Could not infer value type`, {
          node: cell.expression,
        });
        return;
      }
      if (
        !cellValueType.isConvertibleTo(columnValueType) &&
        !columnValueType.isConvertibleTo(cellValueType)
      ) {
        props.validationContext.accept(
          'error',
          `${cellValueType.getName()} is not convertible to ${columnValueType.getName()}`,
          {
            node: cell.expression,
          },
        );
      }
    }
    for (const cell of assignmentExpression.cells) {
      if (!schema.has(cell.name)) {
        props.validationContext.accept(
          'error',
          `${expectedType.getName()} does not have any properties with name ${cell.name}`,
          {
            node: cell,
          },
        );
      }
    }
    return;
  }

  if (inferredType === undefined) {
    return;
  }

  if (!inferredType.isConvertibleTo(expectedType)) {
    props.validationContext.accept(
      'error',
      `The value needs to be of type ${expectedType.getName()} but is of type ${inferredType.getName()}`,
      {
        node: assignmentExpression,
      },
    );
    return;
  }

  checkExpressionSimplification(assignmentExpression, props);
}

function checkOutputNotInAssignmentExpression(
  outputAssignment: TransformOutputAssignment,
  props: JayveeValidationProps,
): void {
  const referenceLiterals = extractReferenceLiterals(
    outputAssignment?.expression,
  );

  referenceLiterals.forEach((referenceLiteral) => {
    const referenced = referenceLiteral?.value?.ref;
    if (!isTransformPortDefinition(referenced)) {
      return;
    }
    if (referenced?.kind === 'to') {
      props.validationContext.accept(
        'error',
        'Output ports are not allowed in this expression',
        {
          node: referenceLiteral,
        },
      );
    }
  });
}

export function extractReferenceLiterals(
  expression: Expression | undefined,
): ReferenceLiteral[] {
  if (expression === undefined) {
    return [];
  }

  if (isExpressionLiteral(expression)) {
    if (isReferenceLiteral(expression)) {
      return [expression];
    }
    return [];
  } else if (isTernaryExpression(expression)) {
    return [
      ...extractReferenceLiterals(expression.first),
      ...extractReferenceLiterals(expression.second),
      ...extractReferenceLiterals(expression.third),
    ];
  } else if (isBinaryExpression(expression)) {
    return [
      ...extractReferenceLiterals(expression.left),
      ...extractReferenceLiterals(expression.right),
    ];
  } else if (isUnaryExpression(expression)) {
    return extractReferenceLiterals(expression.expression);
  }
  assertUnreachable(expression);
}
