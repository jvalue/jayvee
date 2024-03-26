// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  EvaluationContext,
  evaluateExpression,
} from '../../expressions/evaluation.js';
import { type InternalValueRepresentation } from '../../expressions/internal-value-representation.js';
import {
  ConstraintDefinition,
  ValuetypeDefinition,
} from '../../generated/ast.js';
import { AstNodeWrapper } from '../ast-node-wrapper.js';

import { CollectionValuetype } from './primitive/index.js';
import { PrimitiveValuetypes } from './primitive/primitive-valuetypes.js';
import { createValuetype } from './valuetype-util.js';
import { AbstractValuetype, Valuetype, ValuetypeVisitor } from './valuetype.js';

export class AtomicValuetype
  extends AbstractValuetype<InternalValueRepresentation>
  implements AstNodeWrapper<ValuetypeDefinition>
{
  constructor(public readonly astNode: ValuetypeDefinition) {
    super();
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitAtomicValuetype(this);
  }

  getConstraints(context: EvaluationContext): ConstraintDefinition[] {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const constraintCollection = this.astNode?.constraints;
    assert(constraintCollection !== undefined);
    const constraintCollectionType = new CollectionValuetype(
      PrimitiveValuetypes.Constraint,
    );
    const constraints = evaluateExpression(constraintCollection, context) ?? [];
    if (!constraintCollectionType.isInternalValueRepresentation(constraints)) {
      return [];
    }

    return constraints;
  }

  override isConvertibleTo(target: Valuetype): boolean {
    if (target.equals(this)) {
      return true;
    }

    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isConvertibleTo(target);
  }

  override isReferenceableByUser(): boolean {
    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isReferenceableByUser();
  }

  override isAllowedAsRuntimeParameter(): boolean {
    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isAllowedAsRuntimeParameter();
  }

  override getName(): string {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    return this.astNode.name ?? '';
  }

  protected override doGetSupertype(): Valuetype | undefined {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const supertype = this.astNode?.type;
    return createValuetype(supertype);
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation | undefined,
  ): operandValue is InternalValueRepresentation {
    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isInternalValueRepresentation(operandValue);
  }

  override equals(target: Valuetype): boolean {
    if (target instanceof AtomicValuetype) {
      return this.astNode === target.astNode;
    }
    return false;
  }
}

export function isAtomicValuetype(v: unknown): v is AtomicValuetype {
  return v instanceof AtomicValuetype;
}
