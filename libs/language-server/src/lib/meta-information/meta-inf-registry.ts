import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  BlockType,
  ConstraintType,
  isBlockType,
  isConstraintType,
} from '../ast/generated/ast';
import { ConstructorClass } from '../util/constructor-class';
import { Registry } from '../util/registry';

// eslint-disable-next-line import/no-cycle
import { BlockMetaInformation } from './block-meta-inf';
// eslint-disable-next-line import/no-cycle
import { ConstraintMetaInformation } from './constraint-meta-inf';
// eslint-disable-next-line import/no-cycle
import { MetaInformation } from './meta-inf';

export const metaInformationRegistry = new Registry<MetaInformation>();

export function registerMetaInformation(
  metaInfClass: ConstructorClass<MetaInformation>,
) {
  const metaInf = new metaInfClass();
  metaInformationRegistry.register(metaInf.type, metaInf);
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

  const metaInf = metaInformationRegistry.get(typeString);
  if (metaInf === undefined) {
    return undefined;
  }

  if (isBlockType(type)) {
    assert(metaInf instanceof BlockMetaInformation);
    return metaInf;
  }
  if (isConstraintType(type)) {
    assert(metaInf instanceof ConstraintMetaInformation);
    return metaInf;
  }
  assertUnreachable(type);
}

export function getRegisteredBlockMetaInformation(): BlockMetaInformation[] {
  return metaInformationRegistry
    .getAll()
    .filter(
      (metaInf) => metaInf instanceof BlockMetaInformation,
    ) as BlockMetaInformation[];
}

export function getRegisteredConstraintMetaInformation(): ConstraintMetaInformation[] {
  return metaInformationRegistry
    .getAll()
    .filter(
      (metaInf) => metaInf instanceof ConstraintMetaInformation,
    ) as ConstraintMetaInformation[];
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
    `Meta information for type ${type.name} was expected to be present, got undefined instead`,
  );
  return result;
}
