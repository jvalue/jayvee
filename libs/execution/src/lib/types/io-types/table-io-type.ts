import { AbstractDataType } from '../data-types/AbstractDataType';

export interface ColumnInformation {
  name: string;
  type: AbstractDataType;
}

export interface Table {
  columnInformation: ColumnInformation[];
  data: string[][];
}
