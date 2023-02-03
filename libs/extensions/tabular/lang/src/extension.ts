import {
  BlockMetaInformation,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { CellRangeSelectorMetaInformation } from './lib/cell-range-selector-meta-inf';
import { CellWriterMetaInformation } from './lib/cell-writer-meta-inf';
import { ColumnDeleterMetaInformation } from './lib/column-deleter-meta-inf';
import { CSVFileExtractorMetaInformation } from './lib/csv-file-extractor-meta-information';
import { LayoutValidatorMetaInformation } from './lib/layout-validator-meta-inf';
import { RowDeleterMetaInformation } from './lib/row-deleter-meta-inf';

export class TabularLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformation[] {
    return [
      new CSVFileExtractorMetaInformation(),
      new LayoutValidatorMetaInformation(),
      new ColumnDeleterMetaInformation(),
      new RowDeleterMetaInformation(),
      new CellRangeSelectorMetaInformation(),
      new CellWriterMetaInformation(),
    ];
  }
}
