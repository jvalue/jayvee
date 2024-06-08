// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';
import { exec } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { isRunJayveeCodeLensPayload } from '@jvalue/jayvee-language-server';
import { type ExtensionContext, window } from 'vscode';

export async function runJayveeCommand(
  payload: unknown,
  context: ExtensionContext,
) {
  try {
    await throwOnMismatchingJayveeVersion(context);
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : 'unknown error';
    await window.showErrorMessage(`Error executing jv: ${errorMsg}`);
  }

  assert(
    isRunJayveeCodeLensPayload(payload),
    `Payload ${JSON.stringify(
      payload,
    )} is not a valid RunJayveeCodeLensPayload`,
  );
  const filePath = payload.filePath;

  const shell = window.createTerminal('Run Jayvee');
  shell.sendText(`jv ${filePath}`);
  shell.show();
}

function throwOnMismatchingJayveeVersion(
  context: ExtensionContext,
): Promise<void> {
  const command = 'jv --version';
  const requiredVersion = getExtensionVersion(context);

  return new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        return reject(error);
      }

      const installedVersion = stdout.trim();
      if (installedVersion !== requiredVersion) {
        return reject(
          new Error(
            `No matching jv versions: expected version ${requiredVersion} but found version ${installedVersion}`,
          ),
        );
      }
      return resolve();
    });
  });
}

function getExtensionVersion(context: ExtensionContext): string | undefined {
  const packageJsonPath = path.join(context.extensionPath, 'package.json');
  const packageJsonString = readFileSync(packageJsonPath, 'utf8');
  const packageJson = JSON.parse(packageJsonString) as unknown;

  const hasVersionField =
    typeof packageJson === 'object' &&
    packageJson != null &&
    'version' in packageJson &&
    typeof packageJson.version === 'string';

  if (!hasVersionField) {
    return undefined;
  }
  return packageJson.version as string;
}
