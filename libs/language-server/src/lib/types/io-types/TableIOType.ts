import { AbstractDataType } from '../data-types/AbstractDataType';

import { IOType } from './IOType';

export interface Table {
  columnNames: string[];
  columnTypes: Array<AbstractDataType | undefined>;
  data: string[][];
}
export const TABLE_TYPE = new IOType<Table>();
