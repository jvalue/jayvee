// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { TextDecoder } from 'util';

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
  evaluatePropertyValueExpression,
} from '@jvalue/jayvee-language-server';

export class TextFileInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextFileInterpreter',
      {
        encoding: {
          type: PrimitiveValuetypes.Text,
          defaultValue: 'utf-8',
          docs: {
            description: 'The encoding used for decoding the file contents.',
          },
          validation: (property, validationContext, evaluationContext) => {
            const propertyValue = property.value;

            const encodingValue = evaluatePropertyValueExpression(
              propertyValue,
              evaluationContext,
              PrimitiveValuetypes.Text,
            );
            if (encodingValue === undefined) {
              return;
            }

            try {
              new TextDecoder(encodingValue);
            } catch (error) {
              validationContext.accept(
                'error',
                `Unknown encoding "${encodingValue}"`,
                {
                  node: propertyValue,
                },
              );
            }
          },
        },
        lineBreak: {
          type: PrimitiveValuetypes.Regex,
          defaultValue: /\r?\n/,
          docs: {
            description: 'The regex for identifying line breaks.',
          },
        },
      },
      // Input type:
      IOType.FILE,

      // Output type:
      IOType.TEXT_FILE,
    );
    this.docs.description = 'Interprets a `File` as a `TextFile`.';
  }
}
