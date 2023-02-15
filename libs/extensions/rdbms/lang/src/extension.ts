import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from './lib';
import { TableInterpreterMetaInformation } from './lib/table-interpreter-meta-inf';

export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [
      new PostgresLoaderMetaInformation(),
      new SQLiteLoaderMetaInformation(),
      new TableInterpreterMetaInformation(),
    ];
  }
}
