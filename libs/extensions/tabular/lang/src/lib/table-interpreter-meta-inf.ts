import {
  AttributeValueType,
  BlockMetaInformation,
  IOType,
  getNodesWithNonUniqueNames,
  isCollection,
  isValuetypeAssignmentValue,
  validateTypedCollection,
} from '@jvalue/language-server';

export class TableInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TableInterpreter',
      {
        header: {
          type: AttributeValueType.BOOLEAN,
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
                  'The first row is NOT interpreted as table header and columns of the sheet are directly mapped to table columns. The column names are taken form the provided names in the `columns` attribute.',
              },
            ],
          },
        },
        columns: {
          type: AttributeValueType.COLLECTION,
          validation: (attribute, accept) => {
            const attributeValue = attribute.value;
            if (!isCollection(attributeValue)) {
              return;
            }

            const { validItems, invalidItems } = validateTypedCollection(
              attributeValue,
              isValuetypeAssignmentValue,
            );

            invalidItems.forEach((invalidValue) =>
              accept(
                'error',
                'Only type assignments are allowed in this collection',
                {
                  node: invalidValue,
                },
              ),
            );

            const typeAssignments = validItems.map(
              (assignment) => assignment.value,
            );
            getNodesWithNonUniqueNames(typeAssignments).forEach(
              (typeAssignment) => {
                accept(
                  'error',
                  `The column name "${typeAssignment.name}" needs to be unique.`,
                  {
                    node: typeAssignment,
                    property: 'name',
                  },
                );
              },
            );
          },
          docs: {
            description:
              'Collection of type assignments. Uses column names (potentially matched with the header or by sequence depending on the `header` attribute) to assign a primitive value type to each column.',
            examples: [
              {
                code: 'columns: [ "name" typed text ]',
                description:
                  'There is one column with the header "name". All values in this colum are typed as text.',
              },
            ],
            validation:
              'Needs to be a collection of type assignments. Each column needs to have a unique name.',
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
          'Interprets a `Sheet` about cars with a topmost header row and interprets it as a `Table` by assigning a primitive value type to each column. The column names are matched to the header, so the order of the type assignments does not matter.',
      },
      {
        code: blockExampleWithoutHeader,
        description:
          'Interprets a `Sheet` about cars without a topmost header row and interprets it as a `Table` by sequentially assigning a name and a primitive value type to each column of the sheet. Note that the order of columns matters here. The first column (column `A`) will be named "name", the second column (column `B`) will be named "mpg" etc.',
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
