// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { type InternalValueRepresentation } from '../../expressions/evaluation';
// eslint-disable-next-line import/no-cycle
import { validateTypedCollection } from '../../expressions/type-inference';
import {
  ConstraintDefinition,
  ValuetypeDefinition,
  isConstraintDefinition,
  isReferenceLiteral,
} from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';

import { PrimitiveValuetypes } from './primitive';
import { AbstractValuetype, Valuetype, ValuetypeVisitor } from './valuetype';

export class AtomicValuetype
  extends AbstractValuetype<InternalValueRepresentation>
  implements AstNodeWrapper<ValuetypeDefinition>
{
  constructor(
    public readonly astNode: ValuetypeDefinition,
    supertype: Valuetype,
  ) {
    super(supertype);
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitAtomicValuetype(this);
  }

  getConstraints(): ConstraintDefinition[] {
    const constraintCollection = this.astNode.constraints;
    const constraintReferences = validateTypedCollection(
      constraintCollection,
      [PrimitiveValuetypes.Constraint],
      undefined,
    ).validItems;

    assert(constraintReferences.every(isReferenceLiteral));

    const constraints = constraintReferences.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (constraintReference) => constraintReference.value.ref!,
    );

    assert(constraints.every(isConstraintDefinition));
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

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation,
  ): operandValue is InternalValueRepresentation {
    assert(this.supertype !== undefined);
    return this.supertype.isInternalValueRepresentation(operandValue);
  }
}

export function isAtomicValuetype(v: unknown): v is AtomicValuetype {
  return v instanceof AtomicValuetype;
}
