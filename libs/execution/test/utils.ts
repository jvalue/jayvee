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
  DebugGranularity,
  DebugTargets,
  ExecutionContext,
  StackNode,
  blockExecutorRegistry,
  constraintExecutorRegistry,
} from '../src';

import { TestLogger } from './test-logger';

export function clearBlockExecutorRegistry() {
  blockExecutorRegistry.clear();
}

export function clearConstraintExecutorRegistry() {
  constraintExecutorRegistry.clear();
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
    new TestLogger(runOptions.isDebugMode, undefined, loggerPrintLogs),
    runOptions,
    new EvaluationContext(new RuntimeParameterProvider()),
  );

  initialStack.forEach((node) => executionContext.enterNode(node));

  return executionContext;
}
