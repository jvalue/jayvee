import {
  ColumnSection,
  LayoutValidator,
  RowSection,
  Type,
  isColumnSection,
  isRowSection,
} from '../../language-server/generated/ast';
import { Sheet, Table, sheetType, tableType } from '../data-types';
import { getDataType } from '../datatypes';
import { AbstractDataType } from '../datatypes/AbstractDataType';

import { BlockExecutor } from './block-executor';

function getColumnIndexFromSelector(selector: string): number {
  if (!selector.match(/[A-Z,a-z]{1}/)) {
    throw Error(`Invalid column selector: ${selector}`);
  }
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
  return alphabet.indexOf(selector.toLowerCase());
}

export class LayoutValidatorExecutor extends BlockExecutor<
  LayoutValidator,
  Sheet,
  Table
> {
  constructor(block: LayoutValidator) {
    super(block, sheetType, tableType);
  }

  override execute(input: Sheet): Promise<Table> {
    const sections = this.block.layout.ref?.sections;

    if (!sections) {
      return Promise.resolve({ columnNames: [], columnTypes: [], data: input });
    }

    const headerRowSection = sections.find(
      (x) => isRowSection(x) && x.header,
    ) as RowSection | undefined;

    let columnNames: string[] = [];
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const columnNamesIndex = headerRowSection!.rowId - 1;

    if (
      headerRowSection !== undefined &&
      input[columnNamesIndex] !== undefined
    ) {
      columnNames = input[columnNamesIndex] as string[];
    }

    const dataType = getDataType(headerRowSection?.type as Type);

    columnNames.forEach((columnName) => {
      if (!dataType.isValid(columnName)) {
        throw new Error(
          `${columnName} is not a valid ${
            headerRowSection?.type as string
          } in ${this.block.$container.name}.`,
        );
      }
    });

    // Assuming that at least one row exists and all rows are the same width
    const width = input[0]!.length;

    const columnTypes: { [index: number]: AbstractDataType | undefined } = {};

    (
      sections.filter((section) => isColumnSection(section)) as ColumnSection[]
    ).forEach((section: ColumnSection) => {
      columnTypes[getColumnIndexFromSelector(section.columnId)] = getDataType(
        section.type,
      );
    });

    const columnTypesArray: Array<AbstractDataType | undefined> = [];

    for (let i = 0; i < width; i++) {
      columnTypesArray.push(columnTypes[i]);
    }

    const data = input.filter((value, index) => index !== columnNamesIndex);

    data.forEach((row, rowIndex) => {
      columnTypesArray.forEach((type, columnIndex) => {
        if (type && !type.isValid(row[columnIndex])) {
          throw new Error(
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            `Invalid value for ${type.toString()} (Value: ${row[
              columnIndex
            ]!} at position: [${rowIndex}:${columnIndex}]).`,
          );
        }
      });
    });

    return Promise.resolve({
      columnNames: columnNames,
      columnTypes: columnTypesArray,
      data: data,
    });
  }
}
