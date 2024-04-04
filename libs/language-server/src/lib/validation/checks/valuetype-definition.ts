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
import { type JayveeValidationProps } from '../validation-registry';

export function validateValuetypeDefinition(
  valuetype: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  checkSupertypeCycle(valuetype, props);
  checkConstraintsCollectionValues(valuetype, props);
  checkGenericsHaveNoDuplicate(valuetype, props);
}

function checkSupertypeCycle(
  valuetypeDefinition: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  const hasCycle =
    createValuetype(valuetypeDefinition)?.hasSupertypeCycle() ?? false;
  if (hasCycle) {
    assert(!valuetypeDefinition.isBuiltin);
    props.validationContext.accept(
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
  props: JayveeValidationProps,
): void {
  const constraintCollection = valuetype?.constraints;
  if (constraintCollection === undefined) {
    return;
  }

  const inferredCollectionType = inferExpressionType(
    constraintCollection,
    props.validationContext,
  );
  const expectedType = new CollectionValuetype(PrimitiveValuetypes.Constraint);
  if (inferredCollectionType === undefined) {
    return;
  }
  if (!inferredCollectionType.isConvertibleTo(expectedType)) {
    props.validationContext.accept(
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
    props.evaluationContext,
    props.wrapperFactory,
    props.validationContext,
  );
  assert(expectedType.isInternalValueRepresentation(constraints));

  constraints.forEach((constraint, index) => {
    checkConstraintMatchesValuetype(
      valuetype,
      constraint,
      constraintCollection,
      index,
      props,
    );
  });
}

function checkConstraintMatchesValuetype(
  valuetypeDefinition: ValuetypeDefinition,
  constraint: ConstraintDefinition,
  diagnosticNode: CollectionLiteral,
  diagnosticIndex: number,
  props: JayveeValidationProps,
): void {
  const actualValuetype = createValuetype(valuetypeDefinition);
  const compatibleValuetype = getCompatibleValuetype(constraint, props);

  if (actualValuetype === undefined || compatibleValuetype === undefined) {
    return;
  }

  if (!actualValuetype.isConvertibleTo(compatibleValuetype)) {
    props.validationContext.accept(
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
  props: JayveeValidationProps,
): Valuetype | undefined {
  if (isTypedConstraintDefinition(constraint)) {
    if (props.wrapperFactory.ConstraintType.canWrap(constraint.type)) {
      return undefined;
    }
    return props.wrapperFactory.ConstraintType.wrap(constraint.type).on;
  } else if (isExpressionConstraintDefinition(constraint)) {
    return createValuetype(constraint?.valuetype);
  }
  assertUnreachable(constraint);
}

function checkGenericsHaveNoDuplicate(
  valuetypeDefinition: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  const generics = valuetypeDefinition.genericDefinition?.generics;
  if (generics === undefined) {
    return;
  }

  const duplicates = getDuplicateGenerics(generics);

  duplicates.forEach((generic) => {
    props.validationContext.accept(
      'error',
      `Generic parameter ${generic.name} is not unique`,
      {
        node: generic,
        property: 'name',
      },
    );
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
