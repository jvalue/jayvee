// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

// eslint-disable-next-line import/no-cycle
import { validateTypedCollection } from '../../collection-util';
import {
  ConstraintDefinition,
  ValuetypeDefinition,
  isConstraintReferenceLiteral,
} from '../../generated/ast';
import { PropertyValuetype } from '../../model-util';
import { AstNodeWrapper } from '../ast-node-wrapper';

// eslint-disable-next-line import/no-cycle
import { AbstractValuetype, Valuetype, ValuetypeVisitor } from './valuetype';

export class AtomicValuetype
  extends AbstractValuetype
  implements AstNodeWrapper<ValuetypeDefinition>
{
  constructor(
    public readonly astNode: ValuetypeDefinition,
    supertype: Valuetype,
  ) {
    super(supertype);
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.supertype!.acceptVisitor(visitor);
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

  override isConvertibleTo(target: Valuetype): boolean {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.supertype!.isConvertibleTo(target);
  }
}
