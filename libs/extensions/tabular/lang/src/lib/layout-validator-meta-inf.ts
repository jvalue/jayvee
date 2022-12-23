import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  TABLE_TYPE,
  registerBlockMetaInformation,
} from '@jayvee/language-server';

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
