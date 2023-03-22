import { IOType } from '@jvalue/language-server';

import { File } from './file';
import { IOTypeImplementation } from './io-type-implementation';

export class TextFile
  extends File<string[]>
  implements IOTypeImplementation<IOType.TEXT_FILE>
{
  public readonly ioType = IOType.TEXT_FILE;
}
