import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeValue,
  isCollection,
  isSemanticRow,
} from '@jayvee/language-server';

export class RowDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('RowDeleter', SHEET_TYPE, SHEET_TYPE, {
      delete: {
        type: AttributeType.COLLECTION,
        validation: (attribute, accept) => {
          const attributeValue = attribute.value;
          if (!isCollection(attributeValue)) {
            return;
          }

          for (const collectionValue of attributeValue.values) {
            if (!isCellRangeValue(collectionValue)) {
              accept(
                'error',
                'Only cell ranges are allowed in this collection',
                {
                  node: collectionValue,
                },
              );
              continue;
            }

            if (!SemanticCellRange.canBeWrapped(collectionValue.value)) {
              continue;
            }
            const semanticCellRange = new SemanticCellRange(
              collectionValue.value,
            );
            if (!isSemanticRow(semanticCellRange)) {
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
