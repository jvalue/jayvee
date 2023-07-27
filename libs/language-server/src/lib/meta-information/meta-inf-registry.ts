// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  BuiltinBlocktypeDefinition,
  ConstraintTypeLiteral,
  isBuiltinBlocktypeDefinition,
  isConstraintTypeLiteral,
} from '../ast/generated/ast';
import { ConstructorClass } from '../util/constructor-class';
import { Registry } from '../util/registry';

// eslint-disable-next-line import/no-cycle
import { BlockMetaInformation } from './block-meta-inf';
import { ConstraintMetaInformation } from './constraint-meta-inf';
import { MetaInformation } from './meta-inf';

export const metaInformationRegistry = new Registry<MetaInformation>();

export function registerMetaInformation(
  metaInfClass: ConstructorClass<MetaInformation>,
) {
  const metaInf = new metaInfClass();
  metaInformationRegistry.register(metaInf.type, metaInf);
}

// TODO: allow Reference<BuiltinBlocktypeDefinition> for convenience
export function getMetaInformation(
  type: BuiltinBlocktypeDefinition | undefined,
): BlockMetaInformation | undefined;
export function getMetaInformation(
  type: ConstraintTypeLiteral | undefined,
): ConstraintMetaInformation | undefined;
export function getMetaInformation(
  type: BuiltinBlocktypeDefinition | ConstraintTypeLiteral | undefined,
): MetaInformation | undefined;
export function getMetaInformation(
  type: BuiltinBlocktypeDefinition | ConstraintTypeLiteral | undefined,
): BlockMetaInformation | ConstraintMetaInformation | undefined {
  if (type === undefined) {
    return undefined;
  }

  const metaInf = metaInformationRegistry.get(type.name);
  if (metaInf === undefined) {
    return undefined;
  }

  if (isBuiltinBlocktypeDefinition(type)) {
    assert(metaInf instanceof BlockMetaInformation);
    return metaInf;
  }
  if (isConstraintTypeLiteral(type)) {
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

export function getOrFailMetaInformation(
  type: BuiltinBlocktypeDefinition,
): BlockMetaInformation;
export function getOrFailMetaInformation(
  type: ConstraintTypeLiteral,
): ConstraintMetaInformation;
export function getOrFailMetaInformation(
  type: BuiltinBlocktypeDefinition | ConstraintTypeLiteral,
): MetaInformation;
export function getOrFailMetaInformation(
  type: BuiltinBlocktypeDefinition | ConstraintTypeLiteral,
): MetaInformation {
  const result = getMetaInformation(type);
  assert(
    result !== undefined,
    `Meta information for type ${type.name} was expected to be present, got undefined instead`,
  );
  return result;
}
