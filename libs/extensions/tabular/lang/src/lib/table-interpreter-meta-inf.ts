import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  TABLE_TYPE,
  getNodesWithNonUniqueNames,
  isDataTypeAssignmentCollection,
} from '@jayvee/language-server';

export class TableInterpreterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('TableInterpreter', SHEET_TYPE, TABLE_TYPE, {
      header: {
        type: AttributeType.BOOLEAN,
      },
      columns: {
        type: AttributeType.DATA_TYPE_ASSIGNMENT_COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isDataTypeAssignmentCollection(attributeValue)) {
            return;
          }

          getNodesWithNonUniqueNames(attributeValue.value).forEach(
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
