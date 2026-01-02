// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  type Sheet,
  Table,
  implementsStatic,
  isValidValueRepresentation,
  parseValueToInternalRepresentation,
} from '@jvalue/jayvee-execution';
import {
  AtomicValueType,
  CellIndex,
  ERROR_TYPEGUARD,
  IOType,
  InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  InvalidValue,
  MissingValue,
  type ValueType,
  ValueTypeProperty,
  internalValueToString,
  isAtomicValueType,
} from '@jvalue/jayvee-language-server';

export interface ColumnDefinitionEntry {
  sheetColumnIndex: number;
  columnName: string;
  valueType: ValueType;
  astNode: ValueTypeProperty;
}

@implementsStatic<BlockExecutorClass>()
export class TableInterpreterExecutor extends AbstractBlockExecutor<
  IOType.SHEET,
  IOType.TABLE
> {
  public static readonly type = 'TableInterpreter';

  constructor() {
    super(IOType.SHEET, IOType.TABLE);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async doExecute(
    inputSheet: Sheet,
    context: ExecutionContext,
  ): Promise<R.Result<Table>> {
    const header = context.getPropertyValue(
      'header',
      context.valueTypeProvider.Primitives.Boolean,
    );
    const columnsValueTypeDefinition = context.getPropertyValue(
      'columns',
      context.valueTypeProvider.Primitives.ValuetypeDefinition,
    );
    const skipLeadingWhitespace = context.getPropertyValue(
      'skipLeadingWhitespace',
      context.valueTypeProvider.Primitives.Boolean,
    );
    const skipTrailingWhitespace = context.getPropertyValue(
      'skipTrailingWhitespace',
      context.valueTypeProvider.Primitives.Boolean,
    );

    const columnsValueType = context.wrapperFactories.ValueType.wrap(
      columnsValueTypeDefinition,
    );

    assert(
      isAtomicValueType(columnsValueType),
      'This must have been checked earlier at the validation step',
    );

    let columnEntries: ColumnDefinitionEntry[];

    if (header) {
      if (inputSheet.getNumberOfRows() < 1) {
        return R.err({
          message: 'The input sheet is empty and thus has no header',
          diagnostic: {
            node: context.getOrFailProperty('header'),
          },
        });
      }

      const headerRow = inputSheet.getHeaderRow();

      columnEntries = this.deriveColumnDefinitionEntriesFromHeader(
        columnsValueType,
        headerRow,
        context,
      );
    } else {
      if (
        inputSheet.getNumberOfColumns() <
        columnsValueType.getProperties().length
      ) {
        return R.err({
          message: `The value type ${columnsValueType.getName()} has ${columnsValueType.getProperties().length} properties, but the input sheet only has ${inputSheet.getNumberOfColumns()} columns`,
          diagnostic: {
            node: context.getOrFailProperty('columns'),
          },
        });
      }

      columnEntries = this.deriveColumnDefinitionEntriesWithoutHeader(
        columnsValueType,
        context,
      );
    }

    const numberOfTableRows = header
      ? inputSheet.getNumberOfRows() - 1
      : inputSheet.getNumberOfRows();
    context.logger.logDebug(
      `Validating ${numberOfTableRows} row(s) according to the column types`,
    );

    const resultingTable = this.constructAndValidateTable(
      inputSheet,
      header,
      columnEntries,
      columnsValueType,
      skipLeadingWhitespace,
      skipTrailingWhitespace,
      context,
    );
    context.logger.logDebug(
      `Validation completed, the resulting table has ${resultingTable.getNumberOfRows()} row(s) and ${resultingTable.getNumberOfColumns()} column(s)`,
    );
    return R.ok(resultingTable);
  }

  private constructAndValidateTable(
    sheet: Sheet,
    header: boolean,
    columnEntries: ColumnDefinitionEntry[],
    columnsValueType: AtomicValueType,
    skipLeadingWhitespace: boolean,
    skipTrailingWhitespace: boolean,
    context: ExecutionContext,
  ): Table {
    const columns = new Map<string, R.TableColumn>();
    columnEntries.forEach((columnEntry) => {
      columns.set(columnEntry.columnName, {
        values: [],
        valueType: columnEntry.valueType,
      });
    });

    const constraints = columnsValueType
      .getConstraints()
      .map((constraint) => new R.ConstraintExecutor(constraint));

    const table = new Table(0, columns, constraints);

    // add rows
    sheet.iterateRows((sheetRow, sheetRowIndex) => {
      if (header && sheetRowIndex === 0) {
        return;
      }

      const tableRow = this.constructAndValidateTableRow(
        sheetRow,
        sheetRowIndex,
        columnEntries,
        skipLeadingWhitespace,
        skipTrailingWhitespace,
        context,
      );
      table.addRow(tableRow);
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    table.findUnfullfilledRows((constraint, rowIdx, _row) => {
      context.logger.logErr(
        `Invalid constraint ${constraint.name} on row ${rowIdx}`,
      );
      return 'markInvalid';
    }, context);

    return table;
  }

  private constructAndValidateTableRow(
    sheetRow: string[],
    sheetRowIndex: number,
    columnEntries: ColumnDefinitionEntry[],
    skipLeadingWhitespace: boolean,
    skipTrailingWhitespace: boolean,
    context: ExecutionContext,
  ): R.TableRow {
    const tableRow: R.TableRow = new Map<
      string,
      InternalValidValueRepresentation | InternalErrorValueRepresentation
    >();
    columnEntries.forEach((columnEntry) => {
      const valueType = columnEntry.valueType;
      const sheetColumnIndex = columnEntry.sheetColumnIndex;
      const value = sheetRow[sheetColumnIndex];

      const parsedValue =
        value !== undefined
          ? this.parseAndValidateValue(
              value,
              valueType,
              skipLeadingWhitespace,
              skipTrailingWhitespace,
              context,
            )
          : new MissingValue(
              `The sheet row did not contain a value at index ${sheetColumnIndex}`,
            );
      if (ERROR_TYPEGUARD(parsedValue)) {
        const currentCellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        context.logger.logDebug(
          `Invalid value at cell ${currentCellIndex.toString()}: "${value}" does not match the type ${columnEntry.valueType.getName()}`,
        );
      }

      tableRow.set(columnEntry.columnName, parsedValue);
    });

    assert(tableRow.size === columnEntries.length);
    return tableRow;
  }

  private parseAndValidateValue(
    value: string,
    valueType: ValueType,
    skipLeadingWhitespace: boolean,
    skipTrailingWhitespace: boolean,
    context: ExecutionContext,
  ): InternalValidValueRepresentation | InternalErrorValueRepresentation {
    const parsedValue = parseValueToInternalRepresentation(value, valueType, {
      skipLeadingWhitespace,
      skipTrailingWhitespace,
    });

    if (
      !ERROR_TYPEGUARD(parsedValue) &&
      !isValidValueRepresentation(parsedValue, valueType, context)
    ) {
      return new InvalidValue(
        `The following value was not valid for valuetype ${valueType.getName()}: ${internalValueToString(
          parsedValue,
          context.wrapperFactories,
        )}`,
      );
    }
    return parsedValue;
  }

  private deriveColumnDefinitionEntriesWithoutHeader(
    columnsValueType: AtomicValueType,
    context: ExecutionContext,
  ): ColumnDefinitionEntry[] {
    return columnsValueType.getProperties().map((property, propertyIndex) => {
      const columnValuetype = context.wrapperFactories.ValueType.wrap(
        property.valueType,
      );
      assert(columnValuetype !== undefined);
      return {
        sheetColumnIndex: propertyIndex,
        columnName: property.name,
        valueType: columnValuetype,
        astNode: property,
      };
    });
  }

  private deriveColumnDefinitionEntriesFromHeader(
    columnsValueType: AtomicValueType,
    headerRow: string[],
    context: ExecutionContext,
  ): ColumnDefinitionEntry[] {
    context.logger.logDebug(`Matching header with provided column names`);

    return columnsValueType.getProperties().flatMap((property) => {
      const indexOfMatchingHeader = headerRow.findIndex(
        (headerColumnName) => headerColumnName === property.name,
      );
      if (indexOfMatchingHeader === -1) {
        context.logger.logDebug(
          `Omitting column "${property.name}" as the name was not found in the header`,
        );
        return [];
      }
      const columnValuetype = context.wrapperFactories.ValueType.wrap(
        property.valueType,
      );
      assert(columnValuetype !== undefined);

      return [
        {
          sheetColumnIndex: indexOfMatchingHeader,
          columnName: property.name,
          valueType: columnValuetype,
          astNode: property,
        },
      ];
    });
  }
}
