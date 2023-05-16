// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

// eslint-disable-next-line import/no-cycle
import {
  EvaluationContext,
  type InternalValueRepresentation,
  evaluateExpression,
} from '../../expressions/evaluation';
// eslint-disable-next-line import/no-cycle
import { validateTypedCollection } from '../../expressions/type-inference';
import { ConstraintDefinition, ValuetypeDefinition } from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';

// eslint-disable-next-line import/no-cycle
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
    const constraintExpressions = validateTypedCollection(
      constraintCollection,
      [PrimitiveValuetypes.Constraint],
      undefined,
    ).validItems;

    return constraintExpressions
      .map((x) =>
        evaluateExpression(
          x,
          new EvaluationContext(), // we don't know values of runtime parameters or variables at this point)
        ),
      )
      .filter((x): x is ConstraintDefinition => {
        return (
          x !== undefined &&
          PrimitiveValuetypes.Constraint.isInternalValueRepresentation(x)
        );
      });
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
