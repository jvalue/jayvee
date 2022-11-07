import { AbstractDataType } from './AbstractDataType';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class DataType<T = unknown> {}

export const undefinedType = new DataType<undefined>();

export interface Sheet {
  data: string[][];
  width: number;
  height: number;
}

export const sheetType = new DataType<Sheet>();

export interface Table {
  columnNames: string[];
  columnTypes: Array<AbstractDataType | undefined>;
  data: string[][];
}
export const tableType = new DataType<Table>();
