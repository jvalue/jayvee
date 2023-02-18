import {
  BlockMetaInformationClass,
  JayveeLangExtension,
} from '@jayvee/language-server';

import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from './lib';

export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[] {
    return [PostgresLoaderMetaInformation, SQLiteLoaderMetaInformation];
  }
}
