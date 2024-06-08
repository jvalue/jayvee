// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { isRunJayveeCodeLensPayload } from '@jvalue/jayvee-language-server';
import { window } from 'vscode';

export function runJayveeCommand(...args: unknown[]) {
  const payload = args[0];
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
