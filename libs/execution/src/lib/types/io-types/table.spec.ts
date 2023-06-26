// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PrimitiveValuetypes } from '@jvalue/jayvee-language-server';

import { Table } from './table';

describe('Table', () => {
  let table: Table;

  beforeEach(() => {
    table = new Table();
  });

  it('should count number of columns', () => {
    table.addColumn('a', { valuetype: PrimitiveValuetypes.Text, values: [] });
    table.addColumn('b', { valuetype: PrimitiveValuetypes.Text, values: [] });

    expect(table.getNumberOfColumns()).toBe(2);
  });

  it('should count number of rows when added with column', () => {
    table.addColumn('a', {
      valuetype: PrimitiveValuetypes.Text,
      values: [],
    });
    table.addRow({ a: 'a1' });
    table.addRow({ a: 'a2' });
    table.addRow({ a: 'a3' });
    table.addColumn('b', {
      valuetype: PrimitiveValuetypes.Text,
      values: ['b1', 'b2', 'b3'],
    });

    expect(table.getNumberOfRows()).toBe(3);
  });

  it('should count number of rows when added without column', () => {
    table.addColumn('a', {
      valuetype: PrimitiveValuetypes.Text,
      values: [],
    });
    table.addRow({ a: 'a1' });
    table.addRow({ a: 'a2' });
    table.addRow({ a: 'a3' });

    expect(table.getNumberOfRows()).toBe(3);
  });
});
