import { CsvLangExtension } from '@jayvee/extensions/csv';
import { RdbmsLangExtension } from '@jayvee/extensions/rdbms';
import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

export class StdLangExtension implements JayveeLangExtension {
  private readonly wrappedExtensions: JayveeLangExtension[] = [
    new CsvLangExtension(),
    new RdbmsLangExtension(),
  ];

  getBlockMetaInf(): BlockMetaInformation[] {
    return this.wrappedExtensions.map((x) => x.getBlockMetaInf()).flat();
  }
}
