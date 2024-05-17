// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { type InternalValueRepresentation } from '..';
import { executeDefaultTextToTextExpression } from '../test-utils';

async function expectSuccess<I extends InternalValueRepresentation>(
  op: string,
  input: string,
  expected: I,
) {
  let result: InternalValueRepresentation | undefined = undefined;
  try {
    result = await executeDefaultTextToTextExpression(
      `${op} inputValue`,
      input,
    );
  } finally {
    expect(result).toEqual(expected);
  }
}

async function expectError(op: string, input: string) {
  let result: InternalValueRepresentation | undefined = undefined;
  try {
    result = await executeDefaultTextToTextExpression(
      `${op} inputValue`,
      input,
    );
  } catch {
    result = undefined;
  } finally {
    expect(result).toBeUndefined();
  }
}

describe('The asText operator', () => {
  it('should parse text successfully', async () => {
    await expectSuccess('asText', 'someText', 'someText');
  });
});

describe('The asDecimal operator', () => {
  it('should parse positive decimals successfully', async () => {
    await expectSuccess('asDecimal', '1.6', 1.6);
  });

  it('should parse decimals with commas successfully', async () => {
    await expectSuccess('asDecimal', '1,6', 1.6);
  });

  it('should parse negative decimals with commas successfully', async () => {
    await expectSuccess('asDecimal', '-1,6', -1.6);
  });
});

describe('The asInteger operator', () => {
  it('should parse positive integers successfully', async () => {
    await expectSuccess('asInteger', '32', 32);
  });

  it('should parse negative integers successfully', async () => {
    await expectSuccess('asInteger', '-1', -1);
  });

  it('should fail with decimal values', async () => {
    await expectError('asInteger', '32.5');
  });
});

describe('The asBoolean operator', () => {
  it('should parse true and True successfully', async () => {
    await expectSuccess('asBoolean', 'true', true);
    await expectSuccess('asBoolean', 'True', true);
  });

  it('should parse false and False successfully', async () => {
    await expectSuccess('asBoolean', 'false', false);
    await expectSuccess('asBoolean', 'False', false);
  });

  it('should fail with 0 and 1', async () => {
    await expectError('asBoolean', '0');
    await expectError('asBoolean', '1');
  });

  it('should fail on a arbitrary string', async () => {
    await expectError('asBoolean', 'notABoolean');
  });
});
