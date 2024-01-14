import { strict as assert } from 'assert';

import {
  BlockDefinition,
  BlockTypeWrapper,
  JayveeModel,
  PipelineDefinition,
  collectChildren,
  collectStartingBlocks,
  isCompositeBlocktypeDefinition,
  isTextLiteral,
} from '@jvalue/jayvee-language-server';

import {
  diagramDirection,
  diagramType,
  font,
  fontSize,
  properties,
  subgraphColor,
  subgraphDirection,
} from './mermaid_params';

export interface MermaidOptions {
  mermaidFile: string;
  styleFile: string;
  compositeBlocks: boolean;
  properties: boolean;
}

function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createMermaidPipeline(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
) {
  const name: string = 'subgraph ' + pipeline.name;
  const direction: string = 'direction ' + subgraphDirection;
  const listOfPipes: Array<string[]> = [];
  const listOfBocks: Array<string> = [];
  let composites = '';
  const process_pipe = (pipe: string[], block: BlockDefinition) => {
    pipe.push(block.name);
    if (isCompositeBlocktypeDefinition(block.type.ref)) {
      if (mermaidOptions.compositeBlocks) {
        const compositePipe: string[] = [];
        for (const subblock of block.type.ref.blocks) {
          compositePipe.push(subblock.name);
        }
        const compositeName = 'subgraph ' + block.name;
        composites +=
          compositeName +
          '\n' +
          direction +
          '\n' +
          compositePipe.join('-->') +
          '\n' +
          'end \n';
      }
    }
    let propertyString = '';
    if (mermaidOptions.properties) {
      for (const property of block.body.properties) {
        if (properties.includes(property.name)) {
          if (isTextLiteral(property.value)) {
            propertyString += `${property.name}: ${escapeHtml(
              property.value.value,
            )}\n`;
          }
        }
      }
    }
    assert(block.type.ref !== undefined);
    listOfBocks.push(
      `${block.name}[${block.name}<br><i>${block.type.ref.name}</i><br>${propertyString}]`,
    );
    const children = collectChildren(block);
    if (children.length === 1) {
      assert(children[0] !== undefined);
      process_pipe(pipe, children[0]);
    } else if (children.length > 1) {
      listOfPipes.push(pipe);
      children.forEach((child) => {
        process_pipe([block.name], child);
      });
    } else {
      listOfPipes.push(pipe);
    }
  };
  const startingBlocks = collectStartingBlocks(pipeline);
  startingBlocks.forEach((startingBlock) => process_pipe([], startingBlock));
  const pipelineSet = listOfPipes
    .map((pipeline) => pipeline.join('-->'))
    .join('\n');
  const blockSet = listOfBocks.join('\n');

  return (
    name +
    '\n' +
    direction +
    '\n' +
    pipelineSet +
    '\n' +
    'end \n' +
    composites +
    '\n' +
    blockSet +
    '\n'
  );
}

export function createMermaidStyling(pipeline: PipelineDefinition) {
  const classAssign = [];
  for (const block of pipeline.blocks) {
    const blocktype = new BlockTypeWrapper(block.type);
    if (!blocktype.hasInput()) {
      classAssign.push(`class ${block.name} source;`);
    }
    if (!blocktype.hasOutput()) {
      classAssign.push(`class ${block.name} sink;`);
    }
  }
  return classAssign.join('\n');
}

export function createMermaidRepresentation(
  model: JayveeModel,
  mermaidOptions: MermaidOptions,
) {
  const diagramSetup: string = diagramType + ' ' + diagramDirection;
  assert(model.pipelines[0] !== undefined);
  const pipeline = model.pipelines[0];
  const pipelineCode = createMermaidPipeline(pipeline, mermaidOptions);
  const pipelineStyling = createMermaidStyling(pipeline);
  const styles = setMermaidStyling();
  return (
    diagramSetup + '\n' + pipelineCode + '\n' + pipelineStyling + '\n' + styles
  );
}

export function setMermaidTheme() {
  const theme = `{
    "theme": "base",
    "themeVariables": {
        "fontFamily": "${font}",
        "fontSize": "${fontSize}",
        "clusterBkg": "${subgraphColor}"
        }
    }`;
  return theme;
}

export function setMermaidStyling() {
  const styleDefs = [
    'classDef source fill:#FF9999,stroke:#333,stroke-width:2px;',
    'classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;',
  ];
  return styleDefs.join('\n');
}
