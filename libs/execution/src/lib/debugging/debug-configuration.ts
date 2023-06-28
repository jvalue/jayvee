// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export const DebugGranularityValues = ['peek', 'exhaustive', 'skip'] as const; // convention: last item is the default value
export type DebugGranularity = (typeof DebugGranularityValues)[number];
export function isDebugGranularity(obj: unknown): obj is DebugGranularity {
  return obj === 'exhaustive' || obj === 'peek' || obj === 'skip';
}

export type DebugTargets = string[] | 'all';
