// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  AstNode,
  type Reference,
  assertUnreachable,
  isReference,
} from 'langium';

import { type OperatorEvaluatorRegistry } from '../expressions';
import {
  BuiltinConstrainttypeDefinition,
  CompositeBlocktypeDefinition,
  PipelineDefinition,
  type ReferenceableBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isReferenceableBlocktypeDefinition,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';
import { PipelineWrapper } from './pipeline-wrapper';
// eslint-disable-next-line import/no-cycle
import { BlockTypeWrapper } from './typed-object/blocktype-wrapper';
import { ConstraintTypeWrapper } from './typed-object/constrainttype-wrapper';

abstract class AstNodeWrapperFactory<
  N extends AstNode & { name: string },
  W extends AstNodeWrapper<N>,
> {
  abstract canWrap(toBeWrapped: N | Reference<N>): boolean;
  wrap(toBeWrapped: N | Reference<N>): W {
    assert(
      this.canWrap(toBeWrapped),
      `AstNode ${
        (isReference(toBeWrapped) ? toBeWrapped.ref?.name : toBeWrapped.name) ??
        '<unresolved reference>'
      } cannot be wrapped`,
    );
    return this.doWrap(toBeWrapped);
  }
  abstract doWrap(toBeWrapped: N | Reference<N>): W;
}

export class WrapperFactory {
  readonly BlockType: BlockTypeWrapperFactory;
  readonly ConstraintType: ConstraintTypeWrapperFactory;
  readonly Pipeline: PipelineWrapperFactory;

  constructor(
    private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
  ) {
    this.BlockType = new BlockTypeWrapperFactory(
      this.operatorEvaluatorRegistry,
    );
    this.ConstraintType = new ConstraintTypeWrapperFactory(
      this.operatorEvaluatorRegistry,
    );
    this.Pipeline = new PipelineWrapperFactory();
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
      if (!this.BlockType.canWrap(type)) {
        return undefined;
      }
      return this.BlockType.wrap(type);
    } else if (isBuiltinConstrainttypeDefinition(type)) {
      if (!this.ConstraintType.canWrap(type)) {
        return undefined;
      }
      return this.ConstraintType.wrap(type);
    }
    assertUnreachable(type);
  }
}

class BlockTypeWrapperFactory extends AstNodeWrapperFactory<
  ReferenceableBlocktypeDefinition,
  BlockTypeWrapper
> {
  constructor(
    private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
  ) {
    super();
  }

  canWrap(
    toBeWrapped:
      | ReferenceableBlocktypeDefinition
      | Reference<ReferenceableBlocktypeDefinition>,
  ): boolean {
    return BlockTypeWrapper.canBeWrapped(toBeWrapped);
  }
  doWrap(
    toBeWrapped:
      | ReferenceableBlocktypeDefinition
      | Reference<ReferenceableBlocktypeDefinition>,
  ): BlockTypeWrapper {
    return new BlockTypeWrapper(toBeWrapped, this.operatorEvaluatorRegistry);
  }
}

class ConstraintTypeWrapperFactory extends AstNodeWrapperFactory<
  BuiltinConstrainttypeDefinition,
  ConstraintTypeWrapper
> {
  constructor(
    private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
  ) {
    super();
  }

  canWrap(
    toBeWrapped:
      | BuiltinConstrainttypeDefinition
      | Reference<BuiltinConstrainttypeDefinition>,
  ): boolean {
    return ConstraintTypeWrapper.canBeWrapped(toBeWrapped);
  }
  doWrap(
    toBeWrapped:
      | BuiltinConstrainttypeDefinition
      | Reference<BuiltinConstrainttypeDefinition>,
  ): ConstraintTypeWrapper {
    return new ConstraintTypeWrapper(
      toBeWrapped,
      this.operatorEvaluatorRegistry,
    );
  }
}

class PipelineWrapperFactory extends AstNodeWrapperFactory<
  PipelineDefinition | CompositeBlocktypeDefinition,
  PipelineWrapper<PipelineDefinition | CompositeBlocktypeDefinition>
> {
  canWrap(
    toBeWrapped: PipelineDefinition | CompositeBlocktypeDefinition,
  ): boolean {
    return PipelineWrapper.canBeWrapped(toBeWrapped);
  }

  override wrap<T extends PipelineDefinition | CompositeBlocktypeDefinition>( // override to adjust typing
    toBeWrapped: T | Reference<T>,
  ): PipelineWrapper<T> {
    return super.wrap(toBeWrapped) as PipelineWrapper<T>; // implementation forwards to doWrap, so typing will be correct
  }

  doWrap<T extends PipelineDefinition | CompositeBlocktypeDefinition>(
    toBeWrapped: T,
  ): PipelineWrapper<T> {
    return new PipelineWrapper(toBeWrapped);
  }
}
