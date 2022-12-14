const fs = require('fs');
const path = require('path');

const projectRootPath = process.cwd();

const { getProjectVersion } = require(path.join(
  projectRootPath,
  'scripts',
  'build-helpers.js',
));

const languageServerPackageJsonPath = path.join(
  projectRootPath,
  'dist',
  'libs',
  'language-server',
  'package.json',
);

const rawPackageJsonContent = fs
  .readFileSync(languageServerPackageJsonPath)
  .toString();
const parsedPackageJsonContent = JSON.parse(rawPackageJsonContent);

// Get the "version" field from the root package.json file and set it as the version of our package.
parsedPackageJsonContent.version = getProjectVersion();

const prettyPrintedContent = JSON.stringify(parsedPackageJsonContent, null, 2);
fs.writeFileSync(languageServerPackageJsonPath, prettyPrintedContent);
