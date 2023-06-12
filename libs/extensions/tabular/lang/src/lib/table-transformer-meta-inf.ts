// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  EvaluationContext,
  IOType,
  PrimitiveValuetypes,
  PropertyAssignment,
  PropertyBody,
  ValidationContext,
  evaluatePropertyValue,
  isCollectionLiteral,
  isTextValuetype,
} from '@jvalue/jayvee-language-server';

export class TableTransformerMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TableTransformer',
      {
        inputColumns: {
          type: new CollectionValuetype(PrimitiveValuetypes.Text),
          docs: {
            description:
              "The names of the input columns. The columns have to be present in the table and match with the transform's input port types.",
          },
          validation: (property, context) => {
            this.checkInputColumnsType(property, context);
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
      (property, validationContext, evaluationContext) => {
        this.checkInputColumnsMatchTransformationPorts(
          property,
          validationContext,
          evaluationContext,
        );
      },
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

  private checkInputColumnsMatchTransformationPorts(
    body: PropertyBody,
    validationContext: ValidationContext,
    evaluationContext: EvaluationContext,
  ): void {
    const useProperty = body.properties.find((x) => x.name === 'use');
    const inputColumnsProperty = body.properties.find(
      (x) => x.name === 'inputColumns',
    );

    if (useProperty === undefined || inputColumnsProperty === undefined) {
      return;
    }

    const transform = evaluatePropertyValue(
      useProperty,
      evaluationContext,
      PrimitiveValuetypes.Transform,
    );
    const inputColumns = evaluatePropertyValue(
      inputColumnsProperty,
      evaluationContext,
      new CollectionValuetype(PrimitiveValuetypes.Text),
    );

    if (transform === undefined || inputColumns === undefined) {
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const transformInputPorts = transform?.body?.ports?.filter(
      (x) => x.kind === 'from',
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (transformInputPorts === undefined) {
      return;
    }

    const numberTransformPorts = transformInputPorts.length;
    const numberInputColumns = inputColumns.length;

    if (numberTransformPorts !== numberInputColumns) {
      validationContext.accept(
        'error',
        `Expected ${numberTransformPorts} columns but only got ${numberInputColumns}`,
        {
          node: inputColumnsProperty,
        },
      );
    }
  }

  private checkInputColumnsType(
    property: PropertyAssignment,
    context: ValidationContext,
  ) {
    const propertyValue = property.value;
    if (!isCollectionLiteral(propertyValue)) {
      return;
    }

    propertyValue.values
      .filter((x) => !isTextValuetype(x))
      .forEach((invalidValue) =>
        context.accept(
          'error',
          'Only column names are allowed in this collection',
          {
            node: invalidValue,
          },
        ),
      );
  }
}

const blockExampleOverwrite = `block CelsiusToFahrenheitTransformer oftype TableTransformer {
  inputColumn: ['temperature'];
  outputColumn: 'temperature';
  use: CelsiusToFahrenheit;
}`;

const blockExampleNewCol = `block CelsiusToFahrenheitTransformer oftype TableTransformer {
  inputColumn: ['temperatureCelsius'];
  outputColumn: 'temperatureFahrenheit';
  use: CelsiusToFahrenheit;
}`;
