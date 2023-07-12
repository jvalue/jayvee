// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import assert = require('assert');

import { BlockExecutorMock } from '@jvalue/jayvee-execution/test';
import * as nock from 'nock';

export class HttpExtractorExecutorMock implements BlockExecutorMock {
  private _nockInterceptor: nock.Interceptor | undefined;
  private _nockScopes: Array<nock.Scope> = [];

  get nockInterceptor(): nock.Interceptor {
    assert(
      this._nockInterceptor !== undefined,
      'Nock not initialized - please call setup(...) first!',
    );
    return this._nockInterceptor;
  }

  get nockScopes(): Array<nock.Scope> {
    return this._nockScopes;
  }

  setup(
    host: string,
    path: string,
    registerMocks: (nockInterceptor: nock.Interceptor) => Array<nock.Scope>,
  ) {
    // setup nock
    if (!nock.isActive()) nock.activate();
    this._nockInterceptor = nock(host).get(path);
    this._nockScopes = registerMocks(this._nockInterceptor);
  }
  restore() {
    // cleanup nock interceptors and scopes
    nock.restore();
    this._nockScopes = [];
  }
}
