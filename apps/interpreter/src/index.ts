// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Command } from 'commander';

import { version as packageJsonVersion } from '../package.json';

import { runAction } from './interpreter';

const runtimeParameterRegex = /^([_a-zA-Z][\w_]*)=(.*)$/;
function collectRuntimeParameters(
  optionValue: string,
  previous: Map<string, string>,
): Map<string, string> {
  const regexMatch = optionValue.match(runtimeParameterRegex);
  if (regexMatch == null) {
    throw new Error(
      `Encountered runtime parameter with invalid syntax: ${optionValue}`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const parameter = regexMatch[1]!;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const value = regexMatch[2]!;

  previous.set(parameter, value);
  return previous;
}

const program = new Command();

const version: string = packageJsonVersion as string;
program.version(version);

program
  .argument('<file>', `path to the .jv source file`)
  .option(
    '-e, --env <parameter>=<value>',
    'provide a runtime parameters',
    collectRuntimeParameters,
    new Map<string, string>(),
  )
  .option('-d, --debug', 'enable debug logging', false)
  .description('Run a Jayvee file')
  .action(runAction);

program.showHelpAfterError();

program.parse(process.argv);
