// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import assert = require('assert');

import { BlockExecutorMock } from '@jvalue/jayvee-execution/test';
import * as sqlite3 from 'sqlite3';

export class SQLiteLoaderExecutorMock implements BlockExecutorMock {
  private _sqliteClient: sqlite3.Database | undefined;

  get sqliteClient(): sqlite3.Database {
    assert(
      this._sqliteClient !== undefined,
      'Client not initialized - please call setup() first!',
    );
    return this._sqliteClient;
  }

  setup(
    registerMocks: (
      sqliteClient: sqlite3.Database,
    ) => void = defaultSQLiteMockRegistration,
  ) {
    // setup sqlite3 mock
    this._sqliteClient = new sqlite3.Database('test');
    registerMocks(this._sqliteClient);
  }
  restore() {
    // cleanup sqlite3 mock
    jest.clearAllMocks();
  }
}

export function defaultSQLiteMockRegistration(sqliteClient: sqlite3.Database) {
  (sqliteClient.run as unknown as jest.Mock).mockImplementation(
    (query: string, callback: (result: unknown, err: Error | null) => void) =>
      callback('Success', null),
  );
}
