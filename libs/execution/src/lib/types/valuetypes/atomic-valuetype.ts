// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  ConstraintDefinition,
  ValuetypeDefinition,
  isConstraintReferenceLiteral,
  validateTypedCollection,
} from '@jvalue/language-server';

import { createConstraintExecutor } from '../../constraints/constraint-executor-registry';
import { ExecutionContext } from '../../execution-context';

import { PrimitiveType, PrimitiveValuetype } from './primitive-valuetype';
import { Valuetype } from './valuetype';
import { ValuetypeVisitor } from './visitors/valuetype-visitor';

export class AtomicValuetype<T extends PrimitiveType> implements Valuetype<T> {
  constructor(
    private readonly primitiveValuetype: PrimitiveValuetype<T>,
    private readonly astNode: ValuetypeDefinition,
  ) {}

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return this.primitiveValuetype.acceptVisitor(visitor);
  }

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (!this.primitiveValuetype.isValid(value, context)) {
      return false;
    }

    const constraints = this.getConstraints();
    for (const constraint of constraints) {
      const constraintExecutor = createConstraintExecutor(constraint);

      context.enterNode(constraint);
      const valueFulfilledConstraint = constraintExecutor.isValid(
        value,
        context,
      );
      context.exitNode(constraint);

      if (!valueFulfilledConstraint) {
        return false;
      }
    }

    return true;
  }

  getStandardRepresentation(value: unknown): T {
    return this.primitiveValuetype.getStandardRepresentation(value);
  }

  private getConstraints(): ConstraintDefinition[] {
    const constraintCollection = this.astNode.constraints;
    const constraintReferences = validateTypedCollection(
      constraintCollection,
      isConstraintReferenceLiteral,
    ).validItems;

    const constraints = constraintReferences.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (constraintReference) => constraintReference.value.ref!,
    );

    return constraints;
  }
}
