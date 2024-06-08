import { type AstNode, type LangiumDocument, type MaybePromise } from 'langium';
import { type CodeLensProvider } from 'langium/lsp';
import { type CodeLens } from 'vscode-languageserver';
import { Command } from 'vscode-languageserver-protocol';

import { type PipeDefinition, isJayveeModel } from '../ast';

export interface RunJayveeCodeLensPayload {
  filePath: string;
  pipelineName: string;
}

export interface ShowPipeOutputCodeLensPayload {
  pipeOutputName: string;
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

  return 'pipeOutputName' in o && typeof o.pipeOutputName === 'string';
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

      const pipeLenses = pipeline.pipes.flatMap((pipe) =>
        this.getLensForPipe(pipe),
      );
      lenses.push(...pipeLenses);
    }
    return lenses;
  }

  getLensForPipe(pipe: PipeDefinition): CodeLens[] {
    const pipeRange = pipe.$cstNode?.range;
    const pipeLines = pipe.$cstNode?.text.split('\n') ?? [];

    if (pipeRange === undefined) {
      return [];
    }

    const lenses: CodeLens[] = [];
    for (const [i, pipeLine] of pipeLines.entries()) {
      const pipeChainElements = pipeLine
        .split('->')
        .map((s) => s.trim())
        .filter((s) => s !== '');

      for (const pipeChainElement of pipeChainElements) {
        const payload: ShowPipeOutputCodeLensPayload = {
          pipeOutputName: pipeChainElement,
        };

        lenses.push({
          range: {
            start: {
              line: pipeRange.start.line + i,
              character: 0,
            },
            end: {
              line: pipeRange.start.line + i,
              character: pipeLine.length,
            },
          },
          command: Command.create(
            `Show output (${pipeChainElement})`,
            'jayvee.pipe.output',
            payload,
          ),
        });
      }
    }
    return lenses;
  }
}
