import { IOType } from '@jayvee/language-server';

import { IOTypeImplementation } from './io-type-implementation';

export interface Sheet extends IOTypeImplementation<IOType.SHEET> {
  data: string[][];
  width: number;
  height: number;
}
