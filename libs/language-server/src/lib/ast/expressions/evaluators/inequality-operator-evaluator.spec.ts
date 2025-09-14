// SPDX-FileCopyrightText: 2025 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import {
  InvalidValue,
  MissingValue,
  type InternalErrorValueRepresentation,
} from '../internal-value-representation';
import { executeExpressionTestHelper } from '../test-utils';

async function executeErrorValueComparison(
  a: InternalErrorValueRepresentation,
  b: 'invalid' | 'missing',
) {
  return executeExpressionTestHelper(
    `inputValue != ${b}`,
    'inputValue',
    'text',
    a,
    'boolean',
  );
}

describe('The inequality operator', () => {
  it('should compare invalid values correctly', async () => {
    let result = await executeErrorValueComparison(
      new InvalidValue(''),
      'invalid',
    );
    expect(result).toBe(false);

    result = await executeErrorValueComparison(new MissingValue(''), 'invalid');
    expect(result).toBe(true);
  });

  it('should compare missing values correctly', async () => {
    let result = await executeErrorValueComparison(
      new MissingValue(''),
      'missing',
    );
    expect(result).toBe(false);

    result = await executeErrorValueComparison(new InvalidValue(''), 'missing');
    expect(result).toBe(true);
  });
});
