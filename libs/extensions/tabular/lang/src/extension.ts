import {
  BlockMetaInformationClass,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { CellRangeSelectorMetaInformation } from './lib/cell-range-selector-meta-inf';
import { CellWriterMetaInformation } from './lib/cell-writer-meta-inf';
import { ColumnDeleterMetaInformation } from './lib/column-deleter-meta-inf';
import { CSVFileExtractorMetaInformation } from './lib/csv-file-extractor-meta-information';
import { RowDeleterMetaInformation } from './lib/row-deleter-meta-inf';
import { TableInterpreterMetaInformation } from './lib/table-interpreter-meta-inf';

export class TabularLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[] {
    return [
      CSVFileExtractorMetaInformation,
      ColumnDeleterMetaInformation,
      RowDeleterMetaInformation,
      CellRangeSelectorMetaInformation,
      CellWriterMetaInformation,
      TableInterpreterMetaInformation,
    ];
  }
}
