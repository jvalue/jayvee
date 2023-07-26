import { BuiltinValuetypesLib } from '../ast/wrappers/value-type/primitive/primitive-valuetypes';

import { StdLib as PartialStdLib } from './generated/stdlib';

export const StdLib = { ...PartialStdLib, ...BuiltinValuetypesLib };
