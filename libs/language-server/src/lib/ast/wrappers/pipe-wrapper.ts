// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { DiagnosticInfo } from 'langium';

import {
  BlockDefinition,
  BlocktypePipeline,
  ChainedPipeDefinition,
  PipeDefinition,
  SinglePipeDefinition,
  isSinglePipeDefinition,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';

export class PipeWrapper<N extends PipeDefinition = PipeDefinition>
  implements AstNodeWrapper<N>
{
  public readonly astNode: N;
  private readonly chainIndex?: number;
  public readonly from: BlockDefinition;
  public readonly to: BlockDefinition;

  constructor(
    pipe: ChainedPipeDefinition | BlocktypePipeline,
    chainIndex: number,
  );
  constructor(pipe: SinglePipeDefinition);
  constructor(pipe: N, chainIndex?: number) {
    this.astNode = pipe;
    if (isSinglePipeDefinition(pipe)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      assert(pipe.from?.ref !== undefined);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      assert(pipe.to?.ref !== undefined);
      this.from = pipe.from.ref;
      this.to = pipe.to.ref;
    } else {
      assert(chainIndex !== undefined);
      assert(0 <= chainIndex && chainIndex + 1 < pipe.blocks.length);
      assert(pipe.blocks[chainIndex]?.ref !== undefined);
      assert(pipe.blocks[chainIndex + 1]?.ref !== undefined);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.from = pipe.blocks[chainIndex]!.ref!;
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.to = pipe.blocks[chainIndex + 1]!.ref!;
      this.chainIndex = chainIndex;
    }
  }

  getFromDiagnostic(): DiagnosticInfo<PipeDefinition> {
    if (isSinglePipeDefinition(this.astNode)) {
      const result: DiagnosticInfo<SinglePipeDefinition> = {
        node: this.astNode,
        property: 'from',
      };
      return result;
    }
    assert(this.chainIndex !== undefined);
    const result: DiagnosticInfo<ChainedPipeDefinition> = {
      node: this.astNode,
      property: 'blocks',
      index: this.chainIndex,
    };
    return result;
  }

  getToDiagnostic(): DiagnosticInfo<PipeDefinition> {
    if (isSinglePipeDefinition(this.astNode)) {
      const result: DiagnosticInfo<SinglePipeDefinition> = {
        node: this.astNode,
        property: 'to',
      };
      return result;
    }
    assert(this.chainIndex !== undefined);
    const result: DiagnosticInfo<ChainedPipeDefinition> = {
      node: this.astNode,
      property: 'blocks',
      index: this.chainIndex + 1,
    };
    return result;
  }

  equals(pipe: PipeWrapper): boolean {
    return this.from === pipe.from && this.to === pipe.to;
  }

  static canBeWrapped(
    pipe: ChainedPipeDefinition | BlocktypePipeline,
    chainIndex: number,
  ): boolean;
  static canBeWrapped(pipe: SinglePipeDefinition): boolean;
  static canBeWrapped<N extends PipeDefinition>(
    pipe: N,
    chainIndex?: number,
  ): boolean {
    if (isSinglePipeDefinition(pipe)) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      return pipe.from?.ref !== undefined && pipe.to?.ref !== undefined;
    }
    return (
      chainIndex !== undefined &&
      0 <= chainIndex &&
      chainIndex + 1 < pipe.blocks.length &&
      pipe.blocks[chainIndex]?.ref !== undefined &&
      pipe.blocks[chainIndex + 1]?.ref !== undefined
    );
  }
}

export function createSemanticPipes(
  pipe: PipeDefinition | BlocktypePipeline,
): PipeWrapper[] {
  if (isSinglePipeDefinition(pipe)) {
    return createFromSinglePipe(pipe);
  }
  return createFromChainedPipe(pipe);
}

function createFromSinglePipe(pipe: SinglePipeDefinition): PipeWrapper[] {
  if (PipeWrapper.canBeWrapped(pipe)) {
    return [new PipeWrapper(pipe)];
  }
  return [];
}

function createFromChainedPipe(
  pipe: ChainedPipeDefinition | BlocktypePipeline,
): PipeWrapper[] {
  const result: PipeWrapper[] = [];
  for (let chainIndex = 0; chainIndex < pipe.blocks.length - 1; ++chainIndex) {
    if (!PipeWrapper.canBeWrapped(pipe, chainIndex)) {
      continue;
    }
    const semanticPipe = new PipeWrapper(pipe, chainIndex);
    result.push(semanticPipe);
  }
  return result;
}
