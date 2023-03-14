import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  BlockType,
  ConstraintType,
  isBlockType,
  isConstraintType,
} from '../ast/generated/ast';

import type { BlockMetaInformation } from './block-meta-inf';
import type { ConstraintMetaInformation } from './constraint-meta-inf';
import type { MetaInformation } from './meta-inf';

const registeredBlockMetaInformation = new Map<string, BlockMetaInformation>();
const registeredConstraintMetaInformation = new Map<
  string,
  ConstraintMetaInformation
>();

export function registerBlockMetaInformation(metaInf: BlockMetaInformation) {
  registeredBlockMetaInformation.set(metaInf.type, metaInf);
}

export function registerConstraintMetaInformation(
  metaInf: ConstraintMetaInformation,
) {
  registeredConstraintMetaInformation.set(metaInf.type, metaInf);
}

export function getMetaInformation(
  type: BlockType,
): BlockMetaInformation | undefined;
export function getMetaInformation(
  type: ConstraintType,
): ConstraintMetaInformation | undefined;
export function getMetaInformation(
  type: BlockType | ConstraintType,
): MetaInformation | undefined;
export function getMetaInformation(
  type: BlockType | ConstraintType | undefined,
): BlockMetaInformation | ConstraintMetaInformation | undefined {
  const typeString = type?.name;
  if (typeString === undefined) {
    return undefined;
  }
  assert(type !== undefined);

  if (isBlockType(type)) {
    return registeredBlockMetaInformation.get(typeString);
  }
  if (isConstraintType(type)) {
    return registeredConstraintMetaInformation.get(typeString);
  }
  assertUnreachable(type);
}

export function getRegisteredMetaInformation(): BlockMetaInformation[] {
  return [...registeredBlockMetaInformation.values()];
}

export function getOrFailMetaInformation(type: BlockType): BlockMetaInformation;
export function getOrFailMetaInformation(
  type: ConstraintType,
): ConstraintMetaInformation;
export function getOrFailMetaInformation(
  type: BlockType | ConstraintType,
): MetaInformation;
export function getOrFailMetaInformation(
  type: BlockType | ConstraintType,
): MetaInformation {
  const result = getMetaInformation(type);
  assert(
    result !== undefined,
    `Meta information for type ${type.name} was expected to be present`,
  );
  return result;
}

export function getOrFailBlockMetaInformation(
  typeString: string,
): BlockMetaInformation {
  const result = registeredBlockMetaInformation.get(typeString);
  assert(
    result !== undefined,
    `Meta information for block type ${typeString} was expected to be present`,
  );
  return result;
}

export function getOrFailConstraintMetaInformation(
  typeString: string,
): ConstraintMetaInformation {
  const result = registeredConstraintMetaInformation.get(typeString);
  assert(
    result !== undefined,
    `Meta information for constraint type ${typeString} was expected to be present`,
  );
  return result;
}
