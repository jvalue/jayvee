const fs = require('fs');
const path = require('path');

const projectRootPath = process.cwd();

const { getProjectVersion } = require(path.join(
  projectRootPath,
  'scripts',
  'build-helpers.js',
));

const monacoEditorPackageJsonPath = path.join(
  projectRootPath,
  'dist',
  'libs',
  'monaco-editor',
  'package.json',
);

const rawPackageJsonContent = fs
  .readFileSync(monacoEditorPackageJsonPath)
  .toString();
const parsedPackageJsonContent = JSON.parse(rawPackageJsonContent);

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
delete parsedPackageJsonContent.peerDependencies.vscode;

// Get the "version" field from the root package.json file and set it as the version of our package.
parsedPackageJsonContent.version = getProjectVersion();

const prettyPrintedContent = JSON.stringify(parsedPackageJsonContent, null, 2);
fs.writeFileSync(monacoEditorPackageJsonPath, prettyPrintedContent);
