import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { CSVFileExtractorMetaInformation } from './lib/csv-file-extractor-meta-information';
import { LayoutValidatorMetaInformation } from './lib/layout-validator-meta-inf';

export class TabularLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [
      new CSVFileExtractorMetaInformation(),
      new LayoutValidatorMetaInformation(),
    ];
  }
}
