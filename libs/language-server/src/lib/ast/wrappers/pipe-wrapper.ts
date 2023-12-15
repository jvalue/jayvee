// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { DiagnosticInfo } from 'langium';

import {
  BlockDefinition,
  BlocktypePipeline,
  PipeDefinition,
} from '../generated/ast';

import { AstNodeWrapper } from './ast-node-wrapper';

export class PipeWrapper
  implements AstNodeWrapper<PipeDefinition | BlocktypePipeline>
{
  public readonly astNode: PipeDefinition | BlocktypePipeline;
  private readonly chainIndex: number;
  public readonly from: BlockDefinition;
  public readonly to: BlockDefinition;

  constructor(pipe: BlocktypePipeline | PipeDefinition, chainIndex: number) {
    this.astNode = pipe;
    assert(0 <= chainIndex && chainIndex + 1 < pipe.blocks.length);
    assert(pipe.blocks[chainIndex]?.ref !== undefined);
    assert(pipe.blocks[chainIndex + 1]?.ref !== undefined);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.from = pipe.blocks[chainIndex]!.ref!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.to = pipe.blocks[chainIndex + 1]!.ref!;
    this.chainIndex = chainIndex;
  }

  getFromDiagnostic(): DiagnosticInfo<PipeDefinition | BlocktypePipeline> {
    const result: DiagnosticInfo<PipeDefinition | BlocktypePipeline> = {
      node: this.astNode,
      property: 'blocks',
      index: this.chainIndex,
    };
    return result;
  }

  getToDiagnostic(): DiagnosticInfo<PipeDefinition | BlocktypePipeline> {
    const result: DiagnosticInfo<PipeDefinition | BlocktypePipeline> = {
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
    pipe: PipeDefinition | BlocktypePipeline,
    chainIndex: number,
  ): boolean {
    return (
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
