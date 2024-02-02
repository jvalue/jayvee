// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
    writePackageJson, parsePackageJson, getOutputPath
} from './shared-util.mjs';
import { workspaceRoot } from "@nx/devkit";

// Executing this script: node path/to/add-package-json-version.mjs {projectName}
const [, , projectName] = process.argv;

process.chdir(workspaceRoot);
const rootPackageJson = parsePackageJson();

process.chdir(getOutputPath(projectName));

const packageJson = parsePackageJson();
packageJson.version = rootPackageJson.version;
writePackageJson(packageJson);
