// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { IOType, type PrimitiveValueType } from '../ast';
import { ValueTypeProvider } from '../ast/wrappers/value-type/primitive/primitive-value-type-provider';

import { PartialStdLib } from './generated/partial-stdlib';

export function getBuiltinValuetypesLib() {
  const primitiveValuetypes = new ValueTypeProvider().Primitives.getAll() // instantiation is okay here as it has no side effects: it is only parsed to string
    .map(parseBuiltinValuetypeToJayvee);

  const collectionValuetype = `${parseAsComment('For internal use only.')}
builtin valuetype Collection<ElementType>;`;

  return {
    'builtin:///stdlib/builtin-value-types.jv': [
      ...primitiveValuetypes,
      collectionValuetype,
    ].join('\n\n'),
  };
}

export const IOtypesLib = {
  'builtin:///stdlib/io-types.jv': Object.values(IOType)
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

function parseBuiltinValuetypeToJayvee(valueType: PrimitiveValueType): string {
  const lines: string[] = [];

  const userDoc = valueType.getUserDoc();
  if (userDoc !== undefined) {
    lines.push(parseAsComment(userDoc));
  }
  if (!valueType.isReferenceableByUser()) {
    lines.push(parseAsComment('For internal use only.'));
  }
  lines.push(`builtin valuetype ${valueType.getName()};`);

  return lines.join('\n');
}

function parseAsComment(text: string, indents = 0): string {
  return text
    .split('\n')
    .map((l) => `// ${l}`)
    .map((l) => '\t'.repeat(indents) + l)
    .join('\n');
}
