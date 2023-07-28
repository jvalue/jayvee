// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType } from '../ast';
import { PrimitiveValuetypes } from '../ast/wrappers/value-type/primitive/primitive-valuetypes';
import {
  BlockMetaInformation,
  metaInformationRegistry,
} from '../meta-information';

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

// Is a method since metaInformationRegistry might not be initialized when this as variable.
export function getBulitinBlocktypesLib() {
  return {
    'builtin:///stdlib/builtin-blocktypes.jv': metaInformationRegistry
      .getAllEntries()
      .reduce(
        (filtered: { key: string; value: BlockMetaInformation }[], entry) => {
          if (entry.value instanceof BlockMetaInformation) {
            filtered.push({ key: entry.key, value: entry.value });
          }
          return filtered;
        },
        [],
      )
      .map((entry) => parseMetaInfToJayvee(entry.key, entry.value))
      .join('\n\n'),
  };
}

export function getStdLib() {
  return {
    ...PartialStdLib,
    ...BuiltinValuetypesLib,
    ...getBulitinBlocktypesLib(),
  };
}

function parseMetaInfToJayvee(
  name: string,
  metaInf: BlockMetaInformation,
): string {
  return `builtin blocktype ${name} {
  ${
    metaInf.inputType !== IOType.NONE
      ? `input default oftype ${metaInf.inputType};`
      : ''
  };
  ${
    metaInf.outputType !== IOType.NONE
      ? `output default oftype ${metaInf.outputType};`
      : ''
  };
  
  ${Object.entries(metaInf.getPropertySpecifications())
    .map(([propName, propSpecification]) => {
      return `property ${propName} oftype ${propSpecification.type.getName()};`;
    })
    .join('\n')}
}`;
  // TODO: add comments to the created blocktype definition
}
