// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import * as R from '@jvalue/jayvee-execution';
import {
  AbstractBlockExecutor,
  TransformExecutor,
  type BlockExecutorClass,
  type ExecutionContext,
  type Sheet,
  Table,
  implementsStatic,
} from '@jvalue/jayvee-execution';
import {
  AtomicValueType,
  ERROR_TYPEGUARD,
  evaluateExpression,
  internalValueToString,
  InvalidValue,
  IOType,
  isTableRowLiteral,
  MISSING_TYPEGUARD,
  TableRowLiteral,
  isAtomicValueType,
  MissingValue,
  onlyElementOrUndefined,
  TABLEROW_TYPEGUARD,
  ValueType,
} from '@jvalue/jayvee-language-server';

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
    const parseWith = context.getPropertyValue(
      'parseWith',
      context.valueTypeProvider.Primitives.Transform,
    );

    const columnsValueType = context.wrapperFactories.ValueType.wrap(
      columnsValueTypeDefinition,
    );

    assert(
      isAtomicValueType(columnsValueType),
      'This must have been checked earlier at the validation step',
    );

    const schema = columnsValueType.getSchema();

    let headerRow: string[] | undefined = undefined;
    if (header) {
      headerRow = inputSheet.popHeaderRow();
      if (headerRow === undefined) {
        return R.err({
          message: 'The input sheet is empty and thus has no header',
          diagnostic: {
            node: context.getOrFailProperty('header'),
          },
        });
      }
      if (headerRow.length !== schema.size) {
        return R.err({
          message:
            'The length of the header does not fit the columns value type',
          diagnostic: {
            node: context.getOrFailProperty('header'),
          },
        });
      }
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
    }

    context.logger.logDebug(
      `Validating ${inputSheet.getNumberOfRows()} row(s) according to the column types`,
    );

    const parseRowTransform = new TransformExecutor(parseWith, context);

    const resultingTable = this.constructAndValidateTable(
      inputSheet,
      headerRow,
      columnsValueType,
      parseRowTransform,
      context,
    );
    context.logger.logDebug(
      `Validation completed, the resulting table has ${resultingTable.getNumberOfRows()} row(s) and ${resultingTable.getNumberOfColumns()} column(s)`,
    );
    return R.ok(resultingTable);
  }

  private constructAndValidateTable(
    sheet: Sheet,
    headerRow: string[] | undefined,
    columnsValueType: AtomicValueType,
    parseRowTransform: TransformExecutor,
    context: ExecutionContext,
  ): Table {
    const columns = new Map<string, R.TableColumn>();
    for (const [columnName, columnValueType] of columnsValueType
      .getSchema()
      .entries()) {
      columns.set(columnName, {
        values: [],
        valueType: columnValueType,
      });
    }
    if (headerRow !== undefined) {
      context.evaluationContext.setHeaderRow(headerRow);
    }

    const sheetRowReferenceName = onlyElementOrUndefined(
      parseRowTransform.getInputDetails(),
    )?.port.name;
    assert(sheetRowReferenceName !== undefined);

    const parseRowExpression =
      parseRowTransform.getOutputAssignment().expression;
    assert(isTableRowLiteral(parseRowExpression));

    const constraints = columnsValueType
      .getConstraints()
      .map((constraint) => new R.ConstraintExecutor(constraint));

    const table = new Table(0, columns, constraints);

    // add rows
    sheet.iterateRows((sheetRow) => {
      const tableRow = this.constructAndValidateTableRow(
        sheetRowReferenceName,
        sheetRow,
        columnsValueType.getSchema(),
        parseRowExpression,
        context,
      );
      if (MISSING_TYPEGUARD(tableRow)) {
        context.logger.logDebug(tableRow.toString());
      } else {
        table.addRow(tableRow);
      }
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
    sheetRowReferenceName: string,
    sheetRow: string[],
    schema: Map<string, ValueType>,
    parseRowExpression: TableRowLiteral,
    context: ExecutionContext,
  ): R.TableRow | MissingValue {
    context.evaluationContext.setValueForReference(
      sheetRowReferenceName,
      sheetRow,
    );

    const tableRow = evaluateExpression(
      parseRowExpression,
      context.evaluationContext,
      context.wrapperFactories,
    );
    assert(TABLEROW_TYPEGUARD(tableRow));

    let missingCount = 0;
    for (const value of tableRow.values()) {
      if (MISSING_TYPEGUARD(value)) {
        context.logger.logDebug(value.toString());
        missingCount += 1;
      }
    }
    if (missingCount === tableRow.size) {
      return new MissingValue('All values in row were missing. Discarding row');
    }

    assert(tableRow.size === schema.size);
    for (const [columnName, cellValue] of tableRow) {
      const entry = [...schema.entries()].find(([cN]) => cN === columnName);
      assert(entry !== undefined);
      const [, columnValueType] = entry;
      if (
        !ERROR_TYPEGUARD(cellValue) &&
        !columnValueType.isInternalValidValueRepresentation(cellValue)
      ) {
        tableRow.set(
          columnName,
          new InvalidValue(
            `cell value ${internalValueToString(cellValue)} is not a valid value for ${columnValueType.getName()}`,
          ),
        );
      }
    }

    return tableRow;
  }
}
