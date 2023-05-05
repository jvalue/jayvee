// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  ConstraintDefinition,
  PropertyValuetype,
  ValuetypeDefinition,
  isConstraintReferenceLiteral,
  validateTypedCollection,
} from '@jvalue/jayvee-language-server';

// eslint-disable-next-line import/no-cycle
import { PrimitiveValuetype } from './primitive/primitive-valuetype';
import { Valuetype } from './valuetype';
import { ValuetypeVisitor } from './visitors/valuetype-visitor';

export class AtomicValuetype implements Valuetype<ValuetypeDefinition> {
  constructor(
    public readonly astNode: ValuetypeDefinition,
    public readonly primitiveValuetype: PrimitiveValuetype,
  ) {}

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return this.primitiveValuetype.acceptVisitor(visitor);
  }

  getConstraints(): ConstraintDefinition[] {
    const constraintCollection = this.astNode.constraints;
    const constraintReferences = validateTypedCollection(constraintCollection, [
      PropertyValuetype.CONSTRAINT,
    ]).validItems;

    assert(constraintReferences.every(isConstraintReferenceLiteral));

    const constraints = constraintReferences.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (constraintReference) => constraintReference.value.ref!,
    );

    return constraints;
  }
}
