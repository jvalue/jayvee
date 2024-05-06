// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import assert from 'assert';

import { type BlockExecutorMock } from '@jvalue/jayvee-execution/test';
import pg from 'pg';
import { type Mock, type Mocked, vi } from 'vitest';

const { Client } = pg; // work around import issue with ESM

type MockedPgClient = Mocked<typeof Client>;

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
    this._pgClient = new Client() as unknown as MockedPgClient;
    registerMocks(this._pgClient);
  }
  restore() {
    // cleanup pg mock
    vi.clearAllMocks();
  }
}

export function defaultPostgresMockRegistration(pgClient: MockedPgClient) {
  (pgClient.query as Mock).mockResolvedValue('Success');
}
