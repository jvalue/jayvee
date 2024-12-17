// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { HeaderArray, parseString as parseCSVString } from '@fast-csv/parse';
import { type ParserOptionsArgs } from '@fast-csv/parse/build/src/ParserOptions';
import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  BinaryFile,
  type BlockExecutorClass,
  type ExecutionContext,
  Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  CellIndex,
  IOType,
  type ValuetypeAssignment,
  rowIndexToString,
} from '@jvalue/jayvee-language-server';

import {
  ColumnDefinitionEntry,
  TableInterpreterExecutor,
} from './table-interpreter-executor';

@implementsStatic<BlockExecutorClass>()
export class CSVToTableInterpreterExecutor extends AbstractBlockExecutor<
  IOType.FILE,
  IOType.TABLE
> {
  public static readonly type = 'CSVToTableInterpreter';

  constructor() {
    super(IOType.FILE, IOType.TABLE);
  }

  async doExecute(
    inputFile: BinaryFile,
    context: ExecutionContext,
  ): Promise<R.Result<Table>> {
    const encoding = context.getPropertyValue(
      'encoding',
      context.valueTypeProvider.Primitives.Text,
    );
    const delimiter = context.getPropertyValue(
      'delimiter',
      context.valueTypeProvider.Primitives.Text,
    );
    const enclosing = context.getPropertyValue(
      'enclosing',
      context.valueTypeProvider.Primitives.Text,
    );
    const enclosingEscape = context.getPropertyValue(
      'enclosingEscape',
      context.valueTypeProvider.Primitives.Text,
    );
    const header = context.getPropertyValue(
      'header',
      context.valueTypeProvider.Primitives.Boolean,
    );
    const columnDefinitions = context.getPropertyValue(
      'columns',
      context.valueTypeProvider.createCollectionValueTypeOf(
        context.valueTypeProvider.Primitives.ValuetypeAssignment,
      ),
    );

    const parseOptions: ParserOptionsArgs = {
      delimiter,
      quote: enclosing,
      escape: enclosingEscape,
      encoding,
    };

    const table = await this.parseCSV(
      inputFile,
      encoding,
      parseOptions,
      header,
      columnDefinitions,
      context,
    );
    context.logger.logDebug(
      `Validation completed, the resulting table has ${table.getNumberOfRows()} row(s) and ${table.getNumberOfColumns()} column(s)`,
    );
    return R.ok(table);
  }

  private async parseCSV(
    inputFile: BinaryFile,
    encoding: string,
    parseOptions: ParserOptionsArgs,
    header: boolean,
    columnDefinitions: ValuetypeAssignment[],
    context: ExecutionContext,
  ): Promise<Table> {
    const decoder = new TextDecoder(encoding);
    const csvText = decoder.decode(inputFile.content);

    return new Promise((resolve, reject) => {
      const table = new Table();
      let columnEntries: ColumnDefinitionEntry[] | undefined = undefined;
      if (header) {
        parseOptions.headers = true;
        // NOTE: columns will be added on the parsers `header` event
      } else {
        columnEntries =
          TableInterpreterExecutor.deriveColumnDefinitionEntriesWithoutHeader(
            columnDefinitions,
            context,
          );
        columnEntries.forEach((columnEntry) => {
          table.addColumn(columnEntry.columnName, {
            values: [],
            valueType: columnEntry.valueType,
          });
        });
      }

      let rowIdx = 0;
      parseCSVString(csvText, parseOptions)
        .on('error', (error) => {
          reject(error);
        })

        .on('headers', (headers: HeaderArray) => {
          columnEntries = this.deriveColumnDefinitionEntriesFromHeader(
            columnDefinitions,
            headers,
            context,
          );
          columnEntries.forEach((columnEntry) => {
            table.addColumn(columnEntry.columnName, {
              values: [],
              valueType: columnEntry.valueType,
            });
          });
        })

        .on('data', (data: Record<string, string> | string[]) => {
          assert(
            columnEntries !== undefined,
            'Headers have either been parsed in the `header` event, or derived from column definitions',
          );
          const parsedRow = this.constructAndValidateTableRow(
            data,
            rowIdx++,
            columnEntries,
            context,
          );
          if (parsedRow === undefined) {
            context.logger.logDebug(`Omitting row ${rowIndexToString(rowIdx)}`);
          } else {
            table.addRow(parsedRow);
          }
        })

        .on('end', () => {
          resolve(table);
        });
    });
  }

  private constructAndValidateTableRow(
    sheetRow: Record<string, string> | string[],
    sheetRowIndex: number,
    columnEntries: ColumnDefinitionEntry[],
    context: ExecutionContext,
  ): R.TableRow | undefined {
    let invalidRow = false;
    const tableRow: R.TableRow = {};
    columnEntries.forEach((columnEntry) => {
      const sheetColumnIndex = columnEntry.sheetColumnIndex;

      const value: string = Array.isArray(sheetRow)
        ? // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sheetRow[sheetColumnIndex]!
        : // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          sheetRow[columnEntry.columnName]!;

      const valueType = columnEntry.valueType;

      const parsedValue = TableInterpreterExecutor.parseAndValidateValue(
        value,
        valueType,
        context,
      );
      if (parsedValue === undefined) {
        const currentCellIndex = new CellIndex(sheetColumnIndex, sheetRowIndex);
        context.logger.logDebug(
          `Invalid value at cell ${currentCellIndex.toString()}: "${value}" does not match the type ${columnEntry.valueType.getName()}`,
        );
        invalidRow = true;
        return;
      }

      tableRow[columnEntry.columnName] = parsedValue;
    });
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (invalidRow) {
      return undefined;
    }

    assert(Object.keys(tableRow).length === columnEntries.length);
    return tableRow;
  }

  private deriveColumnDefinitionEntriesFromHeader(
    columnDefinitions: ValuetypeAssignment[],
    headerRow: (string | null | undefined)[],
    context: ExecutionContext,
  ): ColumnDefinitionEntry[] {
    context.logger.logDebug(`Matching header with provided column names`);

    const columnEntries: ColumnDefinitionEntry[] = [];
    for (const columnDefinition of columnDefinitions) {
      const indexOfMatchingHeader = headerRow.findIndex(
        (headerColumnName) => headerColumnName === columnDefinition.name,
      );
      if (indexOfMatchingHeader === -1) {
        context.logger.logDebug(
          `Omitting column "${columnDefinition.name}" as the name was not found in the header`,
        );
        continue;
      }
      const columnValuetype = context.wrapperFactories.ValueType.wrap(
        columnDefinition.type,
      );
      assert(columnValuetype !== undefined);

      columnEntries.push({
        sheetColumnIndex: indexOfMatchingHeader,
        columnName: columnDefinition.name,
        valueType: columnValuetype,
        astNode: columnDefinition,
      });
    }

    return columnEntries;
  }
}
