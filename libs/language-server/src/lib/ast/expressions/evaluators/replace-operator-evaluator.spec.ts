// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { executeExpressionTestHelper } from '../test-utils';

describe('The replace operator', () => {
  it('should replace text successfully', async () => {
    const result = await executeExpressionTestHelper(
      "inputValue replace /test/ with 'works'",
      'inputValue',
      'test',
    );

    expect(result).toEqual('test');
  });
});
