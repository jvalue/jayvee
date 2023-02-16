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
            'Flag, if the first row should be interpreted as header row.',
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
            'Collection of data type assignments. Uses the column name (by the header) to provide each column with a data type.',
          examples: [
            {
              code: 'header: true',
              description: 'The first row is interpreted as table header.',
            },
          ],
          validation:
            'Needs to satisfy the format of a data type assigment collection. Each column needs to have an unique name.',
        },
      },
    });
    this.docs.description = 'Interprets a `Sheet` as a `Table`.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Interprets the `Sheet` with a given header and the types of the columns.',
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
