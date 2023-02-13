import {execSync} from 'child_process';
import {getOutputPath} from "./shared-util.mjs";

// Executing this script: node path/to/publish.mjs {projectName}
const [, , projectName] = process.argv;

const outputPath = getOutputPath(projectName);

execSync(`npm publish ${outputPath}`);
