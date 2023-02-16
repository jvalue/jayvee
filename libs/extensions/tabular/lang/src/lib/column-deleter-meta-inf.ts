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
          description: 'Speficy the column to delete.',
          examples: [
            {
              code: 'delete: column B',
              description: 'Delete column B.',
            },
          ],
          validation: 'You need to specify exactly one column.',
        },
      },
    });
    this.docs.description =
      'Deletes a column from a `Sheet`. Column indices are recalculated.';
    this.docs.examples = [
      {
        code: blockExample,
        description: 'Drops column B (the second one).',
      },
    ];
  }
}

const blockExample = `block MpgColDeleter oftype ColumnDeleter {
  delete: column B;
}`;
