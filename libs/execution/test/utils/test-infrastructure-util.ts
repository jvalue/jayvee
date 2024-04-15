// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import type { PipelineDefinition } from '@jvalue/jayvee-language-server';
import {
  DefaultOperatorEvaluatorRegistry,
  EvaluationContext,
  RuntimeParameterProvider,
  WrapperFactoryProvider,
} from '@jvalue/jayvee-language-server';
import type { AstNode, AstNodeLocator, LangiumDocument } from 'langium';

import type {
  BlockExecutorClass,
  DebugGranularity,
  DebugTargets,
  StackNode,
  TableColumn,
} from '../../src';
import {
  CachedLogger,
  DefaultConstraintExtension,
  ExecutionContext,
  JayveeExecExtension,
  Table,
} from '../../src';

export class TestExecExtension extends JayveeExecExtension {
  getBlockExecutors(): BlockExecutorClass[] {
    return [];
  }
}

export function processExitMockImplementation(code?: number) {
  if (code === undefined || code === 0) {
    return undefined as never;
  }
  throw new Error(`process.exit: ${code}`);
}

export function getTestExecutionContext(
  locator: AstNodeLocator,
  document: LangiumDocument<AstNode>,
  initialStack: StackNode[] = [],
  runOptions: {
    isDebugMode: boolean;
    debugGranularity: DebugGranularity;
    debugTargets: DebugTargets;
  } = {
    isDebugMode: false,
    debugGranularity: 'minimal',
    debugTargets: 'all',
  },
  loggerPrintLogs = true,
): ExecutionContext {
  const pipeline = locator.getAstNode<PipelineDefinition>(
    document.parseResult.value,
    'pipelines@0',
  ) as PipelineDefinition;

  const operatorEvaluatorRegistry = new DefaultOperatorEvaluatorRegistry();

  const executionContext = new ExecutionContext(
    pipeline,
    new TestExecExtension(),
    new DefaultConstraintExtension(),
    new CachedLogger(runOptions.isDebugMode, undefined, loggerPrintLogs),
    new WrapperFactoryProvider(operatorEvaluatorRegistry),
    runOptions,
    new EvaluationContext(
      new RuntimeParameterProvider(),
      operatorEvaluatorRegistry,
    ),
  );

  initialStack.forEach((node) => executionContext.enterNode(node));

  return executionContext;
}

export interface TableColumnDefinition {
  columnName: string;
  column: TableColumn;
}

export function constructTable(
  columns: TableColumnDefinition[],
  numberOfRows: number,
): Table {
  const table = new Table(numberOfRows);
  columns.forEach((col) => table.addColumn(col.columnName, col.column));
  return table;
}
