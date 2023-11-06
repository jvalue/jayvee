// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  EvaluationContext,
  PipelineDefinition,
  RuntimeParameterProvider,
} from '@jvalue/jayvee-language-server';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';

import {
  CachedLogger,
  DebugGranularity,
  DebugTargets,
  ExecutionContext,
  StackNode,
  Table,
  TableColumn,
  blockExecutorRegistry,
  constraintExecutorRegistry,
} from '../src';

export function clearBlockExecutorRegistry() {
  blockExecutorRegistry.clear();
}

export function clearConstraintExecutorRegistry() {
  constraintExecutorRegistry.clear();
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

  const executionContext = new ExecutionContext(
    pipeline,
    new CachedLogger(runOptions.isDebugMode, undefined, loggerPrintLogs),
    runOptions,
    new EvaluationContext(new RuntimeParameterProvider()),
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
