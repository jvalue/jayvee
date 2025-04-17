import { createHash } from 'node:crypto';

import { type BlockDefinition } from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export type Id = string;
function generateId(obj: object): string {
  const s = JSON.stringify(obj);
  return createHash('sha256').update(s).digest('hex');
}

export type NodeShape =
  | {
      start: '[';
      end: ']';
    }
  | {
      start: '(';
      end: ')';
    };

export class Node {
  private readonly _id: Id = generateId(this);
  constructor(public text: string, public shape: NodeShape) {}

  get id(): Id {
    return this._id;
  }

  toString(): string {
    return this.id + this.shape.start + this.text + this.shape.end;
  }
}

export type Arrow = '-->' | '---' | '-.->' | '==>' | '~~~' | '--o' | '--x';

export class Edge {
  private readonly _id: Id = generateId(this);
  constructor(
    public from: Id,
    public to: Id,
    public text: string,
    public arrow: Arrow,
  ) {}

  get id(): Id {
    return this._id;
  }

  toString(): string {
    return `${this.from} ${this.id}@${this.arrow}|${this.text}| ${this.to}`;
  }
}

export class EdgeAttribute {
  private attributes = new Map<string, string>();

  constructor(public id: Id) {}

  get(name: string) {
    this.attributes.get(name);
  }

  set(name: string, value: string) {
    this.attributes.set(name, value);
  }

  toString(): string {
    return `${this.id}@{ ${[...this.attributes.entries()]
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ')} }`;
  }
}

export class ClassDefinition {
  private properties = new Map<string, string>();

  constructor(public className: string) {}

  get(name: string) {
    this.properties.get(name);
  }

  set(name: string, value: string) {
    this.properties.set(name, value);
  }

  toString(): string {
    return `classDef ${this.className} ${[...this.properties.entries()]
      .map(([key, value]) => `${key}: ${value}`)
      .join(',')}`;
  }
}

export class ClassAssignment {
  constructor(public id: string, public className: string) {}

  toString(): string {
    return `class ${this.id} ${this.className}`;
  }
}

export type GraphDirection = 'TD' | 'LR';
export class Graph {
  private readonly _id: Id = generateId(this);
  private direction: GraphDirection = 'TD';
  private nodes = new Map<Id, Node>();

  private edges = new Map<Id, Edge>();
  private edgeAttributes: { id: Id; attributes: string[] }[] = [];

  private subgraphs = new Map<Id, Graph>();

  private classDefinitions: {
    class: string;
    propertiesAndValues: string[];
  }[] = [];
  private classAssignments: { id: Id; class: string }[] = [];

  private blocks = new Map<BlockDefinition, Id>();

  constructor(public title: string) {}

  get id(): Id {
    return this._id;
  }

  getBlockId(block: BlockDefinition): Id | undefined {
    return this.blocks.get(block);
  }

  public addBlock(
    context: ExecutionContext,
    block: BlockDefinition,
    parents: Id[],
  ) {
    const executor = context.executionExtension.createBlockExecutor(block);

    const block_id = executor.addToGraph(this, parents, context);
    this.blocks.set(block, block_id);
  }

  private content(): string {
    return [
      this.nodes,
      this.edges,
      [...this.subgraphs.values()].map((sg) => sg.toSubgraph()),
      this.edgeAttributes,
      this.classDefinitions,
      this.classAssignments,
    ]
      .map((arr) => {
        if (Array.isArray(arr)) {
          return arr.join('\n\t');
        }
        return [...arr.values()].join('\n\t');
      })
      .join('\n\n');
  }

  public addNode(node: Node) {
    this.nodes.set(node.id, node);
  }

  public addSubgraph(subgraph: Graph) {
    this.subgraphs.set(subgraph.id, subgraph);
  }

  public addEdge(edge: Edge) {
    this.edges.set(edge.id, edge);
  }

  public toSubgraph(): string {
    return `subgraph ${this.id} [${this.title}]
  direction ${this.direction}
  ${this.content()}`;
  }

  toString(): string {
    return `
---
title: ${this.title}
---
flowchart ${this.direction}
  ${this.content()}
`;
  }
}
