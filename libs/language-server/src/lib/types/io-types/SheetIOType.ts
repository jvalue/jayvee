import { IOType } from './IOType';

export interface Sheet {
  data: string[][];
  width: number;
  height: number;
}
export const SHEET_TYPE = new IOType<Sheet>();
