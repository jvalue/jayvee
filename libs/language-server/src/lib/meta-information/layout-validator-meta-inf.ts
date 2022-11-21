import { LayoutValidator } from '../generated/ast';
import { Sheet, Table, sheetType, tableType } from '../types';

import { BlockMetaInformation } from './block-meta-inf';

export class LayoutValidatorMetaInformation extends BlockMetaInformation<
  LayoutValidator,
  Sheet,
  Table
> {
  constructor(block: LayoutValidator) {
    super(block, sheetType, tableType);
  }
}
