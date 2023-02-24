import { IOType } from '@jayvee/language-server';

export interface IOTypeImplementation<T extends IOType = IOType> {
  ioType: T;
}
