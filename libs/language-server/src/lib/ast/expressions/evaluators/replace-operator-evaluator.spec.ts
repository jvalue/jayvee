// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest';

import { executeDefaultTextToTextExpression } from '../test-utils.js';

describe('The replace operator', () => {
  it('should replace text successfully', async () => {
    const result = await executeDefaultTextToTextExpression(
      "inputValue replace /Test/ with 'World'",
      'Hello Test',
    );

    expect(result).toEqual('Hello World');
  });

  it('should be able to replace text with nothing', async () => {
    const result = await executeDefaultTextToTextExpression(
      "inputValue replace / Test/ with ''",
      'Hello Test',
    );

    expect(result).toEqual('Hello');
  });
});
