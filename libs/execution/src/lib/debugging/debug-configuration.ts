// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type BlockDefinition } from '@jvalue/jayvee-language-server';

import { type ExecutionContext } from '../execution-context';

export const DefaultGranularityValue = 'minimal';
export const DebugGranularityValues = [
  'peek',
  'exhaustive',
  DefaultGranularityValue,
] as const;
export type DebugGranularity = (typeof DebugGranularityValues)[number];
export function isDebugGranularity(obj: unknown): obj is DebugGranularity {
  return obj === 'exhaustive' || obj === 'peek' || obj === 'minimal';
}

export const DefaultDebugTargetsValue = 'all';
export type DebugTargets = string[] | typeof DefaultDebugTargetsValue;

export function isBlockTargetedForDebugLogging(
  block: BlockDefinition,
  context: ExecutionContext,
): boolean {
  return (
    context.runOptions.debugTargets === DefaultDebugTargetsValue ||
    context.runOptions.debugTargets.includes(block.name)
  );
}
