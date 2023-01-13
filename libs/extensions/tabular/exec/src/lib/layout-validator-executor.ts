import { BlockExecutor } from '@jayvee/execution';
import {
  AbstractDataType,
  ColumnSection,
  Sheet,
  Table,
  getDataType,
  isColumnSection,
  isHeaderRowSection,
} from '@jayvee/language-server';
import * as O from 'fp-ts/Option';

import {
  columnCharactersAsIndex,
  columnIndexAsCharacters,
} from './utils/column-id-util';

export class LayoutValidatorExecutor extends BlockExecutor<Sheet, Table> {
  constructor() {
    super('LayoutValidator');
  }

  override execute(input: Sheet): Promise<O.Option<Table>> {
    const layout = this.getLayoutAttributeValue('validationLayout');
    const sections = layout.sections;

    const headerRowSection = sections.find(isHeaderRowSection);

    const columnSections = sections.filter(isColumnSection);
    const columnTypes = this.getColumnTypes(columnSections);

    let columnNames: string[] = [];
    const data: string[][] = [];
    const errors: string[] = [];

    input.data.forEach((row, index) => {
      const rowErrors: string[] = [];

      const isHeader = index + 1 === headerRowSection?.rowId;
      if (isHeader) {
        columnNames = row;
        const headerRowType = getDataType(headerRowSection.type);
        rowErrors.push(...this.validateHeaderRow(row, index, headerRowType));
      } else {
        rowErrors.push(...this.validateRow(row, index, columnTypes));
      }
      if (!isHeader && rowErrors.length === 0) {
        data.push(row);
      }
      errors.push(...rowErrors);
    });

    if (errors.length !== 0) {
      this.logWarn(
        `${
          input.data.length - data.length - 1
        } rows were dropped due to failed layout validation. Found the following issues:\n${errors.join(
          '\n',
        )}`,
        { node: layout, property: 'name' },
      );
    }

    return Promise.resolve(
      O.some({
        columnNames,
        columnTypes,
        data,
      }),
    );
  }

  private validateHeaderRow(
    row: string[],
    rowIndex: number,
    type: AbstractDataType,
  ): string[] {
    const errors: string[] = [];
    row.forEach((value, columnIndex) => {
      if (!type.isValid(value)) {
        errors.push(
          this.formatErrorMessage(
            value,
            `${rowIndex + 1}`,
            columnIndexAsCharacters(columnIndex),
            type.languageType,
          ),
        );
      }
    });
    return errors;
  }

  private validateRow(
    row: string[],
    rowIndex: number,
    columnTypes: Array<AbstractDataType | undefined>,
  ): string[] {
    const errors: string[] = [];
    row.forEach((value, columnIndex) => {
      const type = columnTypes[columnIndex];
      if (type !== undefined && !type.isValid(value)) {
        errors.push(
          this.formatErrorMessage(
            value,
            `${rowIndex + 1}`,
            columnIndexAsCharacters(columnIndex),
            type.languageType,
          ),
        );
      }
    });
    return errors;
  }

  private getColumnTypes(
    columnSections: ColumnSection[],
  ): Array<AbstractDataType | undefined> {
    const result: Array<AbstractDataType | undefined> = [];

    columnSections.forEach((section) => {
      const type = getDataType(section.type);
      const columnIndex = columnCharactersAsIndex(section.columnId);
      result[columnIndex] = type;
    });

    return result;
  }

  formatErrorMessage(
    value: string | undefined,
    rowId: string,
    colId: string,
    languageType: string,
  ): string {
    return `[row ${rowId}, column ${colId}] Value "${
      value ?? ''
    }" does not match type ${languageType}`;
  }
}
