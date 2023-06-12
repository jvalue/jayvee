// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValue,
} from '@jvalue/jayvee-language-server';

export class TextLineDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextLineDeleter',
      {
        lines: {
          type: new CollectionValuetype(PrimitiveValuetypes.Integer),
          validation: (property, validationContext, evaluationContext) => {
            const lines = evaluatePropertyValue(
              property,
              evaluationContext,
              new CollectionValuetype(PrimitiveValuetypes.Integer),
            );
            lines?.forEach((value, index) => {
              if (value <= 0) {
                validationContext.accept(
                  'error',
                  `Line numbers need to be greater than zero`,
                  {
                    node: property.value,
                    property: 'values',
                    index: index,
                  },
                );
              }
            });
          },
          docs: {
            description: 'The line numbers to delete.',
          },
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.TEXT_FILE,
    );
    this.docs.description = 'Deletes individual lines from a `TextFile`.';
  }
}
