// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Gets the current directory path.
 * We use this method for emulating tests in other directory to configure the correct working directory.
 */
export function getCurrentDir(): string {
  return process.cwd();
}
