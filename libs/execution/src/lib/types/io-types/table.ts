import { IOType } from '@jayvee/language-server';

import { AbstractValueType } from '../value-types/abstract-value-type';

import { IOTypeImplementation } from './io-type-implementation';

export interface Table extends IOTypeImplementation<IOType.TABLE> {
  columnInformation: ColumnInformation[];
  data: string[][];
}

export interface ColumnInformation {
  name: string;
  type: AbstractValueType;
}
