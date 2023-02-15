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
          examples: [
            {
              code: docExample,
              description:
                'Use the name of the defined `layout` to reference it.',
            },
          ],
        },
      },
    });
    this.docs.description =
      'Valdiates a `Sheet` by a given `layout` to build a `Table`. Rows that do not satisfy the layout are removed.';
    this.docs.examples = [
      {
        code: docExample,
        description:
          'The `CarsValidator` block applies the `CarsLayout` to incoming sheet data. The outgoing table will only have rows conforming to the `CarsLayout`.',
      },
    ];
  }
}

const docExample = `block CarsValidator oftype LayoutValidator {
  validationLayout: CarsLayout;
}

layout CarsLayout {
  // speficy layout
}`;
