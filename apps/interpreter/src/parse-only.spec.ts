// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as process from 'process';
import { runAction } from './run-action';
import { RunOptions } from '@jvalue/jayvee-interpreter-lib';
import * as path from 'path';

describe('Parse Only', () => {
  const baseDir = path.resolve(__dirname, '../../../example/');

  const defaultOptions: RunOptions = {
    env: new Map<string, string>(),
    debug: false,
    debugGranularity: 'minimal',
    debugTarget: undefined,
    parseOnly: true,
  };

  beforeEach(() => {
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error();
    });
  });

  it('should exit with 0 on a valid option', async () => {
    await expect(
      runAction(path.resolve(baseDir, 'cars.jv'), {
        ...defaultOptions,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should exit with 1 on error', async () => {
    await expect(
      runAction(path.resolve(baseDir, 'cars.jv'), {
        ...defaultOptions,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
