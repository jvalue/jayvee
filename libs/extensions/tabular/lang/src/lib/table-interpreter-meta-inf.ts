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
              code: 'columns: [ "name" typed text ]',
              description:
                'There is one column with the header "name". All values in this colum are typed as text.',
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
            'Collection of data type assignments. Uses column names (potentially matched with the header) to assign a data type to each column.',
          examples: [
            {
              code: 'header: true',
              description: 'The first row is interpreted as table header.',
            },
          ],
          validation:
            'Needs to be a collection of data type assignments. Each column needs to have a unique name.',
        },
      },
    });
    this.docs.description = 'Interprets a `Sheet` as a `Table`.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Interprets a `Sheet` about cars with a topmost header row and interprets it as a `Table` by assigning a data type to each column. Matches the column names from the header row with the column names of the data type assignments.',
      },
    ];
  }
}

const blockExample = `block CarsTableInterpreter oftype TableInterpreter {
  header: true;
  columns: [
    "name" typed text,
    "mpg" typed decimal,
    "cyl" typed integer,
    "disp" typed decimal,
    "hp" typed integer,
    "drat" typed decimal,
    "wt" typed decimal,
    "qsec" typed decimal,
    "vs" typed integer,
    "am" typed integer,
    "gear" typed integer,
    "carb" typed integer
  ];
}`;
