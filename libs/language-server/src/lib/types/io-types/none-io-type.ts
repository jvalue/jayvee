import { IOType } from './io-type';

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface None {}
export const NONE_TYPE = new IOType<None>();
export const NONE: None = {};
