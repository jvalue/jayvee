const fs = require('fs');
const path = require('path');

const projectRootPath = process.cwd();

const { fixPeerDepsVersions, getProjectVersion } = require(path.join(
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
let parsedPackageJsonContent = JSON.parse(rawPackageJsonContent);

// Get the "version" field from the root package.json file and set it as the version of our package.
parsedPackageJsonContent.version = getProjectVersion();

fixPeerDepsVersions(parsedPackageJsonContent);

/*
  Unfortunately, it seems like it is not possible to define a "base" package.json for the executor we are using. 
  However, we need to set a few fields in the generated package.json.
  
  To solve this, we use a custom file (which we call `package-overrides.json`) in order to define fields that shall be set (or overridden) in the generated package.json.
*/
const packageOverrides = getPackageOverrides();
parsedPackageJsonContent = { ...parsedPackageJsonContent, ...packageOverrides };

const prettyPrintedContent = JSON.stringify(parsedPackageJsonContent, null, 2);
fs.writeFileSync(languageServerPackageJsonPath, prettyPrintedContent);

/**
 * Get the content of `package-overrides.json`.
 */
function getPackageOverrides() {
  const packageOverridesPath = path.join(
    projectRootPath,
    'libs',
    'language-server',
    'package-overrides.json',
  );
  const fileContent = fs.readFileSync(packageOverridesPath);
  const parsedFileContent = JSON.parse(fileContent);

  return parsedFileContent;
}
