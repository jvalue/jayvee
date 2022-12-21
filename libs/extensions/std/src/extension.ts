import {
  BlockExecutor,
  BlockExecutorType,
  JayveeInterpreterExtension,
} from '@jayvee/execution';
import { CsvExtension } from '@jayvee/extensions/csv';
import { RdbmsExtension } from '@jayvee/extensions/rdbms';
import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

export class StdExtension
  implements JayveeLangExtension, JayveeInterpreterExtension
{
  private readonly wrappedExtensions: Array<
    JayveeLangExtension & JayveeInterpreterExtension
  > = [new CsvExtension(), new RdbmsExtension()];

  getBlockExecutors(): Array<
    BlockExecutorType<BlockExecutor<unknown, unknown>>
  > {
    return this.wrappedExtensions.map((x) => x.getBlockExecutors()).flat();
  }

  getBlockMetaInf(): BlockMetaInformation[] {
    return this.wrappedExtensions.map((x) => x.getBlockMetaInf()).flat();
  }
}
