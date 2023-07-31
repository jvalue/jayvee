// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See https://jvalue.github.io/jayvee/docs/dev/working-with-the-ast for why the following ESLint rule is disabled for this file.
 */

import { ValuetypeReference } from '../../ast/generated/ast';
import { ValidationContext } from '../validation-context';

export function validateValuetypeReference(
  valuetypeRef: ValuetypeReference,
  validationContext: ValidationContext,
): void {
  checkGenericsMatchDefinition(valuetypeRef, validationContext);
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
