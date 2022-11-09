import { Command } from 'commander';

import { runAction } from './interpreter';

const program = new Command();

program
  .argument('<file>', `path to the .jv source file`)
  .description('Run a Jayvee file')
  .action(runAction);

program.showHelpAfterError();

program.parse(process.argv);
