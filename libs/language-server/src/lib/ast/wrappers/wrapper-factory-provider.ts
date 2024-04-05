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
  BlocktypePipeline,
  BuiltinConstrainttypeDefinition,
  CellRangeLiteral,
  CompositeBlocktypeDefinition,
  PipeDefinition,
  PipelineDefinition,
  type ReferenceableBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isReferenceableBlocktypeDefinition,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';
import { CellRangeWrapper } from './cell-range-wrapper';
import { PipeWrapper } from './pipe-wrapper';
import { PipelineWrapper } from './pipeline-wrapper';
// eslint-disable-next-line import/no-cycle
import { BlockTypeWrapper } from './typed-object/blocktype-wrapper';
import { ConstraintTypeWrapper } from './typed-object/constrainttype-wrapper';

abstract class AstNodeWrapperFactory<
  N extends AstNode,
  W extends AstNodeWrapper<N>,
> {
  abstract canWrap(toBeWrapped: N | Reference<N>): boolean;
  abstract doWrap(toBeWrapped: N | Reference<N>): W;

  wrap(toBeWrapped: N | Reference<N>): W {
    assert(
      this.canWrap(toBeWrapped),
      `AstNode ${this.getName(toBeWrapped)} cannot be wrapped`,
    );
    return this.doWrap(toBeWrapped);
  }

  private getName(toBeWrapped: N | Reference<N>): string {
    const node = isReference(toBeWrapped) ? toBeWrapped.ref : toBeWrapped;
    if (node === undefined) {
      return '<unresolved reference>';
    }
    if ('name' in node && typeof node.name === 'string') {
      return node.name;
    }
    return '<unnamed ast node>';
  }
}

export class WrapperFactoryProvider {
  readonly BlockType: BlockTypeWrapperFactory;
  readonly ConstraintType: ConstraintTypeWrapperFactory;
  readonly Pipeline: PipelineWrapperFactory;
  readonly Pipe: PipeWrapperFactory;
  readonly CellRange: CellRangeWrapperFactory;
  readonly TypedObject: TypedObjectWrapperFactory;

  constructor(
    private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
  ) {
    this.CellRange = new CellRangeWrapperFactory();
    this.BlockType = new BlockTypeWrapperFactory(
      this.operatorEvaluatorRegistry,
      this,
    );
    this.ConstraintType = new ConstraintTypeWrapperFactory(
      this.operatorEvaluatorRegistry,
      this,
    );
    this.Pipe = new PipeWrapperFactory();
    this.Pipeline = new PipelineWrapperFactory(this.Pipe);
    this.TypedObject = new TypedObjectWrapperFactory(
      this.BlockType,
      this.ConstraintType,
    );
  }
}

class CellRangeWrapperFactory extends AstNodeWrapperFactory<
  CellRangeLiteral,
  CellRangeWrapper
> {
  canWrap(toBeWrapped: CellRangeLiteral): boolean {
    return CellRangeWrapper.canBeWrapped(toBeWrapped);
  }
  doWrap(toBeWrapped: CellRangeLiteral): CellRangeWrapper {
    return new CellRangeWrapper(toBeWrapped);
  }
}

class BlockTypeWrapperFactory extends AstNodeWrapperFactory<
  ReferenceableBlocktypeDefinition,
  BlockTypeWrapper
> {
  constructor(
    private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
    private readonly wrapperFactories: WrapperFactoryProvider,
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
    return new BlockTypeWrapper(
      toBeWrapped,
      this.operatorEvaluatorRegistry,
      this.wrapperFactories,
    );
  }
}

class ConstraintTypeWrapperFactory extends AstNodeWrapperFactory<
  BuiltinConstrainttypeDefinition,
  ConstraintTypeWrapper
> {
  constructor(
    private readonly operatorEvaluatorRegistry: OperatorEvaluatorRegistry,
    private readonly wrapperFactories: WrapperFactoryProvider,
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
      this.wrapperFactories,
    );
  }
}

class PipelineWrapperFactory extends AstNodeWrapperFactory<
  PipelineDefinition | CompositeBlocktypeDefinition,
  PipelineWrapper<PipelineDefinition | CompositeBlocktypeDefinition>
> {
  constructor(private pipeWrapperFactory: IPipeWrapperFactory) {
    super();
  }

  canWrap(
    toBeWrapped: PipelineDefinition | CompositeBlocktypeDefinition,
  ): boolean {
    return PipelineWrapper.canBeWrapped(toBeWrapped, this.pipeWrapperFactory);
  }

  override wrap<T extends PipelineDefinition | CompositeBlocktypeDefinition>( // override to adjust typing
    toBeWrapped: T | Reference<T>,
  ): PipelineWrapper<T> {
    return super.wrap(toBeWrapped) as PipelineWrapper<T>; // implementation forwards to doWrap, so typing will be correct
  }

  doWrap<T extends PipelineDefinition | CompositeBlocktypeDefinition>(
    toBeWrapped: T,
  ): PipelineWrapper<T> {
    return new PipelineWrapper(toBeWrapped, this.pipeWrapperFactory);
  }
}

export interface IPipeWrapperFactory {
  canWrap(
    toBeWrapped: PipeDefinition | BlocktypePipeline,
    chainIndex: number,
  ): boolean;

  wrap<T extends PipeDefinition | BlocktypePipeline>(
    toBeWrapped: T,
    chainIndex: number,
  ): PipeWrapper<T>;

  doWrap<T extends PipeDefinition | BlocktypePipeline>(
    toBeWrapped: T,
    chainIndex: number,
  ): PipeWrapper<T>;

  wrapAll<T extends PipeDefinition | BlocktypePipeline>(
    toBeWrapped: T,
  ): PipeWrapper<T>[];
}

class PipeWrapperFactory implements IPipeWrapperFactory {
  // does not extend AstNodeWrapperFactory as requires argument chainIndex for wrapping

  canWrap(
    toBeWrapped: PipeDefinition | BlocktypePipeline,
    chainIndex: number,
  ): boolean {
    return PipeWrapper.canBeWrapped(toBeWrapped, chainIndex);
  }

  wrap<T extends PipeDefinition | BlocktypePipeline>(
    toBeWrapped: T,
    chainIndex: number,
  ): PipeWrapper<T> {
    assert(this.canWrap(toBeWrapped, chainIndex), `Pipe cannot be wrapped`);
    return this.doWrap(toBeWrapped, chainIndex);
  }

  doWrap<T extends PipeDefinition | BlocktypePipeline>(
    toBeWrapped: T,
    chainIndex: number,
  ): PipeWrapper<T> {
    return new PipeWrapper(toBeWrapped, chainIndex);
  }

  wrapAll<T extends PipeDefinition | BlocktypePipeline>(
    toBeWrapped: T,
  ): PipeWrapper<T>[] {
    const result: PipeWrapper<T>[] = [];
    for (
      let chainIndex = 0;
      chainIndex < toBeWrapped.blocks.length - 1;
      ++chainIndex
    ) {
      if (!this.canWrap(toBeWrapped, chainIndex)) {
        continue;
      }
      const pipeWrapper = this.wrap(toBeWrapped, chainIndex);
      result.push(pipeWrapper);
    }
    return result;
  }
}

class TypedObjectWrapperFactory {
  // does not extend AstNodeWrapperFactory as behavior differs, e.g., no thrown error, allowing undefined as parameter
  constructor(
    private readonly blockTypeWrapperFactory: BlockTypeWrapperFactory,
    private readonly constraintTypeWrapperFactory: ConstraintTypeWrapperFactory,
  ) {}

  /**
   * Creates a wrapper for the typed object.
   * Returns undefined if wrapping is not possible (does not throw an error).
   */
  wrap(
    toBeWrapped:
      | Reference<ReferenceableBlocktypeDefinition>
      | Reference<BuiltinConstrainttypeDefinition>
      | BuiltinConstrainttypeDefinition
      | ReferenceableBlocktypeDefinition
      | undefined,
  ): BlockTypeWrapper | ConstraintTypeWrapper | undefined {
    const type = isReference(toBeWrapped) ? toBeWrapped.ref : toBeWrapped;
    if (type === undefined) {
      return undefined;
    }

    if (isReferenceableBlocktypeDefinition(type)) {
      if (!this.blockTypeWrapperFactory.canWrap(type)) {
        return undefined;
      }
      return this.blockTypeWrapperFactory.wrap(type);
    } else if (isBuiltinConstrainttypeDefinition(type)) {
      if (!this.constraintTypeWrapperFactory.canWrap(type)) {
        return undefined;
      }
      return this.constraintTypeWrapperFactory.wrap(type);
    }
    assertUnreachable(type);
  }
}
