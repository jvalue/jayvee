// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import { Reference, isReference } from 'langium';

import { BuiltinConstrainttypeDefinition } from '../ast/generated/ast';
import { ConstructorClass } from '../util/constructor-class';
import { Registry } from '../util/registry';

// eslint-disable-next-line import/no-cycle
import { ConstraintMetaInformation } from './constraint-meta-inf';

export const constraintMetaInfRegistry =
  new Registry<ConstraintMetaInformation>();

export function registerConstraintMetaInf(
  metaInfClass: ConstructorClass<ConstraintMetaInformation>,
) {
  const metaInf = new metaInfClass();
  constraintMetaInfRegistry.register(metaInf.type, metaInf);
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

export function getRegisteredConstraintMetaInformation(): ConstraintMetaInformation[] {
  return constraintMetaInfRegistry.getAll();
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
