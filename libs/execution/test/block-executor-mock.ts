// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Interface for defining Mocks for BlockExecutors.
 * This is used to mock every external interaction of the corresponding block (e.g. web requests).
 */
export interface BlockExecutorMock {
  /**
   * Setup mocks for this block executor.
   * @param args Optional arguments for setup, further specified in implementations
   */
  setup(...args: unknown[]): Promise<void> | void;

  /**
   * Restore mocks for this block executor.
   */
  restore(): void;
}
