// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { isShowPipeOutputCodeLensPayload } from '@jvalue/jayvee-language-server';
import { ViewColumn, window, workspace } from 'vscode';

export async function showPipeOutput(payload: unknown) {
  assert(
    isShowPipeOutputCodeLensPayload(payload),
    `Payload ${JSON.stringify(
      payload,
    )} is not a valid ShowPipeOutputCodeLensPayload`,
  );
  const outputName = payload.pipeOutputName;
  const matchingOutputFiles = await workspace.findFiles(
    `.jv/cache/${outputName}.*`,
  );

  if (matchingOutputFiles.length === 0) {
    return await window.showErrorMessage(
      `Could not find corresponding output file. Consider running the pipeline first.`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const matchingOutputFile = matchingOutputFiles[0]!;

  const document = await workspace.openTextDocument(matchingOutputFile);
  await window.showTextDocument(document, { viewColumn: ViewColumn.Beside });
}
