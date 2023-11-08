// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { getOutputPath } from '../shared-util.mjs';
import fs from 'fs';

// Executing this script: node path/to/prepend-shebang.mjs {projectName} {file}
const [, , projectName, file] = process.argv;
const shebang = '#!/usr/bin/env node';

process.chdir(getOutputPath(projectName));

console.log(`Prepending shebang to file ${process.cwd()}/${file}`);
const previousFileContent = fs.readFileSync(file);
fs.writeFileSync(file, `${shebang}\n${previousFileContent}`);
console.log(`Finished appending shebang!`);