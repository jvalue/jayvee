// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DefaultOperatorEvaluatorRegistry,
  WrapperFactoryProvider,
} from '@jvalue/jayvee-language-server';

import { Table } from './table';

describe('Table', () => {
  let table: Table;
  let wrapperFactories: WrapperFactoryProvider;

  beforeEach(() => {
    table = new Table();
    wrapperFactories = new WrapperFactoryProvider(
      new DefaultOperatorEvaluatorRegistry(),
    );
  });

  describe('addColumn', () => {
    it('should increase the number of columns correctly on adding columns', () => {
      table.addColumn('a', {
        valueType: wrapperFactories.ValueType.Primitives.Text,
        values: [],
      });
      table.addColumn('b', {
        valueType: wrapperFactories.ValueType.Primitives.Text,
        values: [],
      });

      expect(table.getNumberOfColumns()).toBe(2);
    });
  });

  describe('addRow', () => {
    it('should increase the number of rows correctly and allow adding columns afterwards', () => {
      table.addColumn('a', {
        valueType: wrapperFactories.ValueType.Primitives.Text,
        values: [],
      });
      table.addRow({ a: 'a1' });
      table.addRow({ a: 'a2' });
      table.addRow({ a: 'a3' });
      table.addColumn('b', {
        valueType: wrapperFactories.ValueType.Primitives.Text,
        values: ['b1', 'b2', 'b3'],
      });

      expect(table.getNumberOfRows()).toBe(3);
    });

    it('should increase the number of rows correctly on adding a row and a given column structure', () => {
      table.addColumn('a', {
        valueType: wrapperFactories.ValueType.Primitives.Text,
        values: [],
      });
      table.addRow({ a: 'a1' });
      table.addRow({ a: 'a2' });
      table.addRow({ a: 'a3' });

      expect(table.getNumberOfRows()).toBe(3);
    });
  });
});
