// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { executeDefaultTextToTextExpression } from '../test-utils';

describe('The if operator', () => {
  it('should return the first expression if the condition is true', async () => {
    const result = await executeDefaultTextToTextExpression(
      'inputValue if true else "else branch"',
      'then branch',
    );

    expect(result).toEqual('then branch');
  });

  it('should return the second expression if the condition is false', async () => {
    const result = await executeDefaultTextToTextExpression(
      'inputValue if false else "else branch"',
      'then branch',
    );

    expect(result).toEqual('else branch');
  });
});
