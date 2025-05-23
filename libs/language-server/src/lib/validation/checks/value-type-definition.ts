// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type CollectionLiteral,
  type ConstraintDefinition,
  evaluateExpression,
  inferExpressionType,
} from '../../ast';
import {
  type ValuetypeDefinition,
  type ValuetypeGenericDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateValueTypeDefinition(
  valueType: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  checkSupertypeCycle(valueType, props);
  checkConstraintsCollectionValues(valueType, props);
  checkGenericsHaveNoDuplicate(valueType, props);
}

function checkSupertypeCycle(
  valueTypeDefinition: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  const hasCycle =
    props.wrapperFactories.ValueType.wrap(
      valueTypeDefinition,
    )?.hasSupertypeCycle() ?? false;
  if (hasCycle) {
    assert(
      !valueTypeDefinition.isBuiltin,
      "`builtin` valuetypes don't have cycles",
    );
    assert(
      valueTypeDefinition.attribute?.type !== undefined,
      '`hasCycle == true`, so `valueTypeDefinition` MUST have an attribute with a type',
    );
    props.validationContext.accept(
      'error',
      'Could not construct this value type since there is a cycle in the (transitive) "oftype" relation.',
      {
        node: valueTypeDefinition.attribute,
        property: 'type',
      },
    );
  }
}

function checkConstraintsCollectionValues(
  valueType: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  const constraintCollection = valueType?.constraints;
  if (constraintCollection === undefined) {
    return;
  }

  const inferredCollectionType = inferExpressionType(
    constraintCollection,
    props.validationContext,
    props.valueTypeProvider,
    props.wrapperFactories,
  );
  const expectedType = props.valueTypeProvider.createCollectionValueTypeOf(
    props.valueTypeProvider.Primitives.Constraint,
  );
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
    props.wrapperFactories,
    props.validationContext,
  );
  assert(expectedType.isInternalValueRepresentation(constraints));

  constraints.forEach((constraint, index) => {
    checkConstraintMatchesValuetype(
      valueType,
      constraint,
      constraintCollection,
      index,
      props,
    );
  });
}

function checkConstraintMatchesValuetype(
  valueTypeDefinition: ValuetypeDefinition,
  constraint: ConstraintDefinition,
  diagnosticNode: CollectionLiteral,
  diagnosticIndex: number,
  props: JayveeValidationProps,
): void {
  const actualValuetype =
    props.wrapperFactories.ValueType.wrap(valueTypeDefinition);
  const compatibleValuetype = props.wrapperFactories.ValueType.wrap(
    constraint?.valueType,
  );

  if (actualValuetype === undefined || compatibleValuetype === undefined) {
    return;
  }

  if (!actualValuetype.isConvertibleTo(compatibleValuetype)) {
    props.validationContext.accept(
      'error',
      `This value type ${actualValuetype.getName()} is not convertible to the type ${compatibleValuetype.getName()} of the constraint "${
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

function checkGenericsHaveNoDuplicate(
  valueTypeDefinition: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  const generics = valueTypeDefinition.genericDefinition?.generics;
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
