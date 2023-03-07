import {
  AttributeValueType,
  BlockMetaInformation,
  CellRangeWrapper,
  IOType,
  isCellRangeValue,
  isCollection,
  isRowWrapper,
  validateTypedCollection,
} from '@jvalue/language-server';

export class RowDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('RowDeleter', IOType.SHEET, IOType.SHEET, {
      delete: {
        type: AttributeValueType.COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCollection(attributeValue)) {
            return;
          }

          const { validItems, invalidItems } = validateTypedCollection(
            attributeValue,
            isCellRangeValue,
          );

          invalidItems.forEach((invalidValue) =>
            accept('error', 'Only cell ranges are allowed in this collection', {
              node: invalidValue,
            }),
          );

          for (const collectionValue of validItems) {
            if (!CellRangeWrapper.canBeWrapped(collectionValue.value)) {
              continue;
            }
            const semanticCellRange = new CellRangeWrapper(
              collectionValue.value,
            );
            if (!isRowWrapper(semanticCellRange)) {
              accept('error', 'An entire row needs to be selected', {
                node: semanticCellRange.astNode,
              });
            }
          }
        },
        docs: {
          description: 'The rows to delete.',
          examples: [
            {
              code: 'delete: [row 2]',
              description: 'Delete row 2.',
            },
            {
              code: 'delete: [row 2, row 3]',
              description: 'Delete row 2 and row 3.',
            },
          ],
          validation: 'You need to specify at least one row.',
        },
      },
    });

    this.docs.description =
      'Deletes one or more rows from a `Sheet`. Row IDs of subsequent rows will be shifted accordingly, so there will be no gaps.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Deletes row 2 (i.e. the second row).',
      },
    ];
  }
}

const blockExample = `block SecondRowDeleter oftype ColumnDeleter {
  delete: [row 2];
}`;
