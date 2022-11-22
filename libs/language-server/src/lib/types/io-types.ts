import { AbstractDataType } from './data-types';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class IOType<T = unknown> {}

export const UNDEFINED_TYPE = new IOType<undefined>();

export interface Sheet {
  data: string[][];
  width: number;
  height: number;
}

export const SHEET_TYPE = new IOType<Sheet>();

export interface Table {
  columnNames: string[];
  columnTypes: Array<AbstractDataType | undefined>;
  data: string[][];
}
export const TABLE_TYPE = new IOType<Table>();
