// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';
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

export function getMetaInformation(
  type:
    | BuiltinBlocktypeDefinition
    | Reference<BuiltinBlocktypeDefinition>
    | undefined,
): BlockMetaInformation | undefined;
export function getMetaInformation(
  type: ConstraintTypeLiteral | undefined,
): ConstraintMetaInformation | undefined;
export function getMetaInformation(
  type:
    | BuiltinBlocktypeDefinition
    | Reference<BuiltinBlocktypeDefinition>
    | ConstraintTypeLiteral
    | undefined,
): MetaInformation | undefined;
export function getMetaInformation(
  type:
    | BuiltinBlocktypeDefinition
    | Reference<BuiltinBlocktypeDefinition>
    | ConstraintTypeLiteral
    | undefined,
): BlockMetaInformation | ConstraintMetaInformation | undefined {
  const dereferencedType = isReference(type) ? type.ref : type;
  if (dereferencedType === undefined) {
    return undefined;
  }

  const metaInf = metaInformationRegistry.get(dereferencedType.name);
  if (metaInf === undefined) {
    return undefined;
  }

  if (isBuiltinBlocktypeDefinition(dereferencedType)) {
    assert(metaInf instanceof BlockMetaInformation);
    return metaInf;
  }
  if (isConstraintTypeLiteral(dereferencedType)) {
    assert(metaInf instanceof ConstraintMetaInformation);
    return metaInf;
  }
  assertUnreachable(dereferencedType);
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
  type: BuiltinBlocktypeDefinition | Reference<BuiltinBlocktypeDefinition>,
): BlockMetaInformation;
export function getOrFailMetaInformation(
  type: ConstraintTypeLiteral,
): ConstraintMetaInformation;
export function getOrFailMetaInformation(
  type:
    | BuiltinBlocktypeDefinition
    | Reference<BuiltinBlocktypeDefinition>
    | ConstraintTypeLiteral,
): MetaInformation {
  const result = getMetaInformation(type);
  const typeName =
    (isReference(type) ? type.ref?.name : type.name) ?? '<invalid ref>';
  assert(
    result !== undefined,
    `Meta information for type ${typeName} was expected to be present, got undefined instead`,
  );
  return result;
}
