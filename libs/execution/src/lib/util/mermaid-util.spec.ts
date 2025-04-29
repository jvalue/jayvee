// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  ClassAssignment,
  ClassDefinition,
  Edge,
  EdgeAttribute,
  Graph,
  Node,
  getId,
} from './mermaid-util';

describe('Validation of mermaid-util', () => {
  describe('Function getId', () => {
    it('Correct first 28 ids', () => {
      // NOTE: The id is expected to increase from `z` to `ba`
      // just as decimal increases from `9` to `10` (not `00`)
      expect(getId()).toBe('a');
      expect(getId()).toBe('b');
      expect(getId()).toBe('c');
      expect(getId()).toBe('d');
      expect(getId()).toBe('e');
      expect(getId()).toBe('f');
      expect(getId()).toBe('g');
      expect(getId()).toBe('h');
      expect(getId()).toBe('i');
      expect(getId()).toBe('j');
      expect(getId()).toBe('k');
      expect(getId()).toBe('l');
      expect(getId()).toBe('m');
      expect(getId()).toBe('n');
      expect(getId()).toBe('o');
      expect(getId()).toBe('p');
      expect(getId()).toBe('q');
      expect(getId()).toBe('r');
      expect(getId()).toBe('s');
      expect(getId()).toBe('t');
      expect(getId()).toBe('u');
      expect(getId()).toBe('v');
      expect(getId()).toBe('w');
      expect(getId()).toBe('x');
      expect(getId()).toBe('y');
      expect(getId()).toBe('z');
      expect(getId()).toBe('ba');
      expect(getId()).toBe('bb');
    });
  });
  describe('Class Node', () => {
    it('correctly prints a node', () => {
      let node = new Node('nodeText', '[ ]');
      expect(node.toString()).toBe(`${node.id}[nodeText]`);

      node = new Node('otherNodeText', '( )');
      expect(node.toString()).toBe(`${node.id}(otherNodeText)`);
    });
  });
  describe('Class Edge', () => {
    it('correctly prints an edge', () => {
      const edge = new Edge('node', 'otherNode', 'edgeText', '-->');
      expect(edge.toString()).toBe(`node ${edge.id}@-->|edgeText| otherNode`);
    });
  });
  describe('Class EdgeAttribute', () => {
    it('correctly prints an edge attribute', () => {
      const edgeAttribute = new EdgeAttribute('edgeId');
      expect(edgeAttribute.toString()).toBe('edgeId@{  }');

      edgeAttribute.set('attr', 'val');
      expect(edgeAttribute.toString()).toBe('edgeId@{ attr: val }');

      edgeAttribute.set('attr2', 'val2');
      expect(edgeAttribute.toString()).toBe(
        'edgeId@{ attr: val, attr2: val2 }',
      );
    });
  });
  describe('Class ClassDefinition', () => {
    it('correctly prints a class definition', () => {
      const classDefinition = new ClassDefinition('className');
      expect(classDefinition.toString()).toBe('classDef className');

      classDefinition.set('attr', 'val');
      expect(classDefinition.toString()).toBe('classDef className attr: val');

      classDefinition.set('attr2', 'val2');
      expect(classDefinition.toString()).toBe(
        'classDef className attr: val,attr2: val2',
      );
    });
  });
  describe('Class Assignment', () => {
    it('correctly prints a class assignment', () => {
      const classAssignment = new ClassAssignment('id', 'className');
      expect(classAssignment.toString()).toBe('class id className');
    });
  });
  describe('Class Graph', () => {
    it('correctly prints a Graph', () => {
      const graph = new Graph('title');
      expect(graph.toString()).toBe(`---
title: title
---
flowchart TB
`);

      const node1 = new Node('nodeText', '[ ]');
      const node2 = new Node('otherNodeText', '( )');
      graph.addNode(node1);
      graph.addNode(node2);
      expect(graph.toString()).toBe(`---
title: title
---
flowchart TB
\t${node1.id}[nodeText]
\t${node2.id}(otherNodeText)`);

      const edge = new Edge(node1.id, node2.id, 'edgeText', '==>');
      graph.addEdge(edge);
      expect(graph.toString()).toBe(`---
title: title
---
flowchart TB
\t${node1.id}[nodeText]
\t${node2.id}(otherNodeText)

\t${node1.id} ${edge.id}@==>|edgeText| ${node2.id}`);
    });
  });
  it('correctly prints a Graph containing a subgraph', () => {
    const subgraph = new Graph('subgraphTitle');
    const node1 = new Node('nodeText', '[ ]');
    subgraph.addNode(node1);
    const node2 = new Node('otherNodeText', '( )');
    subgraph.addNode(node2);
    const edge = new Edge(node1.id, node2.id, 'edgeText', '==>');
    subgraph.addEdge(edge);
    expect(subgraph.toSubgraph(1)).toBe(`subgraph ${subgraph.id} [subgraphTitle]
\tdirection TB
\t${node1.id}[nodeText]
\t${node2.id}(otherNodeText)

\t${node1.id} ${edge.id}@==>|edgeText| ${node2.id}
end`);

    const graph = new Graph('title');
    graph.addSubgraph(subgraph);
    expect(graph.toString()).toBe(`---
title: title
---
flowchart TB
\tsubgraph ${subgraph.id} [subgraphTitle]
\t\tdirection TB
\t\t${node1.id}[nodeText]
\t\t${node2.id}(otherNodeText)

\t\t${node1.id} ${edge.id}@==>|edgeText| ${node2.id}
\tend`);
  });
});
