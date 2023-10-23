// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import JSDOMEnvironment from 'jest-environment-jsdom';

// https://github.com/jsdom/jsdom/issues/3363
export default class FixJSDOMEnvironment extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args);

    this.global.structuredClone = structuredClone;
  }
}
