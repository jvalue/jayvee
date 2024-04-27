// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { executeDefaultTextToTextExpression } from '../test-utils';

describe('The asText operator', () => {
  it('should parse text successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asText inputValue',
      'someText',
    );

    expect(result).toEqual('someText');
  });
});

describe('The asDecimal operator', () => {
  it('should parse positive decimals successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asDecimal inputValue',
      '1.6',
    );

    expect(result).toEqual(1.6);
  });

  it('should parse decimals with commas successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asDecimal inputValue',
      '1,6',
    );

    expect(result).toEqual(1.6);
  });

  it('should parse negative decimals with commas successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asDecimal inputValue',
      '-1,6',
    );

    expect(result).toEqual(-1.6);
  });
});

describe('The asInteger operator', () => {
  it('should parse positive integers successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asInteger inputValue',
      '32',
    );

    expect(result).toEqual(32);
  });

  it('should parse negative integers successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asInteger inputValue',
      '-1',
    );

    expect(result).toEqual(-1);
  });

  it('should fail with decimal values', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asInteger inputValue',
      '32.5',
    );

    expect(result).toEqual(undefined);
  });
});

describe('The asBoolean operator', () => {
  it('should parse true and True successfully', async () => {
    let result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      'true',
    );

    expect(result).toEqual(true);

    result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      'True',
    );

    expect(result).toEqual(true);
  });

  it('should parse false and False successfully', async () => {
    let result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      'false',
    );

    expect(result).toEqual(false);

    result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      'False',
    );

    expect(result).toEqual(false);
  });

  it('should fail with 0 and 1', async () => {
    let result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      '0',
    );

    expect(result).toEqual(undefined);

    result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      '1',
    );

    expect(result).toEqual(undefined);
  });

  it('should fail on a random string', async () => {
    const result = await executeDefaultTextToTextExpression(
      'asBoolean inputValue',
      'notABoolean',
    );

    expect(result).toEqual(undefined);
  });
});
