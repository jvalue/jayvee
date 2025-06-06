// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { executeExpressionTestHelper } from '../test-utils';

describe('The lengthof operator', () => {
  it('should determine the length of a string successfully', async () => {
    const testString = 'someString';
    const result = await executeExpressionTestHelper(
      'lengthof inputValue',
      'inputValue',
      'text',
      testString,
      'integer',
    );

    expect(result).toBe(testString.length);
  });

  it('should determine the length of a collection successfully', async () => {
    const result = await executeExpressionTestHelper(
      `lengthof [1, 353, 23]`,
      'inputValue',
      'text',
      'irrelevant',
      'integer',
    );

    expect(result).toBe(3);
  });
});
