// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium';

import {
  ConstraintDefinition,
  EvaluationContext,
  Expression,
  PrimitiveValuetypes,
  Valuetype,
  createValuetype,
  evaluateExpression,
  isExpressionConstraintDefinition,
  isTypedConstraintDefinition,
  validateTypedCollection,
} from '../../ast';
import { ValuetypeDefinition } from '../../ast/generated/ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';

export function validateValuetypeDefinition(
  valuetype: ValuetypeDefinition,
  context: ValidationContext,
): void {
  checkSupertypeCycle(valuetype, context);
  checkConstraintsCollectionValues(valuetype, context);
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
  context: ValidationContext,
): void {
  const constraintCollection = valuetype?.constraints;
  if (constraintCollection === undefined) {
    return;
  }

  const { validItems, invalidItems } = validateTypedCollection(
    constraintCollection,
    [PrimitiveValuetypes.Constraint],
    context,
  );

  invalidItems.forEach((expression) => {
    context.accept('error', 'Only constraints are allowed in this collection', {
      node: expression,
    });
  });

  validItems.forEach((expression) => {
    const constraint = evaluateExpression(
      expression,
      new EvaluationContext(), // we don't know values of runtime parameters or variables at this point
      context,
    );
    if (constraint === undefined) {
      return;
    }
    assert(
      PrimitiveValuetypes.Constraint.isInternalValueRepresentation(constraint),
    );
    checkConstraintMatchesValuetype(valuetype, constraint, expression, context);
  });
}

function checkConstraintMatchesValuetype(
  valuetypeDefinition: ValuetypeDefinition,
  constraint: ConstraintDefinition,
  diagnosticNode: Expression,
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
