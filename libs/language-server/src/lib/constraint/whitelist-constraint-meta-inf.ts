import { validateTypedCollection } from '../ast/collection-util';
import { isCollectionLiteral, isTextLiteral } from '../ast/generated/ast';
import { PropertyValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class WhitelistConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'WhitelistConstraint',
      {
        whitelist: {
          type: PropertyValueType.COLLECTION,
          validation: (property, accept) => {
            const propertyValue = property.value;
            if (!isCollectionLiteral(propertyValue)) {
              return;
            }

            const { invalidItems } = validateTypedCollection(
              propertyValue,
              isTextLiteral,
            );

            invalidItems.forEach((invalidValue) =>
              accept(
                'error',
                'Only text values are allowed in this collection',
                {
                  node: invalidValue,
                },
              ),
            );
          },
        },
      },
      ['text'],
    );
  }
}
