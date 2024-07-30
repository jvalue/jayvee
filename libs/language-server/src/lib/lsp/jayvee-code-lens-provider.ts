// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocument, type MaybePromise } from 'langium';
import { type CodeLensProvider } from 'langium/lsp';
import { type CodeLens } from 'vscode-languageserver';
import { Command } from 'vscode-languageserver-protocol';

import { isJayveeModel } from '../ast';

export interface RunJayveeCodeLensPayload {
  filePath: string;
  pipelineName: string;
}

export interface ShowPipeOutputCodeLensPayload {
  pipeOutputName: string;
  lineNumber: number;
}

export function isRunJayveeCodeLensPayload(
  o: unknown,
): o is RunJayveeCodeLensPayload {
  if (typeof o !== 'object' || o == null) {
    return false;
  }

  return (
    'filePath' in o &&
    typeof o.filePath === 'string' &&
    'pipelineName' in o &&
    typeof o.pipelineName === 'string'
  );
}

export function isShowPipeOutputCodeLensPayload(
  o: unknown,
): o is ShowPipeOutputCodeLensPayload {
  if (typeof o !== 'object' || o == null) {
    return false;
  }

  return (
    'pipeOutputName' in o &&
    typeof o.pipeOutputName === 'string' &&
    'lineNumber' in o &&
    typeof o.lineNumber === 'number'
  );
}

export class JayveeCodeLensProvider implements CodeLensProvider {
  provideCodeLens(
    document: LangiumDocument<AstNode>,
  ): MaybePromise<CodeLens[] | undefined> {
    const model = document.parseResult.value;
    if (!isJayveeModel(model)) {
      return undefined;
    }
    const lenses: CodeLens[] = [];

    for (const pipeline of model.pipelines) {
      const pipelineDefinitionRange = pipeline.$cstNode?.range;

      if (pipelineDefinitionRange === undefined) {
        continue;
      }
      const payload: RunJayveeCodeLensPayload = {
        filePath: document.uri.fsPath,
        pipelineName: pipeline.name,
      };

      lenses.push({
        range: pipelineDefinitionRange,
        command: Command.create('Run (once)', 'jayvee.pipeline.run', payload),
      });
    }

    return lenses;
  }
}
