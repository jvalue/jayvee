// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type IOType, isBlockDefinition } from '@jvalue/jayvee-language-server';

import { isBlockTargetedForDebugLogging } from '../debugging/debug-configuration';
import { DebugLogVisitor } from '../debugging/debug-log-visitor';
import { type ExecutionContext } from '../execution-context';
import { type IOTypeImplementation } from '../types/io-types/io-type-implementation';
import {
  ClassAssignment,
  Edge,
  type Graph,
  type Id,
  Node,
} from '../util/mermaid-util';

import * as R from './execution-result';

export interface BlockExecutor<
  I extends IOType = IOType,
  O extends IOType = IOType,
> {
  readonly inputType: I;
  readonly outputType: O;

  execute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;

  addToGraph(graph: Graph, parents: Id[], context: ExecutionContext): Id;
}

export abstract class AbstractBlockExecutor<I extends IOType, O extends IOType>
  implements BlockExecutor<I, O>
{
  constructor(public readonly inputType: I, public readonly outputType: O) {}

  async execute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>> {
    const executionResult = await this.doExecute(input, context);

    if (R.isOk(executionResult)) {
      this.logBlockResult(executionResult.right, context);
    }
    return executionResult;
  }

  private logBlockResult(
    result: IOTypeImplementation | null,
    context: ExecutionContext,
  ): void {
    if (!context.runOptions.isDebugMode) {
      return;
    }

    if (result == null) {
      return;
    }

    const currentNode = context.getCurrentNode();
    assert(isBlockDefinition(currentNode));
    const isBlockTargeted = isBlockTargetedForDebugLogging(
      currentNode,
      context,
    );
    if (!isBlockTargeted) {
      return;
    }

    result.acceptVisitor(
      new DebugLogVisitor(
        context.runOptions.debugGranularity,
        'Output',
        context.logger,
        context.wrapperFactories,
      ),
    );
  }

  abstract doExecute(
    input: IOTypeImplementation<I>,
    context: ExecutionContext,
  ): Promise<R.Result<IOTypeImplementation<O> | null>>;

  addToGraph(graph: Graph, parents: Id[], context: ExecutionContext): Id {
    const node = new Node(context.getCurrentNode().name, '[ ]');
    graph.addNode(node);

    graph.addClassAssignment(new ClassAssignment(node.id, 'block'));
    graph.addClassAssignment(new ClassAssignment(node.id, node.text));

    for (const parent of parents) {
      const edge = new Edge(parent, node.id, this.inputType, '-->');
      graph.addEdge(edge);
      graph.addClassAssignment(new ClassAssignment(edge.id, 'edge'));
    }

    return node.id;
  }
}
