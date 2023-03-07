import {
  BlockMetaInformationClass,
  JayveeLangExtension,
} from '@jvalue/language-server';

import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from './lib';

export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[] {
    return [PostgresLoaderMetaInformation, SQLiteLoaderMetaInformation];
  }
}
