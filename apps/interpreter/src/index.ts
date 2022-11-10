import { Command } from 'commander';

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

program
  .argument('<file>', `path to the .jv source file`)
  .option(
    '-e, --env <parameter>=<value>',
    'runtime parameter',
    collectRuntimeParameters,
    new Map<string, string>(),
  )
  .description('Run a Jayvee file')
  .action(runAction);

program.showHelpAfterError();

program.parse(process.argv);
