const fs = require('fs');
const path = require('path');

/**
 * Get the "version" field defined in the root package.json file.
 *
 * This function expects that `process.cwd()` points to the root of the project.
 */
function getProjectVersion() {
  const packageJsonContent = getRootPackageJsonContent();

  const version = packageJsonContent.version;
  if (!version) {
    throw Error('Found no "version" entry in package.json');
  }

  return version;
}

/**
 * Get the content of the root package.json file.
 *
 * This function expects that `process.cwd()` points to the root of the project.
 */
function getRootPackageJsonContent() {
  const projectRootPath = process.cwd();

  const packageJsonPath = path.join(projectRootPath, 'package.json');

  const rawPackageJsonContent = fs.readFileSync(packageJsonPath).toString();
  const parsedPackageJsonContent = JSON.parse(rawPackageJsonContent);

  return parsedPackageJsonContent;
}

module.exports = { getProjectVersion };
