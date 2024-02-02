// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { BlockExecutorMock } from '@jvalue/jayvee-execution/test';
import * as nock from 'nock';

export class HttpExtractorExecutorMock implements BlockExecutorMock {
  private _nockScopes: Array<nock.Scope> = [];

  get nockScopes(): Array<nock.Scope> {
    return this._nockScopes;
  }

  setup(registerMocks: () => Array<nock.Scope>) {
    // setup nock
    if (!nock.isActive()) {
      nock.activate();
    }
    this._nockScopes = registerMocks();
  }
  restore() {
    // cleanup nock interceptors and scopes
    nock.restore();
    this._nockScopes = [];
  }
}
