// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * See the FAQ section of README.md for an explanation why the following ESLint rule is disabled for this file.
 */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */

import { PrimitiveValuetypes, inferExpressionType } from '../../ast';
import {
  ValuetypeDefinition,
  isConstraintDefinition,
  isReferenceLiteral,
} from '../../ast/generated/ast';
import { getMetaInformation } from '../../meta-information/meta-inf-registry';
import { ValidationContext } from '../validation-context';

export function validateValuetypeDefinition(
  valuetype: ValuetypeDefinition,
  context: ValidationContext,
): void {
  checkConstraintsCollectionValues(valuetype, context);
  checkConstraintsMatchPrimitiveValuetype(valuetype, context);
}

function checkConstraintsCollectionValues(
  valuetype: ValuetypeDefinition,
  validationContext: ValidationContext,
): void {
  const constraintValues = valuetype?.constraints?.values;
  if (constraintValues === undefined) {
    return;
  }
  constraintValues.forEach((collectionValue) => {
    const type = inferExpressionType(collectionValue, validationContext);
    if (type !== PrimitiveValuetypes.Constraint) {
      validationContext.accept(
        'error',
        'Only constraints are allowed in this collection',
        {
          node: collectionValue,
        },
      );
    }
  });
}

function checkConstraintsMatchPrimitiveValuetype(
  valuetype: ValuetypeDefinition,
  context: ValidationContext,
): void {
  if (valuetype.type === undefined) {
    return;
  }

  const references =
    valuetype?.constraints?.values?.filter(isReferenceLiteral) ?? [];

  for (const reference of references) {
    const resolvedRef = reference?.value?.ref;
    if (resolvedRef === undefined) {
      continue;
    }
    if (!isConstraintDefinition(resolvedRef)) {
      continue;
    }
    const constraintType = resolvedRef?.type;

    if (constraintType === undefined) {
      continue;
    }

    const metaInf = getMetaInformation(constraintType);
    if (metaInf === undefined) {
      continue;
    }

    if (
      !metaInf.compatiblePrimitiveValuetypes.includes(valuetype.type.keyword)
    ) {
      context.accept(
        'error',
        `Only constraints for type "${valuetype.type.keyword}" are allowed in this collection`,
        {
          node: reference,
        },
      );
    }
  }
}
