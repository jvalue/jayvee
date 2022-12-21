import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';
import { PostgresLoaderMetaInformation, SQLiteLoaderMetaInformation } from './lib';


export class RdbmsLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [
      new PostgresLoaderMetaInformation(),
      new SQLiteLoaderMetaInformation(),
    ];
  }
}
