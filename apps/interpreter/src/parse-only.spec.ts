// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { type JayveeInterpreter } from '@jvalue/jayvee-interpreter-lib';

import { runAction } from './run-action';
import { type RunOptions } from './run-options';

const interpreterMock: JayveeInterpreter = {
  interpretModel: vi.fn(),
  interpretFile: vi.fn(),
  interpretString: vi.fn(),
  parseModel: vi.fn(),
};

vi.stubGlobal('DefaultJayveeInterpreter', interpreterMock);

const dirPathOfThisTest = path.dirname(fileURLToPath(import.meta.url));
const pathExamplesRelativeToThisTest = path.join('..', '..', '..', 'example');

// simulate as if we were starting the jv cli in the example dir
vi.mock('./current-dir', () => {
  const currentDirMock = () =>
    path.join(dirPathOfThisTest, pathExamplesRelativeToThisTest);
  return {
    getCurrentDir: currentDirMock,
  };
});

describe('Parse Only', () => {
  const pathToValidModelFromExamplesDir = 'cars.jv';
  const pathToInvalidModelFromExamplesDir = path.join(
    '..',
    'apps',
    'interpreter',
    'test',
    'assets',
    'broken-model.jv',
  );

  const defaultOptions: RunOptions = {
    pipeline: '.*',
    env: new Map<string, string>(),
    debug: false,
    debugGranularity: 'minimal',
    debugTarget: 'all',
    parseOnly: false,
  };

  afterEach(() => {
    // Assert that model is not executed
    expect(interpreterMock.interpretString).not.toBeCalled();
    expect(interpreterMock.interpretModel).not.toBeCalled();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error();
    });
  });

  it('should exit with 0 on a valid option', async () => {
    await expect(
      runAction(pathToValidModelFromExamplesDir, {
        ...defaultOptions,
        parseOnly: true,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(0);
  });

  it('should exit with 1 on error', async () => {
    const modelPathRelativeToThisTest = path.join(
      dirPathOfThisTest,
      pathExamplesRelativeToThisTest,
      pathToInvalidModelFromExamplesDir,
    );
    expect(fs.existsSync(modelPathRelativeToThisTest)).toBe(true);

    await expect(
      runAction(pathToInvalidModelFromExamplesDir, {
        ...defaultOptions,
        parseOnly: true,
      }),
    ).rejects.toBeDefined();

    expect(process.exit).toBeCalledTimes(1);
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
