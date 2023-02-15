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
  }
}

const getValidationLayoutDoc = () => {
  return `Reference to the layout that is used for validation. Rows that do not satisfy the layout are removed.`;
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
