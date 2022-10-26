import {
  ColumnSection,
  LayoutValidator,
  RowSection,
  Section,
  isColumnSection,
  isRowSection,
} from '../../language-server/generated/ast';
import { Sheet, Table, sheetType, tableType } from '../data-types';
import { getColumn, getColumnIndexFromSelector } from '../data-util';
import { getDataType } from '../datatypes';
import { AbstractDataType } from '../datatypes/AbstractDataType';

import { BlockExecutor } from './block-executor';

export class LayoutValidatorExecutor extends BlockExecutor<
  LayoutValidator,
  Sheet,
  Table
> {
  constructor(block: LayoutValidator) {
    super(block, sheetType, tableType);
  }

  override execute(input: Sheet): Promise<Table> {
    const sections = this.block.layout.ref?.sections || [];

    this.ensureValidSections(sections, input.data);

    return Promise.resolve({
      columnNames: this.getHeader(input),
      columnTypes: this.getColumnTypes(sections, input.width),
      data: input.data.filter((_, index) => index !== this.getHeaderIndex()),
    });
  }

  getHeader(input: Sheet): string[] {
    const headerRowSection = this.block.layout.ref?.sections.find(
      (x) => isRowSection(x) && x.header,
    ) as RowSection | undefined;

    const columnNamesIndex = this.getHeaderIndex();

    if (columnNamesIndex === undefined) {
      return [];
    }

    let columnNames: string[] = [];
    if (
      headerRowSection !== undefined &&
      input.data[columnNamesIndex] !== undefined
    ) {
      columnNames = input.data[columnNamesIndex] as string[];
    }

    return columnNames;
  }

  getHeaderIndex(): number | undefined {
    const headerRowSection = this.block.layout.ref?.sections.find(
      (x) => isRowSection(x) && x.header,
    ) as RowSection | undefined;

    return headerRowSection ? headerRowSection.rowId - 1 : undefined;
  }

  ensureValidSections(sections: Section[], data: string[][]): void {
    sections.forEach((section) => {
      const type = getDataType(section.type);
      const dataToValidate: Array<string | undefined> = isRowSection(section)
        ? data[section.rowId] || []
        : getColumn(
            data,
            getColumnIndexFromSelector(section.columnId),
            undefined,
          ).filter((_, index) => index !== this.getHeaderIndex());
      dataToValidate.forEach((value, position) => {
        if (!type.isValid(value)) {
          throw new Error(
            `Invalid value for ${type.languageType} (Value: ${
              value !== undefined ? value : 'undefined'
            } in ${
              isRowSection(section) ? 'row' : 'column'
            } at offset: ${position}).`,
          );
        }
      });
    });
  }

  getColumnTypes(
    sections: Section[],
    width: number,
  ): Array<AbstractDataType | undefined> {
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

    return columnTypesArray;
  }
}
