import { IOType } from '@jayvee/language-server';

import { AbstractDataType } from '../data-types/AbstractDataType';

import { IOTypeImplementation } from './io-type-implementation';

export interface Table extends IOTypeImplementation<IOType.TABLE> {
  columnInformation: ColumnInformation[];
  data: string[][];
}

export interface ColumnInformation {
  name: string;
  type: AbstractDataType;
}
