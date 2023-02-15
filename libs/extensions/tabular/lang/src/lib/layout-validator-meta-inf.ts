import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  TABLE_TYPE,
} from '@jayvee/language-server';

export class LayoutValidatorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('LayoutValidator', SHEET_TYPE, TABLE_TYPE, {
      validationLayout: {
        type: AttributeType.LAYOUT,
        docs: {
          description: `Reference to the layout that is used for validation.`,
          example: docExample,
        },
      },
    });
    this.docs.description =
      'Valdiates a `Sheet` by a given `layout` to build a `Table`. Rows that do not satisfy the layout are removed.';
    this.docs.example = docExample;
  }
}

const docExample = `block CarsValidator oftype LayoutValidator {
  validationLayout: CarsLayout;
}

layout CarsLayout {
  // speficy layout
}`;
