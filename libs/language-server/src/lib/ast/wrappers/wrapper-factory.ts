import { strict as assert } from 'assert';

import { type Reference, assertUnreachable, isReference } from 'langium';

import { type ExpressionEvaluatorRegistry } from '../expressions';
import {
  BuiltinConstrainttypeDefinition,
  type ReferenceableBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isReferenceableBlocktypeDefinition,
} from '../generated/ast';

// eslint-disable-next-line import/no-cycle
import { BlockTypeWrapper, ConstraintTypeWrapper } from './typed-object';

export class WrapperFactory {
  private readonly operatorEvaluatorRegistry;

  constructor(services: {
    operators: { ExpressionEvaluatorRegistry: ExpressionEvaluatorRegistry };
  }) {
    this.operatorEvaluatorRegistry =
      services.operators.ExpressionEvaluatorRegistry;
  }

  canWrapBlockType(
    toBeWrapped:
      | ReferenceableBlocktypeDefinition
      | Reference<ReferenceableBlocktypeDefinition>,
  ): boolean {
    return BlockTypeWrapper.canBeWrapped(toBeWrapped);
  }

  wrapBlockType(
    toBeWrapped:
      | ReferenceableBlocktypeDefinition
      | Reference<ReferenceableBlocktypeDefinition>,
  ): BlockTypeWrapper {
    assert(
      this.canWrapBlockType(toBeWrapped),
      `Blocktype ${
        (isReference(toBeWrapped) ? toBeWrapped.ref?.name : toBeWrapped.name) ??
        '<unresolved reference>'
      } cannot be wrapped`,
    );
    return new BlockTypeWrapper(toBeWrapped, this.operatorEvaluatorRegistry);
  }

  /**
   * Creates a @see TypedObjectWrapper wrapper object based on the given type reference.
   */
  wrapTypedObject(
    typeRef:
      | Reference<ReferenceableBlocktypeDefinition>
      | Reference<BuiltinConstrainttypeDefinition>
      | BuiltinConstrainttypeDefinition
      | ReferenceableBlocktypeDefinition
      | undefined,
  ): BlockTypeWrapper | ConstraintTypeWrapper | undefined {
    const type = isReference(typeRef) ? typeRef.ref : typeRef;
    if (type === undefined) {
      return undefined;
    }

    if (isReferenceableBlocktypeDefinition(type)) {
      if (!this.canWrapBlockType(type)) {
        return undefined;
      }
      return this.wrapBlockType(type);
    } else if (isBuiltinConstrainttypeDefinition(type)) {
      if (!ConstraintTypeWrapper.canBeWrapped(type)) {
        return undefined;
      }
      return new ConstraintTypeWrapper(type);
    }
    assertUnreachable(type);
  }
}
