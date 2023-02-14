import {
    writePackageJson, parsePackageJson, getOutputPath
} from './shared-util.mjs';

// Executing this script: node path/to/delete-dependencies.mjs {projectName}
const [, , projectName] = process.argv;
process.chdir(getOutputPath(projectName));

const packageJson = parsePackageJson();

delete packageJson.dependencies;

writePackageJson(packageJson);
