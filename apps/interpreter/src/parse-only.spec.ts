// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as fs from 'node:fs/promises';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';

import {
  clearBlockExecutorRegistry,
  clearConstraintExecutorRegistry,
} from '@jvalue/jayvee-execution/test';
import {
  RunOptions,
  interpretModel,
  interpretString,
} from '@jvalue/jayvee-interpreter-lib';

import { runAction } from './run-action';

jest.mock('@jvalue/jayvee-interpreter-lib', () => {
  const original: object = jest.requireActual('@jvalue/jayvee-interpreter-lib'); // Step 2.
  return {
    ...original,
    interpretModel: jest.fn(),
    interpretString: jest.fn(),
  };
});

describe('Parse Only', () => {
  const baseDir = path.resolve(__dirname, '../../../example/');
  const pathToValidModel = path.resolve(baseDir, 'cars.jv');

  const defaultOptions: RunOptions = {
    env: new Map<string, string>(),
    debug: false,
    debugGranularity: 'minimal',
    debugTarget: undefined,
  };

  let tempFile: string | undefined = undefined;

  afterEach(async () => {
    if (tempFile != null) {
      await fs.rm(tempFile);
      // eslint-disable-next-line require-atomic-updates
      tempFile = undefined;
    }
  });

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

    // Reset jayvee specific stuff
    clearBlockExecutorRegistry();
    clearConstraintExecutorRegistry();
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
    const validModel = (await fs.readFile(pathToValidModel)).toString();

    tempFile = path.resolve(
      os.tmpdir(),
      // E.g. "0.gn6v6ra9575" -> "gn6v6ra9575.jv"
      Math.random().toString(36).substring(2) + '.jv',
    );

    // Write a partial valid model in that file
    await fs.writeFile(tempFile, validModel.substring(validModel.length / 2));

    await expect(
      runAction(tempFile, {
        ...defaultOptions,
        parseOnly: true,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
