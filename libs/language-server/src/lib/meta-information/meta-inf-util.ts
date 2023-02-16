import { strict as assert } from 'assert';

import { BlockType } from '../ast/generated/ast';

import type { BlockMetaInformation } from './block-meta-inf';

const registeredBlockMetaInformation = new Map<string, BlockMetaInformation>();

export function registerBlockMetaInformation(metaInf: BlockMetaInformation) {
  registeredBlockMetaInformation.set(metaInf.blockType, metaInf);
}

export function getMetaInformation(
  blockType: BlockType,
): BlockMetaInformation | undefined {
  return registeredBlockMetaInformation.get(blockType.name);
}

export function getRegisteredBlockTypes(): string[] {
  return [...registeredBlockMetaInformation.keys()];
}

export function getOrFailMetaInformation(
  blockType: BlockType | string,
): BlockMetaInformation {
  const blockTypeString = getBlockTypeString(blockType);
  const result = registeredBlockMetaInformation.get(blockTypeString);
  assert(
    result !== undefined,
    `Meta information for block type ${blockTypeString} was expected to be present`,
  );
  return result;
}

function getBlockTypeString(blockType: BlockType | string) {
  if (typeof blockType === 'string') {
    return blockType;
  }
  return blockType.name;
}
