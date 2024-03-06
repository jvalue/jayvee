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

import { MermaidBuilder, MermaidOptions } from './mermaid_builder';
import {
  diagramDirection,
  diagramType,
  font,
  fontSize,
  properties,
  subgraphColor,
  subgraphDirection,
} from './mermaid_params';

export function createMermaidLinks(
  pipeline: PipelineDefinition,
  mermaidBuilder: MermaidBuilder,
): MermaidBuilder {
  const processBlock = (block: BlockDefinition): void => {
    const chainOfBlocks: string[] = [block.name];
    const compositeBlocks: BlockDefinition[] = [];
    let children: BlockDefinition[] = pipelineWrapper.getChildBlocks(block);
    // as long as the pipeline does not split up
    while (children.length === 1) {
      if (isCompositeBlocktypeDefinition(block.type.ref)) {
        compositeBlocks.push(block);
      }
      // jump to next block and get its children
      assert(children[0] !== undefined);
      block = children[0];
      chainOfBlocks.push(block.name);
      children = pipelineWrapper.getChildBlocks(block);
    }
    // the complete chain of blocks is written
    mermaidBuilder.chain(chainOfBlocks);
    // process all composite blocks
    compositeBlocks.forEach((compositeBlock) => {
      processCompositeBlock(compositeBlock);
    });
    // the pipeline branches here
    if (children.length > 1) {
      children.forEach((child) => {
        // create one branching per child
        mermaidBuilder.branching(block, child);
        // and process all child blocks
        processBlock(child);
      });
    }
  };

  const processCompositeBlock = (block: BlockDefinition): void => {
    // the string representation of a composite blocks consists of:
    // header with name and direction
    // body with pipe of subblocks and optionally nested composite blocks
    // tail with keyword 'end'
    mermaidBuilder.compositeHeader(block, subgraphDirection);
    const subBlocks: string[] = [];
    const compositeBlocks: BlockDefinition[] = [];
    assert(isCompositeBlocktypeDefinition(block.type.ref));
    // collect all subblocks
    for (const subblock of block.type.ref.blocks) {
      subBlocks.push(subblock.name);
      // and all subblocks that are composite blocks themselves
      if (isCompositeBlocktypeDefinition(subblock.type.ref)) {
        compositeBlocks.push(subblock);
      }
    }
    mermaidBuilder.compositeBody(subBlocks);
    // process all composite blocks
    compositeBlocks.forEach((compositeBlock) => {
      processCompositeBlock(compositeBlock);
    });
    mermaidBuilder.compositeTail();
  };

  const pipelineWrapper = new PipelineWrapper(pipeline);
  mermaidBuilder.pipelineStart(pipeline);
  for (const block of pipelineWrapper.getStartingBlocks()) {
    processBlock(block);
  }
  mermaidBuilder.pipelineEnd();
  return mermaidBuilder;
}

export function createMermaidNodes(
  pipeline: PipelineDefinition,
  mermaidBuilder: MermaidBuilder,
): MermaidBuilder {
  const processBlock = (block: BlockDefinition, isSubBlock = false) => {
    assert(block.type.ref !== undefined);
    const blockProperties: Map<string, string> = new Map();
    for (const property of block.body.properties) {
      if (properties.includes(property.name)) {
        if (isTextLiteral(property.value)) {
          blockProperties.set(property.name, property.value.value);
        }
      }
    }
    mermaidBuilder.blockType(block, blockProperties, isSubBlock);
    const blocktype = new BlockTypeWrapper(block.type);
    if (!blocktype.hasInput()) {
      mermaidBuilder.classAssign(block, isSubBlock, 'source');
    }
    if (!blocktype.hasOutput()) {
      mermaidBuilder.classAssign(block, isSubBlock, 'sink');
    }
    if (isCompositeBlocktypeDefinition(block.type.ref)) {
      for (const subblock of block.type.ref.blocks) {
        processBlock(subblock, (isSubBlock = true));
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
  mermaidBuilder = createMermaidLinks(pipeline, mermaidBuilder);
  mermaidBuilder = createMermaidNodes(pipeline, mermaidBuilder);
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
