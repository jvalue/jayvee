// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
    invariant,
    parsePackageVersion,
    writePackageJson,
    parsePackageJson,
    getOutputPath
} from './shared-util.mjs';

/**
 * This script applies the following changes to the peer dependencies:
 * - If a package version like "1.2.3" is specified, it gets rewritten to "^1.0.0".
 * - A special case of the previous one: If a package version like "0.1.2" is specified, then this version gets rewritten to "^0.1.0". This is because work-in-progress packages are often versioned in a way that minor releases indicate larger changes.
 *
 * Summary:
 *
 * ``` txt
 * "foo": "1.2.3"
 * --> "foo": "^1.0.0"
 *
 * "foo": "0.1.2"
 * --> foo": "^0.1.0"
 * ```
 */

// Executing this script: node path/to/relax-peer-dependency-versions.mjs {projectName}
const [, , projectName] = process.argv;
process.chdir(getOutputPath(projectName));

const packageJson = parsePackageJson();

if (packageJson.peerDependencies) {
    for (const [packageName, packageVersion] of Object.entries(
        packageJson.peerDependencies,
    )) {
        const parsedVersion = parsePackageVersion(packageVersion);
        let newVersion;
        if (parsedVersion.major < 1) {
            newVersion = `^0.${parsedVersion.minor}.0`;
        } else {
            newVersion = `^${parsedVersion.major}.0.0`;
        }
        packageJson.peerDependencies[packageName] = newVersion;
    }
}

writePackageJson(packageJson);
