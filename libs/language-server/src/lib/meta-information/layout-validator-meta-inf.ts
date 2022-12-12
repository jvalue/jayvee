import { SHEET_TYPE, TABLE_TYPE } from '../types/io-types';

import { AttributeType, BlockMetaInformation } from './block-meta-inf';
import { registerBlockMetaInformation } from './meta-inf-util';

export class LayoutValidatorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('LayoutValidator', SHEET_TYPE, TABLE_TYPE, {
      layout: {
        type: AttributeType.LAYOUT,
      },
    });
  }
}

registerBlockMetaInformation(new LayoutValidatorMetaInformation());
