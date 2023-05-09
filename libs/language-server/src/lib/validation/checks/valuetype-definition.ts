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
  isConstraintReferenceLiteral,
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
  const constraints = valuetype.constraints;
  constraints.values.forEach((collectionValue) => {
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

  const constraintReferences = valuetype?.constraints?.values.filter(
    isConstraintReferenceLiteral,
  );
  for (const constraintReference of constraintReferences) {
    const constraint = constraintReference?.value.ref;
    const constraintType = constraint?.type;

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
          node: constraintReference,
        },
      );
    }
  }
}
