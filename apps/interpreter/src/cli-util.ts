import * as fs from 'fs';
import * as path from 'path';

import { ExecutionErrorDetails } from '@jayvee/execution';
import * as chalk from 'chalk';
import { AstNode, CstNode, LangiumDocument, LangiumServices } from 'langium';
import { URI } from 'vscode-uri';

export async function extractDocument(
  fileName: string,
  services: LangiumServices,
): Promise<LangiumDocument> {
  const extensions = services.LanguageMetaData.fileExtensions;
  if (!extensions.includes(path.extname(fileName))) {
    console.error(
      chalk.yellow(
        `Please choose a file with one of these extensions: ${extensions.toString()}.`,
      ),
    );
    process.exit(1);
  }

  if (!fs.existsSync(fileName)) {
    console.error(chalk.red(`File ${fileName} does not exist.`));
    process.exit(1);
  }

  const document =
    services.shared.workspace.LangiumDocuments.getOrCreateDocument(
      URI.file(path.resolve(fileName)),
    );
  await services.shared.workspace.DocumentBuilder.build([document], {
    validationChecks: 'all',
  });

  const validationErrors = (document.diagnostics ?? []).filter(
    (e) => e.severity === 1,
  );
  if (validationErrors.length > 0) {
    console.error(chalk.red('There are validation errors:'));
    for (const validationError of validationErrors) {
      console.error(
        chalk.red(
          `line ${validationError.range.start.line + 1}: ${
            validationError.message
          } [${document.textDocument.getText(validationError.range)}]`,
        ),
      );
    }
    process.exit(1);
  }

  return document;
}

export async function extractAstNode<T extends AstNode>(
  fileName: string,
  services: LangiumServices,
): Promise<T> {
  return (await extractDocument(fileName, services)).parseResult.value as T;
}

export function getCstTextWithLineNumbers(cstNode: CstNode): string {
  const text = cstNode.text;
  const lines = text.split('\n');
  const startLineNumber = cstNode.range.start.line + 1;

  let textWithLineNumbers = '';
  for (let i = 0; i < lines.length; ++i) {
    textWithLineNumbers += `${startLineNumber + i}\t| \t${lines[i] ?? ''}\n`;
  }
  return textWithLineNumbers;
}

export function printError(errDetails: ExecutionErrorDetails): void {
  console.error(chalk.red(errDetails.message));
  console.error(chalk.red(errDetails.hint));
  console.error();
  if (errDetails.cstNode !== undefined) {
    console.error(chalk.blue(getCstTextWithLineNumbers(errDetails.cstNode)));
  }
}
