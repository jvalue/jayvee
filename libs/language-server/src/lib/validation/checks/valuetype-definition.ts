// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import {
  CollectionLiteral,
  CollectionValuetype,
  ConstraintDefinition,
  EvaluationContext,
  PrimitiveValuetypes,
  Valuetype,
  createValuetype,
  evaluateExpression,
  inferExpressionType,
  isExpressionConstraintDefinition,
  isTypedConstraintDefinition,
} from '../../ast';
import { ValuetypeDefinition } from '../../ast/generated/ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';

export function validateValuetypeDefinition(
  valuetype: ValuetypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  checkSupertypeCycle(valuetype, validationContext);
  checkConstraintsCollectionValues(
    valuetype,
    validationContext,
    evaluationContext,
  );
}

function checkSupertypeCycle(
  valuetypeDefinition: ValuetypeDefinition,
  context: ValidationContext,
): void {
  const hasCycle =
    createValuetype(valuetypeDefinition)?.hasSupertypeCycle() ?? false;
  if (hasCycle) {
    context.accept(
      'error',
      'Could not construct this valuetype since there is a cycle in the (transitive) "oftype" relation.',
      {
        node: valuetypeDefinition,
        property: 'type',
      },
    );
  }
}

function checkConstraintsCollectionValues(
  valuetype: ValuetypeDefinition,
  validationContext: ValidationContext,
  evaluationContext: EvaluationContext,
): void {
  const constraintCollection = valuetype?.constraints;
  if (constraintCollection === undefined) {
    return;
  }

  const inferredCollectionType = inferExpressionType(
    constraintCollection,
    validationContext,
  );
  const expectedType = new CollectionValuetype(PrimitiveValuetypes.Constraint);
  if (inferredCollectionType === undefined) {
    return;
  }
  if (!inferredCollectionType.isConvertibleTo(expectedType)) {
    validationContext.accept(
      'error',
      `The value needs to be of type ${expectedType.getName()} but is of type ${inferredCollectionType.getName()}`,
      {
        node: constraintCollection,
      },
    );
    return;
  }

  const constraints = evaluateExpression(
    constraintCollection,
    evaluationContext,
    validationContext,
  );
  assert(expectedType.isInternalValueRepresentation(constraints));

  constraints.forEach((constraint, index) => {
    checkConstraintMatchesValuetype(
      valuetype,
      constraint,
      constraintCollection,
      index,
      validationContext,
    );
  });
}

function checkConstraintMatchesValuetype(
  valuetypeDefinition: ValuetypeDefinition,
  constraint: ConstraintDefinition,
  diagnosticNode: CollectionLiteral,
  diagnosticIndex: number,
  context: ValidationContext,
): void {
  const actualValuetype = createValuetype(valuetypeDefinition);
  const compatibleValuetype = getCompatibleValuetype(constraint);

  if (actualValuetype === undefined || compatibleValuetype === undefined) {
    return;
  }

  if (!actualValuetype.isConvertibleTo(compatibleValuetype)) {
    context.accept(
      'error',
      `This valuetype ${actualValuetype.getName()} is not convertible to the type ${compatibleValuetype.getName()} of the constraint "${
        constraint.name
      }"`,
      {
        node: diagnosticNode,
        property: 'values',
        index: diagnosticIndex,
      },
    );
  }
}

function getCompatibleValuetype(
  constraint: ConstraintDefinition,
): Valuetype | undefined {
  if (isTypedConstraintDefinition(constraint)) {
    const constraintMetaInf = getMetaInformation(constraint?.type);
    return constraintMetaInf?.compatibleValuetype;
  } else if (isExpressionConstraintDefinition(constraint)) {
    return createValuetype(constraint?.valuetype);
  }
  assertUnreachable(constraint);
}
