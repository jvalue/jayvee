import { AbstractDataType } from '../data-types/AbstractDataType';

import { IOType } from './io-type';

export interface ColumnInformation {
  name: string;
  type: AbstractDataType;
}

export interface Table {
  columnInformation: ColumnInformation[];
  data: string[][];
}
export const TABLE_TYPE = new IOType<Table>();
