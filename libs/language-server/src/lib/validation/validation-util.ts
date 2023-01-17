import { AstNode } from 'langium';

export type NamedAstNode = AstNode & { name: string };

export function getNodesWithNonUniqueNames<N extends NamedAstNode>(
  nodes: N[],
): N[] {
  const nodesByName = getNodesByName(nodes);

  const resultingNodes: N[] = [];
  for (const nodesWithSameName of Object.values(nodesByName)) {
    if (nodesWithSameName.length > 1) {
      resultingNodes.push(...nodesWithSameName);
    }
  }
  return resultingNodes;
}

function getNodesByName<N extends NamedAstNode>(
  nodes: N[],
): Record<string, N[]> {
  return groupBy<N, string>(nodes, (node) => node.name);
}

function groupBy<T, K extends keyof never>(
  elements: T[],
  keyFn: (element: T) => K,
): Record<K, T[]> {
  const initialValue = {} as Record<K, T[]>;

  return elements.reduce<Record<K, T[]>>((result, element) => {
    const key = keyFn(element);
    const array: T[] | undefined = result[key];
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (array === undefined) {
      result[key] = [];
    }

    result[key].push(element);
    return result;
  }, initialValue);
}
