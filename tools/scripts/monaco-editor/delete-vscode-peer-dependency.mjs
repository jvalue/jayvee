// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { getOutputPath, parsePackageJson, writePackageJson } from "../shared-util.mjs";

// Executing this script: node path/to/delete-vscode-peer-dependency.mjs {projectName}
const [, , projectName] = process.argv;
process.chdir(getOutputPath(projectName));

const packageJson = parsePackageJson();

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
if (packageJson.peerDependencies) {
  delete packageJson.peerDependencies.vscode;
}

writePackageJson(packageJson);