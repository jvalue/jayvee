// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  EvaluationContext,
  type JayveeServices,
  type PipelineDefinition,
} from '@jvalue/jayvee-language-server';
import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';

import {
  type BlockExecutorClass,
  CachedLogger,
  type DebugGranularity,
  type DebugTargets,
  DefaultConstraintExtension,
  ExecutionContext,
  JayveeExecExtension,
  type StackNode,
  Table,
  type TableColumn,
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
  services: JayveeServices,
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
    new TestExecExtension(),
    new DefaultConstraintExtension(),
    new CachedLogger(runOptions.isDebugMode, undefined, loggerPrintLogs),
    services.WrapperFactories,
    services.ValueTypeProvider,
    runOptions,
    new EvaluationContext(
      services.RuntimeParameterProvider,
      services.operators.EvaluatorRegistry,
      services.ValueTypeProvider,
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
