// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { executeDefaultTextToTextExpression } from '../test-utils';

describe('The lowercase operator', () => {
  it('should lowercase alphabetic characters successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'lowercase inputValue',
      'Hello, World!',
    );

    expect(result).toEqual('hello, world!');
  });
});
