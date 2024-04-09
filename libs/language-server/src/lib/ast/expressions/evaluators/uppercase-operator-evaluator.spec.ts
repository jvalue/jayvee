// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { executeDefaultTextToTextExpression } from '../test-utils';

describe('The uppercase operator', () => {
  it('should uppercase alphabetic characters successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'uppercase inputValue',
      'Hello, World!',
    );

    expect(result).toEqual('HELLO, WORLD!');
  });
});
