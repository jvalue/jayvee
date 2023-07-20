// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

export interface BackoffStrategy {
  /**
   * Calculates the next backoff interval in milliseconds.
   * @param retry the number of the current retry, starts counting with 1
   */
  getBackoffMilliseconds(retry: number): number;
}

export class ExponentialBackoffStrategy implements BackoffStrategy {
  constructor(private initialBackoffMilliseconds: number) {}

  getBackoffMilliseconds(retry: number): number {
    return Math.pow(this.initialBackoffMilliseconds, retry);
  }
}

export class LinearBackoffStrategy implements BackoffStrategy {
  constructor(private backoffMilliseconds: number) {}

  getBackoffMilliseconds(): number {
    return this.backoffMilliseconds;
  }
}
