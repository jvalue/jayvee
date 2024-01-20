// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  BlockDefinition,
  BlockTypeWrapper,
  JayveeModel,
  PipelineDefinition,
  PipelineWrapper,
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

export function processMermaidLinks(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
) {
  const processBlock = (block: BlockDefinition, depth = 0): string => {
    const chain: string[] = [block.name];
    const compositeBlocks = [];
    let children: BlockDefinition[] = pipelineWrapper.getChildBlocks(block);
    while (children.length === 1) {
      if (
        isCompositeBlocktypeDefinition(block.type.ref) &&
        mermaidOptions.compositeBlocks
      ) {
        compositeBlocks.push(block);
      }
      assert(children[0] !== undefined);
      block = children[0];
      chain.push(block.name);
      children = pipelineWrapper.getChildBlocks(block);
    }
    let blockString = chain.join('-->');
    const composites = compositeBlocks
      .map((compositeBlock) => processCompositeBlock(compositeBlock, depth + 1))
      .join('\n');

    if (children.length > 1) {
      children.forEach((child) => {
        blockString += `\n${block.name}-->${child.name}`;
      });
      const childrenString = children
        .map((child) => processBlock(child))
        .join('\n');
      return blockString + '\n' + childrenString;
    }
    return blockString + '\n' + composites;
  };

  const processCompositeBlock = (block: BlockDefinition, depth = 0): string => {
    const header = `${'\t'.repeat(depth)}subgraph ${block.name}\n ${'\t'.repeat(
      depth,
    )}direction ${subgraphDirection}`;
    const subblocks = [];
    const compositeBlocks = [];
    assert(isCompositeBlocktypeDefinition(block.type.ref));
    for (const subblock of block.type.ref.blocks) {
      subblocks.push(subblock.name);
      if (isCompositeBlocktypeDefinition(subblock.type.ref)) {
        compositeBlocks.push(subblock);
      }
    }
    const body = `${'\t'.repeat(depth)}` + subblocks.join('-->');
    let composites = compositeBlocks
      .map((compositeBlock) => processCompositeBlock(compositeBlock, depth + 1))
      .join('\n');
    const tail = `${'\t'.repeat(depth)}end`;

    if (composites) {
      composites = composites + '\n';
    }

    return header + '\n' + body + '\n' + composites + tail;
  };

  const linesBuffer: string[] = [];
  const pipelineWrapper = new PipelineWrapper(pipeline);
  const pipelineHead = 'subgraph ' + pipeline.name;
  for (const block of pipelineWrapper.getStartingBlocks()) {
    linesBuffer.push(processBlock(block, 0));
  }

  return pipelineHead + '\n' + linesBuffer.join('\n') + '\nend';
}

export function processMermaidNodes(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
) {
  const blockList = [];
  const classAssignments = [];

  for (const block of pipeline.blocks) {
    assert(block.type.ref !== undefined);
    if (mermaidOptions.properties) {
      let propertyString = '';
      for (const property of block.body.properties) {
        if (properties.includes(property.name)) {
          if (isTextLiteral(property.value)) {
            propertyString += `${property.name}: ${escapeHtml(
              property.value.value,
            )}\n`;
          }
        }
      }
      blockList.push(
        `${block.name}[${block.name}<br><i>${block.type.ref.name}</i><br>${propertyString}]`,
      );
    } else {
      blockList.push(
        `${block.name}[${block.name}<br><i>${block.type.ref.name}</i>]`,
      );
    }
    const blocktype = new BlockTypeWrapper(block.type);
    if (!blocktype.hasInput()) {
      classAssignments.push(`class ${block.name} source;`);
    }
    if (!blocktype.hasOutput()) {
      classAssignments.push(`class ${block.name} sink;`);
    }
  }
  return blockList.join('\n') + '\n\n' + classAssignments.join('\n');
}

export function createMermaidRepresentation(
  model: JayveeModel,
  mermaidOptions: MermaidOptions,
) {
  const diagramSetup: string = diagramType + ' ' + diagramDirection;
  assert(model.pipelines[0] !== undefined);
  const pipeline = model.pipelines[0];
  const pipelineCode = processMermaidLinks(pipeline, mermaidOptions);
  const pipelineStyling = processMermaidNodes(pipeline, mermaidOptions);
  const styles = setMermaidStyling();
  return (
    diagramSetup +
    '\n' +
    pipelineCode +
    '\n\n' +
    pipelineStyling +
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
