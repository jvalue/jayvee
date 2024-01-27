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

import { MermaidBuilder } from './mermaid_builder';

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

export function createMermaidLinks(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
) {
  const processBlock = (block: BlockDefinition, depth = 0): string => {
    const mermaidBuilder = new MermaidBuilder();
    const chainOfBlocks: string[] = [block.name];
    const compositeBlocks: BlockDefinition[] = [];
    let children: BlockDefinition[] = pipelineWrapper.getChildBlocks(block);
    // as long as the pipeline does not split up
    while (children.length === 1) {
      if (
        isCompositeBlocktypeDefinition(block.type.ref) &&
        mermaidOptions.compositeBlocks
      ) {
        compositeBlocks.push(block);
      }
      // jump to next block and get its children
      assert(children[0] !== undefined);
      block = children[0];
      chainOfBlocks.push(block.name);
      children = pipelineWrapper.getChildBlocks(block);
    }
    mermaidBuilder.chain(chainOfBlocks);
    // process all composite blocks
    const compositesString = compositeBlocks
      .map((compositeBlock) => processCompositeBlock(compositeBlock, depth + 1))
      .join('\n');
    // the pipeline branches here
    if (children.length > 1) {
      children.forEach((child) => {
        // create one line per branching
        mermaidBuilder.branching(block, child);
      });
      // process all child blocks
      const childrenString = children
        .map((child) => processBlock(child))
        .join('\n');
      mermaidBuilder.section(childrenString);
      return mermaidBuilder.build();
    }
    if (compositesString) {
      mermaidBuilder.section(compositesString);
    }
    return mermaidBuilder.build();
  };

  const processCompositeBlock = (block: BlockDefinition, depth = 0): string => {
    // the string representation of a composite blocks consists of:
    // header with name and direction
    // body with pipe of subblocks and optionally nested composite blocks
    // tail with keyword 'end'
    const mermaidBuilder = new MermaidBuilder();
    mermaidBuilder.compositeHeader(block, depth, subgraphDirection);
    const subblocks: string[] = [];
    const compositeBlocks: BlockDefinition[] = [];
    assert(isCompositeBlocktypeDefinition(block.type.ref));
    for (const subblock of block.type.ref.blocks) {
      subblocks.push(subblock.name);
      if (isCompositeBlocktypeDefinition(subblock.type.ref)) {
        compositeBlocks.push(subblock);
      }
    }
    mermaidBuilder.compositeBody(subblocks, depth);
    // process all composite blocks
    let compositesString = compositeBlocks
      .map((compositeBlock) => processCompositeBlock(compositeBlock, depth + 1))
      .join('\n');
    if (compositesString) {
      mermaidBuilder.section(compositesString);
    }
    mermaidBuilder.compositeTail(depth);

    return mermaidBuilder.build();
  };
  const mermaidBuilder = new MermaidBuilder();
  const pipelineWrapper = new PipelineWrapper(pipeline);
  mermaidBuilder.pipelineHead(pipeline.name);
  for (const block of pipelineWrapper.getStartingBlocks()) {
    mermaidBuilder.section(processBlock(block, 0));
  }
  return mermaidBuilder.end().build();
}

export function createMermaidNodes(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
) {
  const mermaidBuilder = new MermaidBuilder();

  const processBlock = (block: BlockDefinition) => {
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
      mermaidBuilder.blockTypeWithProperties(block, propertyString);
    } else {
      mermaidBuilder.blockType(block);
    }
    const blocktype = new BlockTypeWrapper(block.type);
    if (!blocktype.hasInput()) {
      mermaidBuilder.classAssign(block, 'source');
    }
    if (!blocktype.hasOutput()) {
      mermaidBuilder.classAssign(block, 'sink');
    }
    if (
      isCompositeBlocktypeDefinition(block.type.ref) &&
      mermaidOptions.compositeBlocks
    ) {
      for (const subblock of block.type.ref.blocks) {
        processBlock(subblock);
      }
    }
  };

  for (const block of pipeline.blocks) {
    processBlock(block);
  }
  return mermaidBuilder.build();
}

export function createMermaidRepresentation(
  model: JayveeModel,
  mermaidOptions: MermaidOptions,
) {
  const diagramSetup: string = diagramType + ' ' + diagramDirection;
  assert(model.pipelines[0] !== undefined);
  const pipeline = model.pipelines[0];
  const pipelineCode = createMermaidLinks(pipeline, mermaidOptions);
  const pipelineStyling = createMermaidNodes(pipeline, mermaidOptions);
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
