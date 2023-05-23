// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { strict as assert } from 'assert';

import {
  ConstraintDefinition,
  EvaluationContext,
  Expression,
  PrimitiveValuetypes,
  evaluateExpression,
  getValuetype,
  hasSupertypeCycle,
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
  if (context.hasErrorOccurred()) {
    return;
  }
  checkConstraintsCollectionValues(valuetype, context);
}

function checkSupertypeCycle(
  valuetypeDefinition: ValuetypeDefinition,
  context: ValidationContext,
): void {
  const hasCycle = hasSupertypeCycle(valuetypeDefinition);
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
    checkConstraintMatchesPrimitiveValuetype(
      valuetype,
      constraint,
      expression,
      context,
    );
  });
}

function checkConstraintMatchesPrimitiveValuetype(
  valuetypeDefinition: ValuetypeDefinition,
  constraint: ConstraintDefinition,
  diagnosticNode: Expression,
  context: ValidationContext,
): void {
  if (valuetypeDefinition.type === undefined) {
    return;
  }

  const constraintType = constraint.type;

  if (constraintType === undefined) {
    return;
  }

  const metaInf = getMetaInformation(constraintType);
  if (metaInf === undefined) {
    return;
  }

  const valuetype = getValuetype(valuetypeDefinition);
  if (valuetype === undefined) {
    return;
  }

  if (!valuetype.isConvertibleTo(metaInf.compatibleValuetype)) {
    context.accept(
      'error',
      `Only constraints for types convertible to "${metaInf.compatibleValuetype.getName()}" are allowed in this collection`,
      {
        node: diagnosticNode,
      },
    );
  }
}
