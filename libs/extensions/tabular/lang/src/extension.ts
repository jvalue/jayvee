import {
  BlockMetaInformationClass,
  JayveeLangExtension,
} from '@jayvee/language-server';

import { CellRangeSelectorMetaInformation } from './lib/cell-range-selector-meta-inf';
import { CellWriterMetaInformation } from './lib/cell-writer-meta-inf';
import { ColumnDeleterMetaInformation } from './lib/column-deleter-meta-inf';
import { CSVInterpreterMetaInformation } from './lib/csv-interpreter-meta-inf';
import { RowDeleterMetaInformation } from './lib/row-deleter-meta-inf';
import { TableInterpreterMetaInformation } from './lib/table-interpreter-meta-inf';

export class TabularLangExtension implements JayveeLangExtension {
  getBlockMetaInf(): BlockMetaInformationClass[] {
    return [
      ColumnDeleterMetaInformation,
      RowDeleterMetaInformation,
      CellRangeSelectorMetaInformation,
      CellWriterMetaInformation,
      TableInterpreterMetaInformation,
      CSVInterpreterMetaInformation,
    ];
  }
}
