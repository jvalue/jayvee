// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

/**
 * Asserts that a certain node version is installed on the executing machine.
 * Exits the process if this prerequisite is not fulfilled.
 */
export function assertNodeVersion() {
  const requiredNodeMajorVersion = 17;
  const currentNodeMajorVersion = getNodeMajorVersion();

  if (currentNodeMajorVersion < requiredNodeMajorVersion) {
    console.error(
      `Jayvee requires node version ${requiredNodeMajorVersion}.0.0 or higher.`,
    );
    console.info(
      `Your current node version is ${currentNodeMajorVersion} - please upgrade!`,
    );
    process.exit(1);
  }
}

/**
 * Returns the node version of the executing machine.
 * Exits the process if no node process is running.
 */
function getNodeMajorVersion(): number {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const nodeVersion = process?.versions?.node;
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (nodeVersion === undefined) {
    console.error('Could not find a nodejs runtime.');
    process.exit(1);
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return +nodeVersion.split('.')[0]!;
}
