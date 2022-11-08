import {
  AbstractDataType,
  ColumnSection,
  LayoutValidator,
  LayoutValidatorMetaInformation,
  RowSection,
  Section,
  Sheet,
  Table,
  getDataType,
  isColumnSection,
  isRowSection,
} from '@jayvee/language-server';

import { getColumn, getColumnIndexFromSelector } from '../data-util';

import { BlockExecutor } from './block-executor';
import * as R from './execution-result';

export class LayoutValidatorExecutor extends BlockExecutor<
  LayoutValidator,
  Sheet,
  Table,
  LayoutValidatorMetaInformation
> {
  override execute(input: Sheet): Promise<R.Result<Table>> {
    const sections = this.block.layout.ref?.sections || [];
    this.ensureValidSections(sections, input.data);
    return Promise.resolve(
      R.ok({
        columnNames: this.getHeader(input),
        columnTypes: this.getColumnTypes(sections, input.width),
        data: input.data.filter((_, index) => index !== this.getHeaderIndex()),
      }),
    );
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
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      columnNames = input.data[columnNamesIndex]!;
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
