// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';
import { assertUnreachable } from 'langium/lib/utils/errors';

import {
  BuiltinConstrainttypeDefinition,
  ReferenceableBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isCompositeBlocktypeDefinition,
  isReferenceableBlocktypeDefinition,
} from '../ast/generated/ast';
import { ConstructorClass } from '../util/constructor-class';
import { Registry } from '../util/registry';

// eslint-disable-next-line import/no-cycle
import { BlockMetaInformation } from './block-meta-inf';
import { CompositeBlocktypeMetaInformation } from './composite-blocktype-meta-inf';
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
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>
    | undefined,
): BlockMetaInformation | undefined;
export function getMetaInformation(
  type:
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>
    | undefined,
): ConstraintMetaInformation | undefined;
export function getMetaInformation(
  type:
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>
    | undefined,
): MetaInformation | undefined;
export function getMetaInformation(
  type:
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>
    | undefined,
): BlockMetaInformation | ConstraintMetaInformation | undefined {
  const dereferencedType = isReference(type) ? type.ref : type;
  if (dereferencedType === undefined) {
    return undefined;
  }

  // Register meta information about composite blocks from jv code
  if (
    isCompositeBlocktypeDefinition(dereferencedType) &&
    !metaInformationRegistry.get(dereferencedType.name)
  ) {
    metaInformationRegistry.register(
      dereferencedType.name,
      new CompositeBlocktypeMetaInformation(dereferencedType),
    );
  }

  const metaInf = metaInformationRegistry.get(dereferencedType.name);
  if (metaInf === undefined) {
    return undefined;
  }

  if (isReferenceableBlocktypeDefinition(dereferencedType)) {
    assert(metaInf instanceof BlockMetaInformation);
    return metaInf;
  }
  if (isBuiltinConstrainttypeDefinition(dereferencedType)) {
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
  type:
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>,
): BlockMetaInformation;
export function getOrFailMetaInformation(
  type:
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>,
): ConstraintMetaInformation;
export function getOrFailMetaInformation(
  type:
    | ReferenceableBlocktypeDefinition
    | Reference<ReferenceableBlocktypeDefinition>
    | BuiltinConstrainttypeDefinition
    | Reference<BuiltinConstrainttypeDefinition>,
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
