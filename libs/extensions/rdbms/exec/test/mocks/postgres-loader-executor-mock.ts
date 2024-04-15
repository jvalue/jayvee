// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as assert from 'assert';

import { type BlockExecutorMock } from '@jvalue/jayvee-execution/test';
import { Client } from 'pg';

type MockedPgClient = jest.Mocked<Client>;

export class PostgresLoaderExecutorMock implements BlockExecutorMock {
  private _pgClient: MockedPgClient | undefined;

  get pgClient(): MockedPgClient {
    assert(
      this._pgClient !== undefined,
      'Client not initialized - please call setup() first!',
    );
    return this._pgClient;
  }

  setup(
    registerMocks: (
      pgClient: MockedPgClient,
    ) => void = defaultPostgresMockRegistration,
  ) {
    // setup pg mock
    this._pgClient = new Client() as MockedPgClient;
    registerMocks(this._pgClient);
  }
  restore() {
    // cleanup pg mock
    jest.clearAllMocks();
  }
}

export function defaultPostgresMockRegistration(pgClient: MockedPgClient) {
  (pgClient.query as jest.Mock).mockResolvedValue('Success');
}
