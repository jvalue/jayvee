// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType, PrimitiveValuetype } from '../ast';
import { PrimitiveValuetypes } from '../ast/wrappers/value-type/primitive/primitive-valuetypes';

import { PartialStdLib } from './generated/partial-stdlib';

export function getBuiltinValuetypesLib() {
  const primitiveValuetypes = Object.values(PrimitiveValuetypes).map(
    parseBuiltinValuetypeToJayvee,
  );

  const collectionValuetype = `${parseAsComment('For internal use only.')}
builtin valuetype Collection<ElementType>;`;

  return {
    'builtin:///stdlib/builtin-valuetypes.jv': [
      ...primitiveValuetypes,
      collectionValuetype,
    ].join('\n\n'),
  };
}

export const IOtypesLib = {
  'builtin:///stdlib/iotypes.jv': Object.values(IOType)
    .map((iotype) => `builtin iotype ${iotype};`)
    .join('\n\n'),
};

export function getStdLib() {
  return {
    ...PartialStdLib,
    ...getBuiltinValuetypesLib(),
    ...IOtypesLib,
  };
}

function parseBuiltinValuetypeToJayvee(valuetype: PrimitiveValuetype): string {
  const lines: string[] = [];

  const userDoc = valuetype.getUserDoc();
  if (userDoc !== undefined) {
    lines.push(parseAsComment(userDoc));
  }
  if (!valuetype.isReferenceableByUser()) {
    lines.push(parseAsComment('For internal use only.'));
  }
  lines.push(`builtin valuetype ${valuetype.getName()};`);

  return lines.join('\n');
}

function parseAsComment(text: string, indents = 0): string {
  return text
    .split('\n')
    .map((l) => `// ${l}`)
    .map((l) => '\t'.repeat(indents) + l)
    .join('\n');
}
