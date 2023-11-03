// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { Reference, assertUnreachable, isReference } from 'langium';

import {
  BuiltinConstrainttypeDefinition,
  ReferenceableBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isReferenceableBlocktypeDefinition,
} from '../../generated/ast';
// eslint-disable-next-line import/no-cycle
import { BlockTypeWrapper } from '../typed-object/blocktype-wrapper';
import { ConstraintWrapper } from '../typed-object/constrainttype-wrapper';

export * from './column-id-util';

/**
 * Creates a MetaInformation wrapper object based on the given type reference.
 */
export function getMetaInformation(
  typeRef:
    | Reference<ReferenceableBlocktypeDefinition>
    | Reference<BuiltinConstrainttypeDefinition>
    | BuiltinConstrainttypeDefinition
    | ReferenceableBlocktypeDefinition
    | undefined,
): BlockTypeWrapper | ConstraintWrapper | undefined {
  const type = isReference(typeRef) ? typeRef.ref : typeRef;
  if (type === undefined) {
    return undefined;
  }

  if (isReferenceableBlocktypeDefinition(type)) {
    if (!BlockTypeWrapper.canBeWrapped(type)) {
      return undefined;
    }
    return new BlockTypeWrapper(type);
  } else if (isBuiltinConstrainttypeDefinition(type)) {
    if (!ConstraintWrapper.canBeWrapped(type)) {
      return undefined;
    }
    return new ConstraintWrapper(type);
  }
  assertUnreachable(type);
}
