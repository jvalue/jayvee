import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
  SemanticCellRange,
  isCellRangeValue,
  isCollection,
  isSemanticColumn,
} from '@jayvee/language-server';

export class ColumnDeleterMetaInformation extends BlockMetaInformation {
  constructor() {
    super('ColumnDeleter', SHEET_TYPE, SHEET_TYPE, {
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
            if (!isSemanticColumn(semanticCellRange)) {
              accept('error', 'An entire column needs to be selected', {
                node: semanticCellRange.astNode,
              });
            }
          }
        },
        docs: {
          description: 'The columns to delete.',
          examples: [
            {
              code: 'delete: [column B]',
              description: 'Delete column B.',
            },
            {
              code: 'delete: [column B, column C]',
              description: 'Delete column B and column C.',
            },
          ],
          validation: 'You need to specify at least one column.',
        },
      },
    });
    this.docs.description =
      'Deletes columns from a `Sheet`. Column IDs of subsequent columns will be shifted accordingly, so there will be no gaps.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Deletes column B (i.e. the second column).',
      },
    ];
  }
}

const blockExample = `block MpgColumnDeleter oftype ColumnDeleter {
  delete: [column B];
}`;
