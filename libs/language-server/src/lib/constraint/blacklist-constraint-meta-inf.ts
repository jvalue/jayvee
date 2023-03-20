import { validateTypedCollection } from '../ast/collection-util';
import { isCollection, isTextValue } from '../ast/generated/ast';
import { AttributeValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class BlacklistConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'BlacklistConstraint',
      {
        blacklist: {
          type: AttributeValueType.COLLECTION,
          validation: (attribute, accept) => {
            const attributeValue = attribute.value;
            if (!isCollection(attributeValue)) {
              return;
            }

            const { invalidItems } = validateTypedCollection(
              attributeValue,
              isTextValue,
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
