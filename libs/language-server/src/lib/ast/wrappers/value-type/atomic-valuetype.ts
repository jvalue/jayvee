// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { assertUnreachable } from 'langium';

// eslint-disable-next-line import/no-cycle
import {
  EvaluationContext,
  type InternalValueRepresentation,
  evaluateExpression,
} from '../../expressions/evaluation';
// eslint-disable-next-line import/no-cycle
import { validateTypedCollection } from '../../expressions/type-inference';
import {
  ConstraintDefinition,
  ValuetypeDefinition,
  isPrimitiveValuetypeKeywordLiteral,
  isValuetypeDefinitionReference,
} from '../../generated/ast';
import { AstNodeWrapper } from '../ast-node-wrapper';

import { PrimitiveValuetypes, createPrimitiveValuetype } from './primitive';
import { AbstractValuetype, Valuetype, ValuetypeVisitor } from './valuetype';

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
    if (target.equals(this)) {
      return true;
    }

    const supertype = this.getSupertype();
    if (supertype === undefined) {
      return false;
    }
    return supertype.isConvertibleTo(target);
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

  override doGetSupertype(): Valuetype | undefined {
    const supertype = this.astNode.type;
    if (isPrimitiveValuetypeKeywordLiteral(supertype)) {
      return createPrimitiveValuetype(supertype);
    } else if (isValuetypeDefinitionReference(supertype)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const referenced = supertype?.reference?.ref;
      if (referenced === undefined) {
        return undefined;
      }

      return new AtomicValuetype(referenced);
    }
    assertUnreachable(supertype);
  }

  override isInternalValueRepresentation(
    operandValue: InternalValueRepresentation,
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
