// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypes } from '../ast/wrappers/value-type/primitive/primitive-valuetypes';

import { PartialStdLib } from './generated/partial-stdlib';

export const BuiltinValuetypesLib = {
  'builtin:///stdlib/builtin-valuetypes.jv': Object.values(PrimitiveValuetypes)
    .filter((v) => v.isUserExtendable())
    .map(
      (valueType) =>
        `${(valueType.getUserDoc()?.trim().split('\n') ?? [])
          .map((t) => '// ' + t)
          .join('\n')}
builtin valuetype ${valueType.getName()};`,
    )
    .join('\n\n'),
};

export const StdLib = { ...PartialStdLib, ...BuiltinValuetypesLib };
