// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { createValuetype } from '../../ast';
import {
  ValuetypeReference,
  isBuiltinBlocktypeDefinition,
} from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

export function validateValuetypeReference(
  valuetypeRef: ValuetypeReference,
  validationContext: ValidationContext,
): void {
  checkGenericsMatchDefinition(valuetypeRef, validationContext);
  checkIsValuetypeReferenceable(valuetypeRef, validationContext);
}

function checkGenericsMatchDefinition(
  valuetypeRef: ValuetypeReference,
  context: ValidationContext,
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
    context.accept(
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
  context: ValidationContext,
): void {
  const valuetype = createValuetype(valuetypeRef);
  if (valuetype === undefined) {
    return;
  }

  const isUsedInBuiltinBlocktype = isBuiltinBlocktypeDefinition(
    valuetypeRef.$container.$container,
  );
  if (isUsedInBuiltinBlocktype) {
    return;
  }

  if (valuetype.isReferenceableByUser()) {
    return;
  }

  context.accept(
    'error',
    `Valuetype ${valuetype.getName()} cannot be referenced in this context`,
    {
      node: valuetypeRef,
    },
  );
}
