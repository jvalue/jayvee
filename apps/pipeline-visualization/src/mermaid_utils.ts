import { strict as assert } from 'assert';

import {
  BlockDefinition,
  JayveeModel,
  PipelineDefinition,
  collectChildren,
  collectStartingBlocks,
  getBlocksInTopologicalSorting,
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
  /* const myToString = (block: BlockDefinition, index = 0): string => {
    const blockTypeName = block.type.ref?.name;
    const blockString = `${index}["\`${block.name} \n (${blockTypeName})\`"]`;
    const childString = collectChildren(block)
      .map((child) => myToString(child, index + 1))
      .join('-->');
    return blockString + '-->' + childString;
  };
 */
  const name: string = 'subgraph ' + pipeline.name;
  const direction: string = 'direction ' + subgraphDirection;
  const listofPipes: Array<string[]> = [];
  const listofBocks: Array<string> = [];
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
    // let propertyString = block.body.properties.map((property) => `${property.name}: ${property.value.value}`).join("\n")
    // Markdown styling
    // listofBocks.push(`${block.name}["\` ${block.name}\n(${block.type.ref?.name})\n${propertyString}\`" ]`)
    // HTML styling
    assert(block.type.ref !== undefined);
    listofBocks.push(
      `${block.name}[${block.name}<br><i>${block.type.ref.name}</i><br>${propertyString}]`,
    );
    const children = collectChildren(block);
    if (children.length === 1) {
      assert(children[0] !== undefined);
      process_pipe(pipe, children[0]);
    } else if (children.length > 1) {
      listofPipes.push(pipe);
      children.forEach((child) => {
        process_pipe([block.name], child);
      });
    } else {
      listofPipes.push(pipe);
    }
  };
  const startingBlocks = collectStartingBlocks(pipeline);
  startingBlocks.forEach((startingBlock) => process_pipe([], startingBlock));
  const pipelineSet = listofPipes
    .map((pipeline) => pipeline.join('-->'))
    .join('\n');
  const blockSet = listofBocks.join('\n');

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
    if (block.name.includes('Extractor')) {
      classAssign.push(`class ${block.name} source;`);
    }
    if (block.name.includes('Loader')) {
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
  const pipelineCodes: string[] = [];
  const stylings: string[] = [];
  model.pipelines.forEach((pipeline) => {
    // let pipelineCode = processPipeline(pipeline);
    const pipelineCode = createMermaidPipeline(pipeline, mermaidOptions);
    const styling = createMermaidStyling(pipeline);
    pipelineCodes.push(pipelineCode);
    stylings.push(styling);
  });
  const styles = setMermaidStyling();
  return (
    diagramSetup +
    '\n' +
    pipelineCodes.join('\n') +
    '\n' +
    stylings.join('\n') +
    '\n' +
    styles
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
