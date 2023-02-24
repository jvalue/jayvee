import { strict as assert } from 'assert';

import { DiagnosticInfo } from 'langium';

import {
  Block,
  ChainedPipe,
  Pipe,
  SinglePipe,
  isSinglePipe,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';

export class PipeWrapper<N extends Pipe = Pipe> implements AstNodeWrapper<N> {
  public readonly astNode: N;
  private readonly chainIndex?: number;
  public readonly from: Block;
  public readonly to: Block;

  constructor(pipe: ChainedPipe, chainIndex: number);
  constructor(pipe: SinglePipe);
  constructor(pipe: N, chainIndex?: number) {
    this.astNode = pipe;
    if (isSinglePipe(pipe)) {
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

  getFromDiagnostic(): DiagnosticInfo<Pipe> {
    if (isSinglePipe(this.astNode)) {
      const result: DiagnosticInfo<SinglePipe> = {
        node: this.astNode,
        property: 'from',
      };
      return result;
    }
    assert(this.chainIndex !== undefined);
    const result: DiagnosticInfo<ChainedPipe> = {
      node: this.astNode,
      property: 'blocks',
      index: this.chainIndex,
    };
    return result;
  }

  getToDiagnostic(): DiagnosticInfo<Pipe> {
    if (isSinglePipe(this.astNode)) {
      const result: DiagnosticInfo<SinglePipe> = {
        node: this.astNode,
        property: 'to',
      };
      return result;
    }
    assert(this.chainIndex !== undefined);
    const result: DiagnosticInfo<ChainedPipe> = {
      node: this.astNode,
      property: 'blocks',
      index: this.chainIndex + 1,
    };
    return result;
  }

  equals(pipe: PipeWrapper): boolean {
    return this.from === pipe.from && this.to === pipe.to;
  }

  static canBeWrapped(pipe: ChainedPipe, chainIndex: number): boolean;
  static canBeWrapped(pipe: SinglePipe): boolean;
  static canBeWrapped<N extends Pipe>(pipe: N, chainIndex?: number): boolean {
    if (isSinglePipe(pipe)) {
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

export function createSemanticPipes(pipe: Pipe): PipeWrapper[] {
  if (isSinglePipe(pipe)) {
    return createFromSinglePipe(pipe);
  }
  return createFromChainedPipe(pipe);
}

function createFromSinglePipe(pipe: SinglePipe): PipeWrapper[] {
  if (PipeWrapper.canBeWrapped(pipe)) {
    return [new PipeWrapper(pipe)];
  }
  return [];
}

function createFromChainedPipe(pipe: ChainedPipe): PipeWrapper[] {
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
