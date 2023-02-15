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
        attributeDescription: getValidationLayoutDoc(),
        exampleUsageDescription: getValidationLayoutExampleDoc(),
      },
    });
    this.docs.description =
      'Valdiates a `Sheet` by a given `layout` to build a `Table`. Rows that do not satisfy the layout are removed.';
    this.docs.example = `block CarsValidator oftype LayoutValidator {
  validationLayout: CarsLayout;
}

layout CarsLayout {
  // speficy layout
}`;
  }
}

const getValidationLayoutDoc = () => {
  return `Reference to the layout that is used for validation.`;
};

const getValidationLayoutExampleDoc = () => {
  return `block CarsValidator oftype LayoutValidator {
  validationLayout: CarsLayout;
  // other attributes
}

layout CarsLayout {
  // speficy layout
}`;
};
