import { RdbmsLangExtension } from '@jayvee/extensions/rdbms/lang';
import { TabularLangExtension } from '@jayvee/extensions/tabular/lang';
import {
  BlockMetaInformationClass,
  JayveeLangExtension,
} from '@jayvee/language-server';

export class StdLangExtension implements JayveeLangExtension {
  private readonly wrappedExtensions: JayveeLangExtension[] = [
    new TabularLangExtension(),
    new RdbmsLangExtension(),
  ];

  getBlockMetaInf(): BlockMetaInformationClass[] {
    return this.wrappedExtensions.map((x) => x.getBlockMetaInf()).flat();
  }
}
