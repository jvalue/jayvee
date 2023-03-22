import { IOType } from '@jvalue/language-server';

import { File } from './file';
import { IOTypeImplementation } from './io-type-implementation';

export class BinaryFile
  extends File<ArrayBuffer>
  implements IOTypeImplementation<IOType.FILE>
{
  public readonly ioType = IOType.FILE;
}
