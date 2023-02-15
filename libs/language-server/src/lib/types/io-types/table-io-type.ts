import { AbstractDataType } from '../data-types/AbstractDataType';

import { IOType } from './io-type';

export interface ColumnMeta {
  columnName: string;
  columnType: AbstractDataType;
}

export interface Table {
  columnMetas: ColumnMeta[];
  data: string[][];
}
export const TABLE_TYPE = new IOType<Table>();
