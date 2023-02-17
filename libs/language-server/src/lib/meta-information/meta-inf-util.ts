import { strict as assert } from 'assert';

import { BlockType } from '../ast/generated/ast';

import type { BlockMetaInformation } from './block-meta-inf';

const registeredBlockMetaInformation = new Map<string, BlockMetaInformation>();

export function registerBlockMetaInformation(metaInf: BlockMetaInformation) {
  registeredBlockMetaInformation.set(metaInf.blockType, metaInf);
}

export function getMetaInformation(
  blockType: BlockType | undefined,
): BlockMetaInformation | undefined {
  const blockTypeString = blockType?.name;
  if (blockTypeString === undefined) {
    return undefined;
  }
  return registeredBlockMetaInformation.get(blockTypeString);
}

export function getRegisteredBlockTypes(): string[] {
  return [...registeredBlockMetaInformation.keys()];
}

export function getOrFailMetaInformation(
  blockType: BlockType | string,
): BlockMetaInformation {
  const blockTypeString = getBlockTypeString(blockType);
  assert(
    blockTypeString !== undefined,
    'The block type string is expected to be defined',
  );
  const result = registeredBlockMetaInformation.get(blockTypeString);
  assert(
    result !== undefined,
    `Meta information for block type ${blockTypeString} was expected to be present`,
  );
  return result;
}

function getBlockTypeString(blockType: BlockType | string): string | undefined {
  if (typeof blockType === 'string') {
    return blockType;
  }
  return blockType.name;
}
