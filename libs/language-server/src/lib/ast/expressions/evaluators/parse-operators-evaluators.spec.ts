// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { assertUnreachable } from 'langium';

import {
  ERROR_TYPEGUARD,
  INVALID_TYPEGUARD,
  type InternalErrorRepresentation,
  type InternalValueRepresentation,
  InvalidError,
  MISSING_TYPEGUARD,
  MissingError,
} from '..';
import { executeDefaultTextToTextExpression } from '../test-utils';

async function expectResult(
  op: string,
  input: string,
  expected: InternalValueRepresentation,
): Promise<void>;
async function expectResult(
  op: string,
  input: string,
  expected: InternalErrorRepresentation,
): Promise<void>;
async function expectResult(
  op: string,
  input: string,
  expected: InternalValueRepresentation | InternalErrorRepresentation,
) {
  const result = await executeDefaultTextToTextExpression(
    `${op} inputValue`,
    input,
  );
  if (ERROR_TYPEGUARD(expected)) {
    if (INVALID_TYPEGUARD(expected)) {
      expect(result).toBeInstanceOf(InvalidError);
      assert(result instanceof InvalidError);
      expect(result.message).toBe(expected.message);
    } else if (MISSING_TYPEGUARD(expected)) {
      expect(result).toBeInstanceOf(MissingError);
      assert(result instanceof MissingError);
      expect(result.message).toBe(expected.message);
    } else {
      assertUnreachable(expected);
    }
  } else {
    expect(result).toStrictEqual(expected);
  }
}

describe('The asText operator', () => {
  it('should parse text successfully', async () => {
    await expectResult('asText', 'someText', 'someText');
  });
});

describe('The asDecimal operator', () => {
  it('should parse positive decimals successfully', async () => {
    await expectResult('asDecimal', '1.6', 1.6);
  });

  it('should parse decimals with commas successfully', async () => {
    await expectResult('asDecimal', '1,6', 1.6);
  });

  it('should parse negative decimals with commas successfully', async () => {
    await expectResult('asDecimal', '-1,6', -1.6);
  });
});

describe('The asInteger operator', () => {
  it('should parse positive integers successfully', async () => {
    await expectResult('asInteger', '32', 32);
  });

  it('should parse negative integers successfully', async () => {
    await expectResult('asInteger', '-1', -1);
  });

  it('should fail with decimal values', async () => {
    await expectResult(
      'asInteger',
      '32.5',
      new InvalidError('32.5 is a decimal, not an integer'),
    );
  });
});

describe('The asBoolean operator', () => {
  it('should parse true and True successfully', async () => {
    await expectResult('asBoolean', 'true', true);
    await expectResult('asBoolean', 'True', true);
  });

  it('should parse false and False successfully', async () => {
    await expectResult('asBoolean', 'false', false);
    await expectResult('asBoolean', 'False', false);
  });

  it('should fail with 0 and 1', async () => {
    await expectResult(
      'asBoolean',
      '0',
      new InvalidError('"0" is not a boolean'),
    );
    await expectResult(
      'asBoolean',
      '1',
      new InvalidError('"1" is not a boolean'),
    );
  });

  it('should fail on a arbitrary string', async () => {
    await expectResult(
      'asBoolean',
      'notABoolean',
      new InvalidError('"notABoolean" is not a boolean'),
    );
  });
});
