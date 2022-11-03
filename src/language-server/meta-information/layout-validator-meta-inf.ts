import {
  Sheet,
  Table,
  sheetType,
  tableType,
} from '../../interpreter/data-types';
import { LayoutValidator } from '../generated/ast';

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
