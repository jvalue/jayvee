// eslint-disable-next-line import/no-cycle
import { getMetaInformation } from '../meta-information/meta-inf-util';

import { Block, Pipe, Pipeline } from './generated/ast';

export function collectStartingBlocks(pipeline: Pipeline): Block[] {
  const result: Block[] = [];
  for (const block of pipeline.blocks) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (block.type !== undefined) {
      const blockMetaInf = getMetaInformation(block.type);
      if (!blockMetaInf.hasInput()) {
        result.push(block);
      }
    }
  }
  return result;
}

export function collectChildren(block: Block): Block[] {
  const outgoingPipes = collectOutgoingPipes(block);

  const children = outgoingPipes
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    .filter((pipe) => pipe.to?.ref !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map((pipe) => pipe.to.ref!);

  return children;
}

export function collectParents(block: Block): Block[] {
  const ingoingPipes = collectIngoingPipes(block);

  const parents = ingoingPipes
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    .filter((pipe) => pipe.from?.ref !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map((pipe) => pipe.from.ref!);

  return parents;
}

export function collectOutgoingPipes(block: Block): Pipe[] {
  const model = block.$container;
  const outgoingPipes: Pipe[] = [];

  for (const pipe of model.pipes) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pipe.from?.ref === block) {
      outgoingPipes.push(pipe);
    }
  }

  return outgoingPipes;
}

export function collectIngoingPipes(block: Block): Pipe[] {
  const model = block.$container;
  const ingoingPipes: Pipe[] = [];

  for (const pipe of model.pipes) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (pipe.to?.ref === block) {
      ingoingPipes.push(pipe);
    }
  }

  return ingoingPipes;
}
