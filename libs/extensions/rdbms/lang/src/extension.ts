import {
  BlockMetaInformation,
  ConstructorClass,
  JayveeLangExtension,
} from '@jvalue/language-server';

import {
  PostgresLoaderMetaInformation,
  SQLiteLoaderMetaInformation,
} from './lib';

export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): Array<ConstructorClass<BlockMetaInformation>> {
    return [PostgresLoaderMetaInformation, SQLiteLoaderMetaInformation];
  }
}
