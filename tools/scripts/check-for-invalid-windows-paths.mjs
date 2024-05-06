// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'node:fs';
import path from 'node:path';

/**
 * Checks if a path contains characters not valid for windows.
 * @param filePath {string}
 * @returns {boolean}
 */
function containsInvalidCharactersForWindows(filePath) {
    const invalidCharsRegex = /[<>:"/\\|?*]/;
    return invalidCharsRegex.test(filePath);
}

/**
 * Checks a directory for paths that are invalid in windows.
 * @param currentDirectory {string}
 * @return string[]
 */
function checkPaths(currentDirectory) {
    /** @type {string[]} */
    const invalidPaths = [];
    const files = fs.readdirSync(currentDirectory);

    files.forEach(file => {
        const filePath = path.join(currentDirectory, file);

        if (containsInvalidCharactersForWindows(file)) {
            // If new part of a path contains invalid characters, add the full relative path.
            invalidPaths.push(filePath);
        }

        if (fs.statSync(filePath).isDirectory()) {
            invalidPaths.push(...checkPaths(filePath));
        }
    });

    return invalidPaths;
}

// Main script
const currentDirectory = process.cwd();
const invalidPaths = checkPaths(currentDirectory);

if (invalidPaths.length > 0) {
    console.log(`${invalidPaths.length} invalid path(s) for Windows found.`);
    for (const invalidPath of invalidPaths) {
        console.log(`- ${invalidPath}`)
    }
    process.exit(1);
} else {
    console.log(`The path ${currentDirectory} only contains valid windows file names.`)
}
