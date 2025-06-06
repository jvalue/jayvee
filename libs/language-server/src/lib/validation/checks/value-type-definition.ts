// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/guides/working-with-the-ast/ for why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type ConstraintDefinition } from '../../ast';
import {
  type ValueTypeAttribute,
  type ValueTypeConstraintReference,
  type ValuetypeDefinition,
  type ValuetypeGenericDefinition,
  isValueTypeConstraintInlineDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

import { checkConstraintExpression } from './constraint-definition';

export function validateValueTypeDefinition(
  valueType: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  checkSupertypeCycle(valueType, props);
  checkConstraints(valueType, props);
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
      valueTypeDefinition.attribute?.valueType !== undefined,
      '`hasCycle == true`, so `valueTypeDefinition` MUST have an attribute with a type',
    );
    props.validationContext.accept(
      'error',
      'Could not construct this value type since there is a cycle in the (transitive) "oftype" relation.',
      {
        node: valueTypeDefinition.attribute,
        property: 'valueType',
      },
    );
  }
}

function checkConstraints(
  valueType: ValuetypeDefinition,
  props: JayveeValidationProps,
): void {
  const constraintReferences = valueType?.constraints;
  if (constraintReferences === undefined) {
    return;
  }

  const seenConstraintNames: Set<string> = new Set();

  constraintReferences.forEach((constraint) => {
    const name = constraint.name;
    assert(name !== undefined);
    if (seenConstraintNames.has(name)) {
      props.validationContext.accept(
        'error',
        'Constraint names must be unique',
        { node: constraint, property: 'name' },
      );
    } else {
      seenConstraintNames.add(name);
    }

    if (isValueTypeConstraintInlineDefinition(constraint)) {
      checkConstraintExpression(constraint.expression, props);
    } else {
      const constraintDef = constraint.definition.ref;
      assert(constraintDef !== undefined);
      const attribute = constraint.attribute.ref;
      assert(attribute !== undefined);
      checkConstraintMatchesAttribute(
        attribute,
        constraintDef,
        constraint,
        props,
      );
    }
  });
}

function checkConstraintMatchesAttribute(
  attribute: ValueTypeAttribute,
  constraint: ConstraintDefinition,
  diagnosticNode: ValueTypeConstraintReference,
  props: JayveeValidationProps,
): void {
  const actualValuetype = props.wrapperFactories.ValueType.wrap(
    attribute.valueType,
  );
  const compatibleValuetype = props.wrapperFactories.ValueType.wrap(
    constraint?.valueType,
  );

  if (actualValuetype === undefined || compatibleValuetype === undefined) {
    return;
  }

  if (!actualValuetype.isConvertibleTo(compatibleValuetype)) {
    props.validationContext.accept(
      'error',
      `'${constraint.name}' cannot constrain '${
        attribute.name
      }', because '${compatibleValuetype.getName()}' is incompatible with '${actualValuetype.getName()}'`,
      {
        node: diagnosticNode,
        property: 'attribute',
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
