import {getOutputPath, parsePackageJson, writePackageJson} from "../shared-util.mjs";

// Executing this script: node path/to/relax-react-version.mjs {projectName}
const [, , projectName] = process.argv;
process.chdir(getOutputPath(projectName));

const packageJson = parsePackageJson();

// By default, this value is set to the exact React version we are using. This makes it hard to use the package in environments where a different React version is present.
packageJson.peerDependencies.react = '>= 17';

writePackageJson(packageJson);