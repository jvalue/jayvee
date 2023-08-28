// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import assert = require('assert');

import {
  InternalValueRepresentation,
  PrimitiveValuetypes,
  TransformDefinition,
  createJayveeServices,
  useExtension,
} from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  TestLangExtension,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, AstNodeLocator, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import { getTestExecutionContext } from '../../../test/utils';
import { Table, TableColumn } from '../types/io-types/table';

import { PortDetails, TransformExecutor } from './transform-executor';

describe('Validation of TransformExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../../test/assets/',
  );

  interface TableColumnDefinition {
    columnName: string;
    column: TableColumn;
  }

  function constructTable(
    columns: TableColumnDefinition[],
    numberOfRows: number,
  ): Table {
    const table = new Table(numberOfRows);
    columns.forEach((col) => table.addColumn(col.columnName, col.column));
    return table;
  }

  function getColumnsMap(
    inputColumnNames: string[],
    inputTable: Table,
    transformInputDetailsList: PortDetails[],
  ): Map<string, TableColumn> {
    const variableToColumnMap: Map<string, TableColumn> = new Map();
    for (let i = 0; i < inputColumnNames.length; ++i) {
      const inputColumnName = inputColumnNames[i];
      assert(inputColumnName !== undefined);
      const inputColumn = inputTable.getColumn(inputColumnName);
      assert(inputColumn !== undefined);

      const matchingInputDetails = transformInputDetailsList[i];
      assert(matchingInputDetails !== undefined);

      const variableName = matchingInputDetails.port.name;
      variableToColumnMap.set(variableName, inputColumn);
    }
    return variableToColumnMap;
  }

  async function parseAndExecuteTransform(
    input: string,
    inputTable: Table,
    columnNames: string[],
  ): Promise<{
    resultingColumn: TableColumn<InternalValueRepresentation>;
    rowsToDelete: number[];
  }> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const transform = locator.getAstNode<TransformDefinition>(
      document.parseResult.value,
      'transforms@0',
    ) as TransformDefinition;
    const executor = new TransformExecutor(transform);

    return executor.executeTransform(
      getColumnsMap(columnNames, inputTable, executor.getInputDetails()),
      inputTable.getNumberOfRows(),
      getTestExecutionContext(locator, document),
    );
  }

  beforeAll(() => {
    // Register test extension
    useExtension(new TestLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid value', async () => {
    const text = readJvTestAsset(
      'transform-executor/valid-decimal-integer-transform.jv',
    );

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valuetype: PrimitiveValuetypes.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
      ],
      1,
    );
    const transformColumnNames: string[] = ['Column2'];

    const result = await parseAndExecuteTransform(
      text,
      inputTable,
      transformColumnNames,
    );

    expect(result.rowsToDelete).toHaveLength(0);
    expect(result.resultingColumn.valuetype).toEqual(
      PrimitiveValuetypes.Integer,
    );
    expect(result.resultingColumn.values).toHaveLength(1);
    expect(result.resultingColumn.values).toEqual(expect.arrayContaining([21]));
  });

  it('should diagnose no error on valid value', async () => {
    const text = readJvTestAsset(
      'transform-executor/valid-multiple-input-transform.jv',
    );

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valuetype: PrimitiveValuetypes.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
        {
          columnName: 'Column3',
          column: {
            values: [85.978],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
      ],
      1,
    );
    const transformColumnNames: string[] = ['Column2', 'Column3'];

    const result = await parseAndExecuteTransform(
      text,
      inputTable,
      transformColumnNames,
    );

    expect(result.rowsToDelete).toHaveLength(0);
    expect(result.resultingColumn.valuetype).toEqual(
      PrimitiveValuetypes.Integer,
    );
    expect(result.resultingColumn.values).toHaveLength(1);
    expect(result.resultingColumn.values).toEqual(
      expect.arrayContaining([106]),
    );
  });

  it('should diagnose error on empty columns map', async () => {
    const text = readJvTestAsset(
      'transform-executor/valid-decimal-integer-transform.jv',
    );

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valuetype: PrimitiveValuetypes.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
      ],
      1,
    );
    const transformColumnNames: string[] = [];

    try {
      const result = await parseAndExecuteTransform(
        text,
        inputTable,
        transformColumnNames,
      );
      expect(result).toEqual(undefined);
    } catch (e) {
      expect(e).toBeInstanceOf(assert.AssertionError);
      expect((e as assert.AssertionError).message).toEqual(
        'The expression evaluated to a falsy value:\n\n  this.getInputDetails()\n',
      );
      expect((e as assert.AssertionError).stack).toEqual(
        expect.stringContaining('at TransformExecutor.addVariablesToContext'),
      );
      expect((e as assert.AssertionError).expected).toEqual(true);
      expect((e as assert.AssertionError).actual).toEqual(false);
    }
  });

  it('should diagnose error on invalid column type', async () => {
    const text = readJvTestAsset(
      'transform-executor/valid-decimal-integer-transform.jv',
    );

    const inputTable = constructTable(
      [
        {
          columnName: 'Column1',
          column: {
            values: ['value 1'],
            valuetype: PrimitiveValuetypes.Text,
          },
        },
        {
          columnName: 'Column2',
          column: {
            values: [20.2],
            valuetype: PrimitiveValuetypes.Decimal,
          },
        },
      ],
      1,
    );
    const transformColumnNames: string[] = ['Column1'];

    try {
      const result = await parseAndExecuteTransform(
        text,
        inputTable,
        transformColumnNames,
      );
      expect(result).toEqual(undefined);
    } catch (e) {
      expect(e).toBeInstanceOf(assert.AssertionError);
      expect((e as assert.AssertionError).message).toEqual('false == true');
      expect((e as assert.AssertionError).stack).toEqual(
        expect.stringContaining('at CeilOperatorEvaluator.evaluate'),
      );
      expect((e as assert.AssertionError).expected).toEqual(true);
      expect((e as assert.AssertionError).actual).toEqual(false);
    }
  });
});
