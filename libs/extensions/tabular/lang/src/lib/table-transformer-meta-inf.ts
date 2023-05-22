// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  IOType,
  PrimitiveValuetypes,
} from '@jvalue/jayvee-language-server';

export class TableTransformerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TableTransformer',
      {
        inputColumn: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description:
              "The name of the input column. Has to be present in the table and match with the transform's input port type.",
          },
        },
        outputColumn: {
          type: PrimitiveValuetypes.Text,
          docs: {
            description:
              'The name of the output column. Overwrites the column if it already exists, or otherwise creates a new one.',
          },
        },
        use: {
          type: PrimitiveValuetypes.Transform,
          docs: {
            description:
              'Reference to the transform that is applied to the column.',
          },
        },
      },
      IOType.TABLE,
      IOType.TABLE,
    );
    this.docs = {
      description:
        'Applies a transform on each value of a column. The input port type of the used transform has to match the type of the input column.',
      examples: [
        {
          description:
            'Given a column "temperature" with temperature values in Celsius, it overwrites the column with computed values in Fahrenheit by using the `CelsiusToFahrenheit` transform. The transform itself is defined elsewhere in the model.',
          code: blockExampleOverwrite,
        },
        {
          description:
            'Given a column "temperatureCelsius" with temperature values in Celsius, it adds a new column "temperatureFahrenheit" with computed values in Fahrenheit by using the `CelsiusToFahrenheit` transform. The transform itself is defined elsewhere in the model.',
          code: blockExampleNewCol,
        },
      ],
    };
  }
}

const blockExampleOverwrite = `block CelsiusToFahrenheitTransformer oftype TableTransformer {
  inputColumn: 'temperature';
  outputColumn: 'temperature';
  use: CelsiusToFahrenheit;
}`;

const blockExampleNewCol = `block CelsiusToFahrenheitTransformer oftype TableTransformer {
  inputColumn: 'temperatureCelsius';
  outputColumn: 'temperatureFahrenheit';
  use: CelsiusToFahrenheit;
}`;
