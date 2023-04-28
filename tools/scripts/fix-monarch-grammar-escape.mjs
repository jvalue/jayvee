// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {getSourcePath} from "./shared-util.mjs";
import {readFileSync, writeFileSync} from "fs";

// This script solely serves as a temporary workaround until https://github.com/langium/langium/issues/740 is resolved.

const monarchFilePath = getSourcePath('monaco-editor') + '/lib/jayvee.monarch.ts';

const monarchFileContent = readFileSync(monarchFilePath).toString();

// Replace unescaped occurrence of '|/'with '|\/':
writeFileSync(monarchFilePath, monarchFileContent.replace(/\|\//g, '|\\/'));
