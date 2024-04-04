// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { createValuetype } from '../../ast';
import {
  ValuetypeReference,
  isBuiltinBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateValuetypeReference(
  valuetypeRef: ValuetypeReference,
  props: JayveeValidationProps,
): void {
  checkGenericsMatchDefinition(valuetypeRef, props);
  checkIsValuetypeReferenceable(valuetypeRef, props);
}

function checkGenericsMatchDefinition(
  valuetypeRef: ValuetypeReference,
  props: JayveeValidationProps,
): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const valuetypeDefinition = valuetypeRef.reference?.ref;
  if (valuetypeDefinition === undefined) {
    return;
  }

  const requiredGenerics =
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    valuetypeDefinition.genericDefinition?.generics?.length ?? 0;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const givenGenerics = valuetypeRef?.genericRefs?.length ?? 0;

  if (givenGenerics !== requiredGenerics) {
    props.validationContext.accept(
      'error',
      `The referenced valuetype ${valuetypeDefinition.name} requires ${requiredGenerics} generic parameters but found ${givenGenerics}.`,
      {
        node: valuetypeRef,
      },
    );
  }
}

function checkIsValuetypeReferenceable(
  valuetypeRef: ValuetypeReference,
  props: JayveeValidationProps,
): void {
  const valuetype = createValuetype(valuetypeRef);
  if (valuetype === undefined) {
    return;
  }

  const isUsedInBuiltinDefinition =
    isBuiltinBlocktypeDefinition(valuetypeRef.$container.$container) ||
    isBuiltinConstrainttypeDefinition(valuetypeRef.$container.$container);
  if (isUsedInBuiltinDefinition) {
    return;
  }

  if (valuetype.isReferenceableByUser()) {
    return;
  }

  props.validationContext.accept(
    'error',
    `Valuetype ${valuetype.getName()} cannot be referenced in this context`,
    {
      node: valuetypeRef,
    },
  );
}
