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

import { getColumn } from '../data-util';

import { BlockExecutor } from './block-executor';
import {
  columnCharactersAsIndex,
  columnIndexAsCharacters,
} from './column-id-util';
import * as R from './execution-result';

export class LayoutValidatorExecutor extends BlockExecutor<
  LayoutValidator,
  Sheet,
  Table,
  LayoutValidatorMetaInformation
> {
  override execute(input: Sheet): Promise<R.Result<Table>> {
    const sections = this.block.layout.value.ref?.sections || [];
    const validityResult = this.validateSections(sections, input.data);

    if (R.isErr(validityResult)) {
      return Promise.resolve(validityResult);
    }

    return Promise.resolve(
      R.ok({
        columnNames: this.getHeader(input),
        columnTypes: this.getColumnTypes(sections, input.width),
        data: input.data.filter((_, index) => index !== this.getHeaderIndex()),
      }),
    );
  }

  getHeader(input: Sheet): string[] {
    const headerRowSection = this.block.layout.value.ref?.sections.find(
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
    const headerRowSection = this.block.layout.value.ref?.sections.find(
      (x) => isRowSection(x) && x.header,
    ) as RowSection | undefined;

    return headerRowSection ? headerRowSection.rowId - 1 : undefined;
  }

  validateSections(sections: Section[], data: string[][]): R.Result<void> {
    const errors: string[] = [];
    sections.forEach((section) => {
      const type = getDataType(section.type);
      if (isRowSection(section)) {
        errors.push(...this.validateRowSection(section, data, type));
      } else {
        errors.push(...this.validateColumnSection(section, data, type));
      }
    });
    if (errors.length > 0) {
      return R.err({
        message: `Layout validation failed. Found the following issues:\n\n${errors.join(
          '\n',
        )}`,
        hint: 'Please check your defined layout.',
        cstNode: this.block.$cstNode?.parent,
      });
    }
    return R.ok(undefined);
  }

  private validateColumnSection(
    section: ColumnSection,
    data: string[][],
    type: AbstractDataType,
  ) {
    const errors: string[] = [];

    const columnIdCharacter = section.columnId;
    const dataToValidate = getColumn(
      data,
      columnCharactersAsIndex(columnIdCharacter),
      undefined,
    ).filter((_, index) => index !== this.getHeaderIndex());

    dataToValidate.forEach((value, rowId) => {
      if (!type.isValid(value)) {
        errors.push(
          this.formatErrorMessage(
            value,
            `${rowId}`,
            columnIdCharacter,
            type.languageType,
          ),
        );
      }
    });
    return errors;
  }

  private validateRowSection(
    section: RowSection,
    data: string[][],
    type: AbstractDataType,
  ): string[] {
    const errors: string[] = [];

    const rowId = section.rowId;
    const dataToValidate = data[rowId] || [];

    dataToValidate.forEach((value, colId) => {
      if (!type.isValid(value)) {
        errors.push(
          this.formatErrorMessage(
            value,
            `${rowId}`,
            columnIndexAsCharacters(colId),
            type.languageType,
          ),
        );
      }
    });
    return errors;
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

  getColumnTypes(
    sections: Section[],
    width: number,
  ): Array<AbstractDataType | undefined> {
    const columnTypes: { [index: number]: AbstractDataType | undefined } = {};

    (
      sections.filter((section) => isColumnSection(section)) as ColumnSection[]
    ).forEach((section: ColumnSection) => {
      columnTypes[columnCharactersAsIndex(section.columnId)] = getDataType(
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
