// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  BlockMetaInformation,
  CollectionValuetype,
  IOType,
  PrimitiveValuetypes,
  checkUniqueNames,
  evaluatePropertyValue,
} from '@jvalue/jayvee-language-server';

export class TableInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TableInterpreter',
      {
        header: {
          type: PrimitiveValuetypes.Boolean,
          docs: {
            description:
              'Whether the first row should be interpreted as header row.',
            examples: [
              {
                code: 'header: true',
                description:
                  'The first row is interpreted as table header. The values in the header row will become the column names of the table.',
              },
              {
                code: 'header: false',
                description:
                  'The first row is NOT interpreted as table header and columns of the sheet are directly mapped to table columns. The column names are taken form the provided names in the `columns` property.',
              },
            ],
          },
        },
        columns: {
          type: new CollectionValuetype(
            PrimitiveValuetypes.ValuetypeAssignment,
          ),
          validation: (property, validationContext, evaluationContext) => {
            const valuetypeAssignments = evaluatePropertyValue(
              property,
              evaluationContext,
              new CollectionValuetype(PrimitiveValuetypes.ValuetypeAssignment),
            );
            if (valuetypeAssignments === undefined) {
              return;
            }

            checkUniqueNames(valuetypeAssignments, validationContext, 'column');
          },
          docs: {
            description:
              'Collection of valuetype assignments. Uses column names (potentially matched with the header or by sequence depending on the `header` property) to assign a primitive valuetype to each column.',
            examples: [
              {
                code: 'columns: [ "name" oftype text ]',
                description:
                  'There is one column with the header "name". All values in this colum are typed as text.',
              },
            ],
            validation:
              'Needs to be a collection of valuetype assignments. Each column needs to have a unique name.',
          },
        },
      },
      IOType.SHEET,
      IOType.TABLE,
    );
    this.docs.description =
      'Interprets a `Sheet` as a `Table`. In case a header row is present in the sheet, its names can be matched with the provided column names. Otherwise, the provided column names are assigned in order.';
    this.docs.examples = [
      {
        code: blockExampleWithHeader,
        description:
          'Interprets a `Sheet` about cars with a topmost header row and interprets it as a `Table` by assigning a primitive valuetype to each column. The column names are matched to the header, so the order of the type assignments does not matter.',
      },
      {
        code: blockExampleWithoutHeader,
        description:
          'Interprets a `Sheet` about cars without a topmost header row and interprets it as a `Table` by sequentially assigning a name and a primitive valuetype to each column of the sheet. Note that the order of columns matters here. The first column (column `A`) will be named "name", the second column (column `B`) will be named "mpg" etc.',
      },
    ];
  }
}

const blockExampleWithHeader = `block CarsTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "name" oftype text,
    "mpg" oftype decimal,
    "cyl" oftype integer,
  ];
}`;

const blockExampleWithoutHeader = `block CarsTableInterpreter oftype TableInterpreter {
  header: false;
  columns: [
    "name" oftype text,
    "mpg" oftype decimal,
    "cyl" oftype integer,
  ];
}`;
