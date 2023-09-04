// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';

import {
  BuiltinConstrainttypeDefinition,
  ReferenceableBlocktypeDefinition,
  isCompositeBlocktypeDefinition,
} from '../ast/generated/ast';
import { ConstructorClass } from '../util/constructor-class';
import { Registry } from '../util/registry';

// eslint-disable-next-line import/no-cycle
import { BlockMetaInformation } from './block-meta-inf';
import { CompositeBlocktypeMetaInformation } from './composite-blocktype-meta-inf';
import { ConstraintMetaInformation } from './constraint-meta-inf';

export const blockMetaInfRegistry = new Registry<BlockMetaInformation>();
export const constraintMetaInfRegistry =
  new Registry<ConstraintMetaInformation>();

export function registerBlockMetaInf(
  metaInfClass: ConstructorClass<BlockMetaInformation>,
) {
  const metaInf = new metaInfClass();
  blockMetaInfRegistry.register(metaInf.type, metaInf);
}

export function registerConstraintMetaInf(
  metaInfClass: ConstructorClass<ConstraintMetaInformation>,
) {
  const metaInf = new metaInfClass();
  constraintMetaInfRegistry.register(metaInf.type, metaInf);
}

export function getBlockMetaInf(
  type:
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>
    | undefined,
): BlockMetaInformation | undefined {
  const dereferencedType = isReference(type) ? type.ref : type;
  if (dereferencedType === undefined) {
    return undefined;
  }

  // Register meta information about composite blocks from jv code
  if (
    isCompositeBlocktypeDefinition(dereferencedType) &&
    !blockMetaInfRegistry.get(dereferencedType.name)
  ) {
    blockMetaInfRegistry.register(
      dereferencedType.name,
      new CompositeBlocktypeMetaInformation(dereferencedType),
    );
  }

  const metaInf = blockMetaInfRegistry.get(dereferencedType.name);
  if (metaInf === undefined) {
    return undefined;
  }

  return metaInf;
}

export function getConstraintMetaInf(
  type:
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>
    | undefined,
): ConstraintMetaInformation | undefined {
  const dereferencedType = isReference(type) ? type.ref : type;
  if (dereferencedType === undefined) {
    return undefined;
  }

  const metaInf = constraintMetaInfRegistry.get(dereferencedType.name);
  if (metaInf === undefined) {
    return undefined;
  }

  return metaInf;
}

export function getRegisteredBlockMetaInformation(): BlockMetaInformation[] {
  return blockMetaInfRegistry.getAll();
}

export function getRegisteredConstraintMetaInformation(): ConstraintMetaInformation[] {
  return constraintMetaInfRegistry.getAll();
}

export function getOrFailBockMetaInf(
  type:
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>,
): BlockMetaInformation {
  const result = getBlockMetaInf(type);
  const typeName =
    (isReference(type) ? type.ref?.name : type.name) ?? '<invalid ref>';
  assert(
    result !== undefined,
    `Meta information for blocktype ${typeName} was expected to be present, got undefined instead`,
  );
  return result;
}

export function getOrFailConstraintMetaInf(
  type:
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>,
): ConstraintMetaInformation {
  const result = getConstraintMetaInf(type);
  const typeName =
    (isReference(type) ? type.ref?.name : type.name) ?? '<invalid ref>';
  assert(
    result !== undefined,
    `Meta information for constrainttype ${typeName} was expected to be present, got undefined instead`,
  );
  return result;
}
