import { CsvExtension } from '@jayvee/extensions/csv';
import { RdbmsExtension } from '@jayvee/extensions/rdbms';
import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

export class StdExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [
      ...new CsvExtension().getBlockMetaInf(),
      ...new RdbmsExtension().getBlockMetaInf(),
    ];
  }
}
