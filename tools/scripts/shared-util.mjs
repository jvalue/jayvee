import {readFileSync, writeFileSync} from 'fs';
import {readCachedProjectGraph} from "@nrwl/devkit";
import chalk from "chalk";

export function invariant(condition, message) {
    if (!condition) {
        console.error(chalk.bold.red(message));
        process.exit(1);
    }
}

export function getOutputPath(projectName) {
    invariant(
        projectName,
        `No project name was provided.`,
    );

    const graph = readCachedProjectGraph();
    const project = graph.nodes[projectName];

    invariant(
        project,
        `Could not find project "${projectName}" in the workspace. Is the project.json configured correctly?`,
    );

    const outputPath = project.data?.targets?.build?.options?.outputPath;
    invariant(
        outputPath,
        `Could not find "build.options.outputPath" of project "${projectName}". Is project.json configured correctly?`,
    );

    return outputPath;
}

export function parsePackageJson() {
    return JSON.parse(readFileSync(`package.json`).toString());
}

export function writePackageJson(parsedContent) {
    invariant(
        typeof parsedContent === 'object',
        `The content for package.json is expected to be an object.`,
    );

    writeFileSync(`package.json`, JSON.stringify(parsedContent, null, 2));
}

export function parsePackageVersion(versionString) {
    const validVersion = /^(\d+)\.(\d+)\.(\d+)(-\w+\.\d+)?/;
    invariant(
        versionString && validVersion.test(versionString),
        `Versions are expected to match Semantic Versioning, expected: #.#.#-tag.# or #.#.#, got ${versionString}.`,
    );

    const [, major, minor, patch] = validVersion.exec(versionString);

    return {
        major: Number.parseInt(major, 10),
        minor: Number.parseInt(minor, 10),
        patch: Number.parseInt(patch, 10),
    };
}
