import { PrimitiveValuetypes } from '../ast/wrappers/value-type/primitive/primitive-valuetypes';

import { PartialStdLib } from './generated/partial-stdlib';

export const BuiltinValuetypesLib = {
  'builtin:///stdlib/builtin-valuetypes.jv': Object.values(PrimitiveValuetypes)
    .filter((v) => v.isUserExtendable())
    .map((valueType) => `builtin valuetype ${valueType.getName()};`)
    .join('\n'),
};

export const StdLib = { ...PartialStdLib, ...BuiltinValuetypesLib };
