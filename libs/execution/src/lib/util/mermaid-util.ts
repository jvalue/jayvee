// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { type BlockDefinition } from '@jvalue/jayvee-language-server';
import { stringify } from 'yaml';

import { type ExecutionContext } from '../execution-context';

export type Id = string;
let nextIdx = 0;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
export function getId(): Id {
  let remaining = nextIdx++;
  let id = '';

  do {
    const letter = ALPHABET[remaining % ALPHABET.length];
    assert(letter !== undefined);
    id = letter + id;
    remaining = Math.floor(remaining / ALPHABET.length);
  } while (remaining > 0);

  return id;
}

// NOTE: The space is required, as it's a placeholder for the node's text
export type NodeShape = '[ ]' | '( )';

export class Node {
  private readonly _id: Id = getId();
  constructor(public text: string, public shape: NodeShape) {}

  get id(): Id {
    return this._id;
  }

  toString(): string {
    const [start, end, ...rem] = this.shape.split(' ');
    assert(start !== undefined);
    assert(end !== undefined);
    assert(rem.length === 0);
    return this.id + start + this.text + end;
  }
}

export type Arrow = '-->' | '---' | '-.->' | '==>' | '~~~' | '--o' | '--x';

export class Edge {
  private readonly _id: Id = getId();
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
    const properties = [...this.properties.entries()]
      .map(([key, value]) => `${key}: ${value}`)
      .join(',');

    if (properties === '') {
      return `classDef ${this.className}`;
    }
    return `classDef ${this.className} ${properties}`;
  }
}

export class ClassAssignment {
  constructor(public id: string, public className: string) {}

  toString(): string {
    return `class ${this.id} ${this.className}`;
  }
}

export interface ThemeVariables {
  darkMode: boolean;
  background: string;
  fontFamily: string;
  fontSize: string;
  primaryColor: string;
  primaryTextColor: string;
  primaryBorderColor: string;
  secondaryColor: string;
  secondaryTextColor: string;
  secondaryBorderColor: string;
  tertiaryColor: string;
  tertiaryTextColor: string;
  tertiaryBorderColor: string;
  noteBkgColor: string;
  noteTextColor: string;
  noteBorderColor: string;
  lineColor: string;
  textColor: string;
  mainBkg: string;
  errorBkgColor: string;
  errorTextColor: string;

  nodeBorder: string;
  clusterBkg: string;
  clusterBorder: string;
  defaultLinkColor: string;
  titleColor: string;
  edgeLabelBackground: string;
  nodeTextColor: string;
}

export interface ElkLayoutConfig {
  mergeEdges: boolean;
  nodePlacementStrategy:
    | 'BRANDES_KOEPF'
    | 'SIMPLE'
    | 'NETWORK_SIMPLEX'
    | 'LINEAR_SEGMENTS';
}

export interface GraphConfiguration {
  look: 'classic' | 'handDrawn';
  theme: 'default' | 'neutral' | 'dark' | 'forest' | 'plain';
  themeVariables: Partial<ThemeVariables>;
  layout: 'dagre' | 'elk';
  elk: Partial<ElkLayoutConfig>;
}

export type GraphDirection = 'TB' | 'BT' | 'RL' | 'LR';
export class Graph {
  private readonly _id: Id = getId();
  private direction: GraphDirection = 'TB';
  private nodes = new Map<Id, Node>();

  private edges = new Map<Id, Edge>();
  private edgeAttributes: EdgeAttribute[] = [];

  private subgraphs = new Map<Id, Graph>();

  private classDefinitions: ClassDefinition[] = [];
  private classAssignments: ClassAssignment[] = [];

  private blocks = new Map<BlockDefinition, Id>();

  constructor(
    public title?: string,
    public configuration?: Partial<GraphConfiguration>,
  ) {}

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

    const blockId = executor.addToGraph(this, parents, context);
    this.blocks.set(block, blockId);
  }

  private content(indents: number): string {
    const indent = '\t'.repeat(indents);
    return [
      this.nodes,
      this.edges,
      [...this.subgraphs.values()].map((sg) => sg.toSubgraph(indents + 1)),
      this.edgeAttributes,
      this.classDefinitions,
      this.classAssignments,
    ]
      .flatMap((arr) => {
        const ar = Array.isArray(arr) ? arr : [...arr.values()];
        return ar.length > 0 ? [indent + ar.join(`\n${indent}`)] : [];
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

  public toSubgraph(indents: number): string {
    const title = this.title !== undefined ? ` [${this.title}]` : '';
    return `subgraph ${this.id}${title}
${'\t'.repeat(indents)}direction ${this.direction}
${this.content(indents)}
${indents > 0 ? '\t'.repeat(indents - 1) : ''}end`;
  }

  toString(): string {
    return `---
${
  this.title !== undefined || this.configuration !== undefined
    ? stringify({
        title: this.title,
        config: this.configuration,
      })
    : '\n'
}---
flowchart ${this.direction}
${this.content(1)}`;
  }
}
