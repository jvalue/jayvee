import {getOutputPath} from "../shared-util.mjs";
import fs from "fs";

// Executing this script: node path/to/prepend-shebang.mjs {projectName} {file}
const [, , projectName, file] = process.argv;
const shebang = '#!/usr/bin/env node';

process.chdir(getOutputPath(projectName));

const previousFileContent = fs.readFileSync(file)
fs.writeFileSync(file, `${shebang}\n${previousFileContent}`);
