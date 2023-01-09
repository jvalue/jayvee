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

/**
 * When bundling a package, NX generates a package.json with a list of peer dependencies.
 * This list contains a few issues that are fixed by this function.
 * Please note that this function directly modifies the provided `package.json` object.
 *
 * The following changes are made to the peer dependencies:
 * - If a package version like "1.2.3" is specified, it gets rewritten to "^1.0.0".
 * - A special case of the previous one: If a package version like "0.1.2" is specified, then this version gets rewritten to "^0.1.0". This is because work-in-progress packages are often versioned in a way that minor releases indicate larger changes.
 * - If a peer dependency is part of the `@jayvee` scope, the scope gets changed to `@jvalue`. This is necessary because the packages are eventually published under the `@jvalue` scope.
 * Example:
 * `"@jayvee/language-server": "1.2.3"` is rewritten to `"@jayvee/language-server": "npm:@jvalue/language-server@1.2.3"`
 *
 * Summary:
 *
 * ``` txt
 * "foo": "1.2.3"
 * --> "foo": "^1.0.0"
 *
 * "foo": "0.1.2"
 * --> foo": "^0.1.0"
 *
 * "@jayvee/foo": "1.2.3"
 * --> "@jayvee/foo": "npm:@jvalue/foo@1.2.3"
 * ```
 */
function fixPeerDepsVersions(packageJson) {
  if (!packageJson.peerDependencies) {
    throw Error('Found no peer dependencies');
  }

  for (const [packageName, packageVersion] of Object.entries(
    packageJson.peerDependencies,
  )) {
    /*    
      Packages in the "@jayvee" scope get renamed to have the "@jvalue" scope after publishing. 
      This is a problem for us, because we internally still refer to the "@jayvee" scope.
      To fix this, we rename the package in our peer deps, so that
      "@jayvee/foo": "1.2.3"
      becomes
      "@jayvee/foo": "npm:@jvalue/foo@1.2.3"

      We intentionally do not rewrite the version to "^1.2.3" here, because it is very likely that our packages are tightly connected with each other.
    */
    if (packageName.startsWith('@jayvee/')) {
      const nameWithoutScope = getPackageNameWithoutJayveeScope(packageName);
      packageJson.peerDependencies[
        packageName
      ] = `npm:@jvalue/${nameWithoutScope}@${packageVersion}`;
      continue;
    }

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

function getPackageNameWithoutJayveeScope(packageName) {
  const JAYVEE_SCOPE = '@jayvee/';
  if (!packageName.startsWith(JAYVEE_SCOPE)) {
    throw Error(
      `Package name "${packageName}" is not part of the Jayvee scope. This should not happen.`,
    );
  }

  return packageName.replace(JAYVEE_SCOPE, '');
}

function parsePackageVersion(versionString) {
  const expectedFormat = new RegExp('^[0-9]+.[0-9]+.[0-9]+$');
  if (!expectedFormat.test(versionString)) {
    throw Error(
      `The provided version "${versionString}" does not match the format "major.minor.patch".`,
    );
  }

  const [major, minor, patch] = versionString.split('.');

  return {
    major: Number.parseInt(major, 10),
    minor: Number.parseInt(minor, 10),
    patch: Number.parseInt(patch, 10),
  };
}

module.exports = {
  fixPeerDepsVersions,
  getProjectVersion,
};
