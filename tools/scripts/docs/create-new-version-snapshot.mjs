import fs from "fs";
import path from 'path';
import { execSync } from 'child_process';

import {
    parsePackageJson, getSourcePath
} from '../shared-util.mjs';
import { workspaceRoot } from "@nx/devkit";

// Executing this script: node path/to/prepare-new-version-snapshot.mjs

const licenseHeader = "SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg"
    + "\n\n"
    + "SPDX-License-Identifier: AGPL-3.0-only";

process.chdir(workspaceRoot);
const packageJson = parsePackageJson();
const versionTag = packageJson.version

const pathToDocsVersion = path.join(getSourcePath('docs'), '..', 'versioned_docs', `version-${versionTag}`);
const pathToSidebarsVersion = path.join(getSourcePath('docs'), '..', 'versioned_sidebars');

createDocusaurusSnapshot();
deleteGitignoreRecursively(pathToDocsVersion);
addLicenseHeaderToFilesRecursive(pathToDocsVersion)
addLicenseHeaderToFilesRecursive(pathToSidebarsVersion)

function createDocusaurusSnapshot() {
  const pathToDocsProject = getSourcePath('docs');
  process.chdir(path.join(pathToDocsProject, '..'))
  execSync(`npx docusaurus docs:version ${versionTag}`);
  console.log(`Created docs snapshot for version ${versionTag}`);
  process.chdir(workspaceRoot);
}

function deleteGitignoreRecursively(dir) {
    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
      const fileStats = fs.statSync(filePath);

      if (fileStats.isDirectory()) {
        deleteGitignoreRecursively(filePath);
      } else if (file === '.gitignore') {
        fs.unlinkSync(filePath);
        console.log(`Deleted .gitignore file at ${filePath}`);
      }
    }
}

function addLicenseHeaderToFilesRecursive(dir) {
    for (const file of fs.readdirSync(dir)) {
        const filePath = path.join(dir, file);
      const fileStats = fs.statSync(filePath);

      if (fileStats.isDirectory()) {
        addLicenseHeaderToFilesRecursive(filePath);
      } else if (!file.endsWith('.license')){
        const licenseFilePath = path.join(dir, `${file}.license`)
        if (!fs.existsSync(licenseFilePath)) {
            fs.writeFileSync(licenseFilePath, licenseHeader)
            console.log(`Created license file at ${filePath}`);
        }
      }
    }
}