// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { validateTypedCollection } from '../ast/collection-util';
import { isCollectionLiteral } from '../ast/generated/ast';
import { PropertyValuetype } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class DenylistConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'DenylistConstraint',
      {
        denylist: {
          type: PropertyValuetype.COLLECTION,
          validation: (property, accept) => {
            const propertyValue = property.value;
            if (!isCollectionLiteral(propertyValue)) {
              return;
            }

            const { invalidItems } = validateTypedCollection(
              propertyValue,
              PropertyValuetype.TEXT,
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
    super.docs = {
      description:
        'Defines a set of forbidden values. All values in the list are considered invalid.',
      examples: [
        {
          code: `constraint NoPrimaryColors oftype DenylistConstraint {
  denylist: ["red", "blue", "yellow"];
}`,
          description: 'Denies all primary colors.',
        },
      ],
    };
  }
}
