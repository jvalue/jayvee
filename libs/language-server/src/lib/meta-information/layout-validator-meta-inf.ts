import { LayoutValidator } from '../ast/generated/ast';
import { SHEET_TYPE, Sheet, TABLE_TYPE, Table } from '../types/io-types';

import { BlockMetaInformation } from './block-meta-inf';

export class LayoutValidatorMetaInformation extends BlockMetaInformation<
  LayoutValidator,
  Sheet,
  Table
> {
  constructor(block: LayoutValidator) {
    super(block, SHEET_TYPE, TABLE_TYPE);
  }
}
