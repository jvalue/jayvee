// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export type BackoffStrategyHandle = 'exponential' | 'linear';
export function isBackoffStrategyHandle(
  v: unknown,
): v is BackoffStrategyHandle {
  return v === 'exponential' || v === 'linear';
}

export function createBackoffStrategy(
  handle: BackoffStrategyHandle,
  backoffMilliseconds: number,
): BackoffStrategy {
  if (handle === 'linear') {
    return new LinearBackoffStrategy(backoffMilliseconds);
  }
  return new ExponentialBackoffStrategy(backoffMilliseconds);
}

export interface BackoffStrategy {
  /**
   * Calculates the backoff interval in milliseconds.
   * @param retry the number of the current retry, starts counting with 1
   */
  getBackoffMilliseconds(retry: number): number;
}

/**
 * Strategy for exponential backoffs.
 * Uses seconds as unit for calculating the exponent.
 */
export class ExponentialBackoffStrategy implements BackoffStrategy {
  constructor(private initialBackoffMilliseconds: number) {}

  getBackoffMilliseconds(retry: number): number {
    const initialBackoffSeconds = this.initialBackoffMilliseconds / 1000;
    return Math.pow(initialBackoffSeconds, retry) * 1000;
  }
}

/**
 * Strategy for linear backoffs.
 */
export class LinearBackoffStrategy implements BackoffStrategy {
  constructor(private backoffMilliseconds: number) {}

  getBackoffMilliseconds(): number {
    return this.backoffMilliseconds;
  }
}
