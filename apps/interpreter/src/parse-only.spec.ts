// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'node:fs';
import * as path from 'path';
import * as process from 'process';

import {
  type RunOptions,
  interpretModel,
  interpretString,
} from '@jvalue/jayvee-interpreter-lib';

import { runAction } from './run-action';

jest.mock('@jvalue/jayvee-interpreter-lib', () => {
  const original: object = jest.requireActual('@jvalue/jayvee-interpreter-lib');
  return {
    ...original,
    interpretModel: jest.fn(),
    interpretString: jest.fn(),
  };
});

describe('Parse Only', () => {
  const pathToValidModel = path.resolve(__dirname, '../../../example/cars.jv');
  const pathToInvalidModel = path.resolve(
    __dirname,
    '../test/assets/broken-model.jv',
  );

  const defaultOptions: RunOptions = {
    env: new Map<string, string>(),
    debug: false,
    debugGranularity: 'minimal',
    debugTarget: undefined,
  };

  afterEach(() => {
    // Assert that model is not executed
    expect(interpretString).not.toBeCalled();
    expect(interpretModel).not.toBeCalled();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error();
    });
  });

  it('should exit with 0 on a valid option', async () => {
    await expect(
      runAction(pathToValidModel, {
        ...defaultOptions,
        parseOnly: true,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should exit with 1 on error', async () => {
    expect(fs.existsSync(pathToInvalidModel)).toBe(true);

    await expect(
      runAction(pathToInvalidModel, {
        ...defaultOptions,
        parseOnly: true,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
