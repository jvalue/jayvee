import {
  BlockMetaInformationType,
  JayveeLangExtension,
} from '@jayvee/language-server';

import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from './lib';

export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationType[] {
    return [PostgresLoaderMetaInformation, SQLiteLoaderMetaInformation];
  }
}
