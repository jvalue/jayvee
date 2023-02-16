import {
  AttributeType,
  BlockMetaInformation,
  SHEET_TYPE,
} from '@jayvee/language-server';

export class CellRangeSelectorMetaInformation extends BlockMetaInformation {
  constructor() {
    super('CellRangeSelector', SHEET_TYPE, SHEET_TYPE, {
      select: {
        type: AttributeType.CELL_RANGE,
        docs: {
          description: 'The cell range to select.',
          examples: [
            {
              code: 'select: A1:E*',
              description: 'Specify a cell range in the cell range notation.',
            },
          ],
        },
      },
    });
    this.docs.description =
      'Selects a subset of a `Sheet` to produce a new `Sheet`.';
    this.docs.examples = [
      {
        code: blockExample,
        description:
          'Selects the cells in the given range and produces a new `Sheet`.',
      },
    ];
  }
}

const blockExample = `block CarsCoreData oftype CellRangeSelector {
  select: A1:E*;
}`;
