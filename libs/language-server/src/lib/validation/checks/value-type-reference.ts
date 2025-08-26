// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueTypeReference,
  isBuiltinBlockTypeDefinition,
} from '../../ast/generated/ast';
import { type JayveeValidationProps } from '../validation-registry';

export function validateValueTypeReference(
  valueTypeRef: ValueTypeReference,
  props: JayveeValidationProps,
): void {
  checkGenericsMatchDefinition(valueTypeRef, props);
  checkIsValueTypeReferenceable(valueTypeRef, props);
}

function checkGenericsMatchDefinition(
  valueTypeRef: ValueTypeReference,
  props: JayveeValidationProps,
): void {
  const valueTypeDefinition = valueTypeRef.reference?.ref;
  if (valueTypeDefinition === undefined) {
    return;
  }

  const requiredGenerics =
    valueTypeDefinition.genericDefinition?.generics?.length ?? 0;

  const givenGenerics = valueTypeRef?.genericRefs?.length ?? 0;

  if (givenGenerics !== requiredGenerics) {
    props.validationContext.accept(
      'error',
      `The referenced value type ${valueTypeDefinition.name} requires ${requiredGenerics} generic parameters but found ${givenGenerics}.`,
      {
        node: valueTypeRef,
      },
    );
  }
}

function checkIsValueTypeReferenceable(
  valueTypeRef: ValueTypeReference,
  props: JayveeValidationProps,
): void {
  const valueType = props.wrapperFactories.ValueType.wrap(valueTypeRef);
  if (valueType === undefined) {
    return;
  }

  const isUsedInBuiltinDefinition = isBuiltinBlockTypeDefinition(
    valueTypeRef.$container.$container,
  );
  if (isUsedInBuiltinDefinition) {
    return;
  }

  if (valueType.isReferenceableByUser()) {
    return;
  }

  props.validationContext.accept(
    'error',
    `Value type ${valueType.getName()} cannot be referenced in this context`,
    {
      node: valueTypeRef,
    },
  );
}
