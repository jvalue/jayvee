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
${praseBuiltinBlocktypeBody(metaInf)}
}`;
  // TODO: add comments to the created blocktype definition
}

function praseBuiltinBlocktypeBody(metaInf: BlockMetaInformation): string {
  const bodyLines: string[] = [];

  if (metaInf.inputType !== IOType.NONE) {
    bodyLines.push(`\tinput default oftype ${metaInf.inputType};`);
  }
  if (metaInf.outputType !== IOType.NONE) {
    bodyLines.push(`\toutput default oftype ${metaInf.outputType};`);
  }
  bodyLines.push('\t');

  Object.entries(metaInf.getPropertySpecifications()).forEach(
    ([propName, propSpecification]) => {
      bodyLines.push(
        `\tproperty ${propName} oftype ${propSpecification.type.getName()};`,
      );
    },
  );

  return bodyLines.join('\n');
}
