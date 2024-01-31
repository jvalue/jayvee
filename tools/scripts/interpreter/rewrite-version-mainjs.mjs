// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {readFileSync, writeFileSync} from 'fs';
import {
    parsePackageJson, getOutputPath
} from '../shared-util.mjs';
import { workspaceRoot } from "@nx/devkit";

// Executing this script: node path/to/rewrite-version-mainjs.mjs {projectName}
const [, , projectName] = process.argv;

process.chdir(workspaceRoot);
const rootPackageJson = parsePackageJson();

process.chdir(getOutputPath(projectName));

const mainJs = readFileSync(`main.js`).toString();
const modifiedMainJs = mainJs.replace('$REPLACE_WITH_PROGRAM_VERSION_IN_PREPUBLISH_STEP', rootPackageJson.version);
writeFileSync(`main.js`, modifiedMainJs);
