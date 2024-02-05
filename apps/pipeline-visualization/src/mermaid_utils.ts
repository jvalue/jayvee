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

export function createMermaidLinks(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
  mermaidBuilder: MermaidBuilder,
): MermaidBuilder {
  const processBlock = (block: BlockDefinition): void => {
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
      .map((compositeBlock) => processCompositeBlock(compositeBlock))
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
      //return mermaidBuilder.build();
    }
    if (compositesString) {
      mermaidBuilder.section(compositesString);
    }
    //return mermaidBuilder.build();
  };

  const processCompositeBlock = (block: BlockDefinition): void => {
    // the string representation of a composite blocks consists of:
    // header with name and direction
    // body with pipe of subblocks and optionally nested composite blocks
    // tail with keyword 'end'
    mermaidBuilder.compositeHeader(block, subgraphDirection);
    const subblocks: string[] = [];
    const compositeBlocks: BlockDefinition[] = [];
    assert(isCompositeBlocktypeDefinition(block.type.ref));
    for (const subblock of block.type.ref.blocks) {
      subblocks.push(subblock.name);
      if (isCompositeBlocktypeDefinition(subblock.type.ref)) {
        compositeBlocks.push(subblock);
      }
    }
    mermaidBuilder.compositeBody(subblocks);
    // process all composite blocks
    let compositesString = compositeBlocks
      .map((compositeBlock) => processCompositeBlock(compositeBlock))
      .join('\n');
    if (compositesString) {
      mermaidBuilder.section(compositesString);
    }
    mermaidBuilder.compositeTail();

    //return mermaidBuilder.build();
  };
  const pipelineWrapper = new PipelineWrapper(pipeline);
  mermaidBuilder.pipelineHead(pipeline);
  for (const block of pipelineWrapper.getStartingBlocks()) {
    processBlock(block);
  }
  mermaidBuilder.end();
  return mermaidBuilder;
}

export function createMermaidNodes(
  pipeline: PipelineDefinition,
  mermaidOptions: MermaidOptions,
  mermaidBuilder: MermaidBuilder,
): MermaidBuilder {
  const processBlock = (block: BlockDefinition) => {
    assert(block.type.ref !== undefined);
    let blockProperties: Map<string, string> = new Map();
    for (const property of block.body.properties) {
      if (properties.includes(property.name)) {
        if (isTextLiteral(property.value)) {
          blockProperties.set(property.name, property.value.value);
        }
      }
    }
    mermaidBuilder.blockType(block, blockProperties);
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
  return mermaidBuilder;
}

export function createMermaidRepresentation(
  model: JayveeModel,
  mermaidOptions: MermaidOptions,
) {
  let mermaidBuilder = new MermaidBuilder(mermaidOptions);
  mermaidBuilder.diagram(diagramType, diagramDirection);
  assert(model.pipelines[0] !== undefined);
  const pipeline = model.pipelines[0];
  mermaidBuilder = createMermaidLinks(pipeline, mermaidOptions, mermaidBuilder);
  mermaidBuilder = createMermaidNodes(pipeline, mermaidOptions, mermaidBuilder);
  mermaidBuilder = setMermaidStyling(mermaidBuilder);
  return mermaidBuilder.build();
}

export function setMermaidStyling(
  mermaidBuilder: MermaidBuilder,
): MermaidBuilder {
  mermaidBuilder.styles(
    'classDef source fill:#FF9999,stroke:#333,stroke-width:2px;',
  );
  mermaidBuilder.styles(
    'classDef sink fill:#BDFFA4,stroke:#333,stroke-width:2px;',
  );
  return mermaidBuilder;
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
