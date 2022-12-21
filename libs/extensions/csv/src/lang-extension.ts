import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { CSVFileExtractorMetaInformation } from './lib';

export class CsvLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [new CSVFileExtractorMetaInformation()];
  }
}
