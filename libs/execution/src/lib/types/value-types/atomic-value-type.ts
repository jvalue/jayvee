import {
  Valuetype,
  isConstraintReferenceValue,
  validateTypedCollection,
} from '@jvalue/language-server';

import { ConstraintExecutor } from '../../constraints/constraint-executor';
import { createConstraintExecutor } from '../../constraints/constraint-executor-registry';

import { ValueType } from './abstract-value-type';
import { ValueTypeVisitor } from './visitors/value-type-visitor';

export class AtomicValueType<T> implements ValueType<T> {
  constructor(
    private readonly baseValuetype: ValueType<T>,
    private readonly astNode: Valuetype,
    private readonly runtimeParameters: Map<string, string | number | boolean>,
  ) {}

  get primitiveValuetype() {
    return this.baseValuetype.primitiveValuetype;
  }

  acceptVisitor<R>(visitor: ValueTypeVisitor<R>): R {
    return this.baseValuetype.acceptVisitor(visitor);
  }

  isValid(value: unknown): boolean {
    if (!this.baseValuetype.isValid(value)) {
      return false;
    }

    const constraintExecutors = this.createConstraintExecutors();
    for (const constraintExecutor of constraintExecutors) {
      if (!constraintExecutor.isValid(value)) {
        return false;
      }
    }

    return true;
  }

  getStandardRepresentation(value: unknown): T {
    return this.baseValuetype.getStandardRepresentation(value);
  }

  private createConstraintExecutors(): ConstraintExecutor[] {
    const constraintCollection = this.astNode.constraints;
    const constraintReferences = validateTypedCollection(
      constraintCollection,
      isConstraintReferenceValue,
    ).validItems;

    const constraints = constraintReferences.map(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (constraintReference) => constraintReference.value.ref!,
    );

    return constraints.map((constraint) =>
      createConstraintExecutor(constraint, this.runtimeParameters),
    );
  }
}
