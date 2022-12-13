import { BlockType } from '../ast/generated/ast';

import type { BlockMetaInformation } from './block-meta-inf';

const registeredBlockMetaInformation = new Map<
  BlockType,
  BlockMetaInformation
>();

export function registerBlockMetaInformation(metaInf: BlockMetaInformation) {
  registeredBlockMetaInformation.set(metaInf.blockType, metaInf);
}

export function getMetaInformation(blockType: BlockType): BlockMetaInformation {
  const result = registeredBlockMetaInformation.get(blockType);
  if (result === undefined) {
    throw new Error(
      `No meta information was registered for block type ${blockType}`,
    );
  }
  return result;
}
