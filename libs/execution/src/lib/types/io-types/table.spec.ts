// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalErrorValueRepresentation,
  type InternalValidValueRepresentation,
  ValueTypeProvider,
} from '@jvalue/jayvee-language-server';

import { Table, type TableColumn } from './table';

function addRowWrapper(
  table: Table,
  row: Record<
    string,
    InternalValidValueRepresentation | InternalErrorValueRepresentation
  >,
): void {
  const tableRow = new Map<
    string,
    InternalValidValueRepresentation | InternalErrorValueRepresentation
  >();

  for (const [columnName, cellValue] of Object.entries(row)) {
    tableRow.set(columnName, cellValue);
  }

  return table.addRow(tableRow);
}

describe('Table', () => {
  let table: Table;
  let valueTypeProvider: ValueTypeProvider;

  beforeEach(() => {
    table = new Table(0, new Map<string, TableColumn>(), []);
    valueTypeProvider = new ValueTypeProvider();
  });

  describe('addColumn', () => {
    it('should increase the number of columns correctly on adding columns', () => {
      table.addColumn('a', {
        valueType: valueTypeProvider.Primitives.Text,
        values: [],
      });
      table.addColumn('b', {
        valueType: valueTypeProvider.Primitives.Text,
        values: [],
      });

      expect(table.getNumberOfColumns()).toBe(2);
    });
  });

  describe('addRow', () => {
    it('should increase the number of rows correctly and allow adding columns afterwards', () => {
      table.addColumn('a', {
        valueType: valueTypeProvider.Primitives.Text,
        values: [],
      });
      addRowWrapper(table, { a: 'a1' });
      addRowWrapper(table, { a: 'a2' });
      addRowWrapper(table, { a: 'a3' });
      table.addColumn('b', {
        valueType: valueTypeProvider.Primitives.Text,
        values: ['b1', 'b2', 'b3'],
      });

      expect(table.getNumberOfRows()).toBe(3);
    });

    it('should increase the number of rows correctly on adding a row and a given column structure', () => {
      table.addColumn('a', {
        valueType: valueTypeProvider.Primitives.Text,
        values: [],
      });
      addRowWrapper(table, { a: 'a1' });
      addRowWrapper(table, { a: 'a2' });
      addRowWrapper(table, { a: 'a3' });

      expect(table.getNumberOfRows()).toBe(3);
    });
  });
});
