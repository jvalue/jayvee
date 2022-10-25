// eslint-disable-next-line @typescript-eslint/no-unused-vars
export class DataType<T = unknown> {}

export const undefinedType = new DataType<undefined>();

export type Sheet = string[][];
export const sheetType = new DataType<Sheet>();

export interface Table {
  columnNames: string[];
  data: string[][];
}
export const tableType = new DataType<Table>();
