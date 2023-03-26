// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';
import { TextDecoder } from 'util';

import {
  BlockMetaInformation,
  IOType,
  PropertyValuetype,
  isTextLiteral,
} from '@jvalue/language-server';

export class TextFileInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextFileInterpreter',
      {
        encoding: {
          type: PropertyValuetype.TEXT,
          defaultValue: 'utf-8',
          docs: {
            description: 'The encoding used for decoding the file contents.',
          },
          validation: (property, accept) => {
            const propertyValue = property.value;
            assert(isTextLiteral(propertyValue));

            try {
              new TextDecoder(propertyValue.value);
            } catch (error) {
              accept('error', `Unknown encoding "${propertyValue.value}"`, {
                node: propertyValue,
              });
            }
          },
        },
        lineBreak: {
          type: PropertyValuetype.REGEX,
          defaultValue: '\r?\n',
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
