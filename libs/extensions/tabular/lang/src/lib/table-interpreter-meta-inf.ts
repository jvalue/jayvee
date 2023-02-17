import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  TABLE_TYPE,
  getNodesWithNonUniqueNames,
  isCollection,
  isDataTypeAssignmentValue,
} from '@jayvee/language-server';

export class TableInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('TableInterpreter', SHEET_TYPE, TABLE_TYPE, {
      header: {
        type: AttributeType.BOOLEAN,
        docs: {
          description:
            'Whether the first row should be interpreted as header row.',
          examples: [
            {
              code: 'header: true',
              description: 'The first row is interpreted as table header.',
            },
            {
              code: 'header: false',
              description:
                'The first row is NOT interpreted as table header and columns of the sheet are directly mapped to table columns. The column names are taken form the provided names in the `columns` attribute.',
            },
          ],
        },
      },
      columns: {
        type: AttributeType.COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCollection(attributeValue)) {
            return;
          }

          attributeValue.values
            .filter((value) => !isDataTypeAssignmentValue(value))
            .forEach((forbiddenValue) => {
              accept(
                'error',
                'Only data type assignments are allowed in this collection',
                {
                  node: forbiddenValue,
                },
              );
            });

          const dataTypeAssignments = attributeValue.values
            .filter(isDataTypeAssignmentValue)
            .map((assignment) => assignment.value);
          getNodesWithNonUniqueNames(dataTypeAssignments).forEach(
            (dataTypeAssignment) => {
              accept(
                'error',
                `The column name "${dataTypeAssignment.name}" needs to be unique.`,
                {
                  node: dataTypeAssignment,
                  property: 'name',
                },
              );
            },
          );
        },
        docs: {
          description:
            'Collection of data type assignments. Uses column names (potentially matched with the header or by sequence depending on the `header` attribute) to assign a data type to each column.',
          examples: [
            {
              code: 'columns: [ "name" typed text ]',
              description:
                'There is one column with the header "name". All values in this colum are typed as text.',
            },
          ],
          validation:
            'Needs to be a collection of data type assignments. Each column needs to have a unique name.',
        },
      },
    });
    this.docs.description =
      'Interprets a `Sheet` as a `Table`. In case a header row is present in the sheet, its names can be matched with the provided column names. Otherwise, the provided column names are assigned sequentially.';
    this.docs.examples = [
      {
        code: blockExampleWithHeader,
        description:
          'Interprets a `Sheet` about cars with a topmost header row and interprets it as a `Table` by assigning a data type to each column. Matches the column names from the header row with the column names of the provided data type assignments.',
      },
      {
        code: blockExampleWithoutHeader,
        description:
          'Interprets a `Sheet` about cars without a topmost header row and interprets it as a `Table` by sequentially assigning a name and a data type to each column of the sheet. Note that the order of columns matters here, as the first entry maps to the first column `A`, the second to `B` and so on.',
      },
    ];
  }
}

const blockExampleWithHeader = `block CarsTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "name" typed text,
    "mpg" typed decimal,
    "cyl" typed integer,
  ];
}`;

const blockExampleWithoutHeader = `block CarsTableInterpreter oftype TableInterpreter {
  header: false;
  columns: [
    "name" typed text,
    "mpg" typed decimal,
    "cyl" typed integer,
  ];
}`;
