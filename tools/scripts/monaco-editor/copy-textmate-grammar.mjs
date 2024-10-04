// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { copyFile } from "node:fs/promises";
import { join } from "node:path";

import { getSourcePath } from "../shared-util.mjs";

const tmVscode = join(
	getSourcePath("vs-code-extension"),
	"..",
	"assets",
	"jayvee.tmLanguage.json",
);

const tmMonaco = join(
	getSourcePath("monaco-editor"),
	"lib",
	"generated",
	"jayvee.tmLanguage.json",
);

await copyFile(tmVscode, tmMonaco);
