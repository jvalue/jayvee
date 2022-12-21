import { CsvLangExtension } from '@jayvee/extensions/csv';
import { LayoutLangExtension } from '@jayvee/extensions/layout';
import { RdbmsLangExtension } from '@jayvee/extensions/rdbms/lang';
import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

export class StdLangExtension implements JayveeLangExtension {
  private readonly wrappedExtensions: JayveeLangExtension[] = [
    new CsvLangExtension(),
    new RdbmsLangExtension(),
    new LayoutLangExtension(),
  ];

  getBlockMetaInf(): BlockMetaInformation[] {
    return this.wrappedExtensions.map((x) => x.getBlockMetaInf()).flat();
  }
}
