import {
    invariant,
    parsePackageVersion,
    writePackageJson,
    parsePackageJson,
    getOutputPath
} from '../shared-util.mjs';

/**
 * When bundling a package, NX generates a package.json with a list of peer dependencies.
 * This list contains a few issues that are fixed by this function.
 * Please note that this function directly modifies the provided `package.json` object.
 *
 * The following changes are made to the peer dependencies:
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

// Executing this script: node path/to/fix-peer-dependencies.mjs {projectName}
const [, , projectName] = process.argv;
process.chdir(getOutputPath(projectName));

const packageJson = parsePackageJson();
invariant(packageJson.peerDependencies, 'Found no peer dependencies in package.json');

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

/*
  In our editor, we perform imports from a package called "vscode".
  This is however not the true name of the package.
  The actual name of the package is `@codingame/monaco-vscode-api`.
  `monaco-languageclient` renames this package (for whatever reason), see
  https://github.com/TypeFox/monaco-languageclient/blob/c5511b19e95e237c3f95a0fc0588769263f3ba40/packages/client/package.json#L56

  This is a problem for our bundler, because it seems unable to detect that the package has been renamed.
  Thus, it creates an entry in `package.json`, saying that our library depends on `vscode` instead of `@codingame/monaco-vscode-api`.

  Since this package is a peer dependency of `monaco-languageclient` anyways, we can simply remove the entry for `vscode` to fix the problem.
*/
delete packageJson.peerDependencies.vscode;

// By default, this value is set to the exact React version we are using. This makes it hard to use the package in environments where a different React version is present.
packageJson.peerDependencies.react = '>= 17';

writePackageJson(packageJson);
