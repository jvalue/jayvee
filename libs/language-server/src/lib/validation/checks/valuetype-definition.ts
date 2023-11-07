// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
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
import {
  ValuetypeDefinition,
  ValuetypeGenericDefinition,
} from '../../ast/generated/ast';
import { ConstraintMetaInformation } from '../../meta-information';
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
  checkGenericsHaveNoDuplicate(valuetype, validationContext);
}

function checkSupertypeCycle(
  valuetypeDefinition: ValuetypeDefinition,
  context: ValidationContext,
): void {
  const hasCycle =
    createValuetype(valuetypeDefinition)?.hasSupertypeCycle() ?? false;
  if (hasCycle) {
    assert(!valuetypeDefinition.isBuiltin);
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
    if (ConstraintMetaInformation.canBeWrapped(constraint.type)) {
      return undefined;
    }
    return new ConstraintMetaInformation(constraint.type).on;
  } else if (isExpressionConstraintDefinition(constraint)) {
    return createValuetype(constraint?.valuetype);
  }
  assertUnreachable(constraint);
}

function checkGenericsHaveNoDuplicate(
  valuetypeDefinition: ValuetypeDefinition,
  context: ValidationContext,
): void {
  const generics = valuetypeDefinition.genericDefinition?.generics;
  if (generics === undefined) {
    return;
  }

  const duplicates = getDuplicateGenerics(generics);

  duplicates.forEach((generic) => {
    context.accept('error', `Generic parameter ${generic.name} is not unique`, {
      node: generic,
      property: 'name',
    });
  });
}

function getDuplicateGenerics(
  generics: ValuetypeGenericDefinition[],
): ValuetypeGenericDefinition[] {
  const countPerGenericName = generics
    .map((generic) => {
      return { name: generic.name, count: 1 };
    })
    .reduce((result: Record<string, number>, current) => {
      const currentName = current.name;
      result[currentName] = (result[currentName] ?? 0) + 1;
      return result;
    }, {});
  const duplicateGenericNames = Object.entries(countPerGenericName)
    .filter(([, occurences]) => occurences > 1)
    .map(([generic]) => generic);

  const duplicates: ValuetypeGenericDefinition[] = [];
  duplicateGenericNames.forEach((genericName) => {
    duplicates.push(...generics.filter((x) => x.name === genericName));
  });
  return duplicates;
}
