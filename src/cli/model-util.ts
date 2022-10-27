import { Block, Pipe } from '../language-server/generated/ast';

export function collectAdjacencyList(block: Block): Block[] {
  const outgoingPipes = collectOutgoingPipes(block);

  const adjacencyList = outgoingPipes
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    .filter((pipe) => pipe.to?.ref !== undefined)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    .map((pipe) => pipe.to.ref!);

  return adjacencyList;
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
