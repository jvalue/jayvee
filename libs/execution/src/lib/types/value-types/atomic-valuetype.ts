import {
  Valuetype as AstValuetype,
  Constraint,
  isConstraintReferenceValue,
  validateTypedCollection,
} from '@jvalue/language-server';

import { createConstraintExecutor } from '../../constraints/constraint-executor-registry';
import { ExecutionContext } from '../../execution-context';

import { Valuetype } from './valuetype';
import { ValuetypeVisitor } from './visitors/valuetype-visitor';

export class AtomicValuetype<T> implements Valuetype<T> {
  constructor(
    private readonly baseValuetype: Valuetype<T>,
    private readonly astNode: AstValuetype,
  ) {}

  get primitiveValuetype() {
    return this.baseValuetype.primitiveValuetype;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return this.baseValuetype.acceptVisitor(visitor);
  }

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (!this.baseValuetype.isValid(value, context)) {
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
    return this.baseValuetype.getStandardRepresentation(value);
  }

  private getConstraints(): Constraint[] {
    const constraintCollection = this.astNode.constraints;
    const constraintReferences = validateTypedCollection(
      constraintCollection,
      isConstraintReferenceValue,
    ).validItems;

    const constraints = constraintReferences.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (constraintReference) => constraintReference.value.ref!,
    );

    return constraints;
  }
}
