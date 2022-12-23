import { strict as assert } from 'assert';

import type { BlockMetaInformation } from './block-meta-inf';

const registeredBlockMetaInformation = new Map<string, BlockMetaInformation>();

export function registerBlockMetaInformation(metaInf: BlockMetaInformation) {
  registeredBlockMetaInformation.set(metaInf.blockType, metaInf);
}

export function getMetaInformation(
  blockType: string,
): BlockMetaInformation | undefined {
  return registeredBlockMetaInformation.get(blockType);
}

export function getOrFailMetaInformation(
  blockType: string,
): BlockMetaInformation {
  const result = getMetaInformation(blockType);
  assert(
    result !== undefined,
    `Meta information for block type ${blockType} was expected to be present`,
  );
  return result;
}
