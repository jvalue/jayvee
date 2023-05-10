// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

// eslint-disable-next-line import/no-cycle
import { validateTypedCollection } from '../../expressions/type-inference';
import {
  ConstraintDefinition,
  ValuetypeDefinition,
  isConstraintReferenceLiteral,
} from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';

import { PrimitiveValuetypes } from './primitive';
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
    assert(this.supertype !== undefined);
    return this.supertype.acceptVisitor(visitor);
  }

  getConstraints(): ConstraintDefinition[] {
    const constraintCollection = this.astNode.constraints;
    const constraintReferences = validateTypedCollection(
      constraintCollection,
      [PrimitiveValuetypes.Constraint],
      undefined,
    ).validItems;

    assert(constraintReferences.every(isConstraintReferenceLiteral));

    const constraints = constraintReferences.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (constraintReference) => constraintReference.value.ref!,
    );

    return constraints;
  }

  override isConvertibleTo(target: Valuetype): boolean {
    assert(this.supertype !== undefined);
    return this.supertype.isConvertibleTo(target);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    assert(this.supertype !== undefined);
    return this.supertype.isAllowedAsRuntimeParameter();
  }

  override getName(): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return this.astNode.name ?? '';
  }
}

export function isAtomicValuetype(v: unknown): v is AtomicValuetype {
  return v instanceof AtomicValuetype;
}
