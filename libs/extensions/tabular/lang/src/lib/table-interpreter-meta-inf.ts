import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  TABLE_TYPE,
  getNodesWithNonUniqueNames,
  isCollection,
  isDataTypeAssignmentValue,
  validateTypedCollection,
} from '@jayvee/language-server';

export class TableInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('TableInterpreter', SHEET_TYPE, TABLE_TYPE, {
      header: {
        type: AttributeType.BOOLEAN,
      },
      columns: {
        type: AttributeType.COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCollection(attributeValue)) {
            return;
          }

          const { validItems, invalidItems } = validateTypedCollection(
            attributeValue,
            isDataTypeAssignmentValue,
          );

          invalidItems.forEach((invalidValue) =>
            accept(
              'error',
              'Only data type assignments are allowed in this collection',
              {
                node: invalidValue,
              },
            ),
          );

          const dataTypeAssignments = validItems.map(
            (assignment) => assignment.value,
          );
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
      },
    });
  }
}
