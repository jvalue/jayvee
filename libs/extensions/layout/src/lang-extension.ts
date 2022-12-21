import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { LayoutValidatorMetaInformation } from './lib';

export class LayoutLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [new LayoutValidatorMetaInformation()];
  }
}
