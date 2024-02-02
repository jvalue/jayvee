// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import JSDOMEnvironment from 'jest-environment-jsdom';

// @nx/jest/preset loads in jsdom environment which does not support a few node.js functions.
// This class adds these node.js functions.
export default class JSDOMEnvironmentFix extends JSDOMEnvironment {
  constructor(...args: ConstructorParameters<typeof JSDOMEnvironment>) {
    super(...args);

    // https://github.com/jsdom/jsdom/issues/3363
    this.global.structuredClone = structuredClone;
    // https://github.com/jestjs/jest/issues/11204
    // https://github.com/jestjs/jest/issues/12622
    this.global.setImmediate = setImmediate;
  }
}
