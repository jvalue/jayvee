import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { CSVFileExtractorMetaInformation } from './lib';

export class CsvExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [new CSVFileExtractorMetaInformation()];
  }
}
