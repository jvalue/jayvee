// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as R from '@jvalue/jayvee-execution';
import {
  createBinaryFileFromLocalFile,
  getTestExecutionContext,
} from '@jvalue/jayvee-execution/test';
import {
  type BlockDefinition,
  IOType,
  type JayveeServices,
  createJayveeServices,
} from '@jvalue/jayvee-language-server';
import {
  type ParseHelperOptions,
  expectNoParserAndLexerErrors,
  loadTestExtensions,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import {
  type AstNode,
  type AstNodeLocator,
  type LangiumDocument,
} from 'langium';
import { NodeFileSystem } from 'langium/node';

import { GtfsRTInterpreterExecutor } from './gtfs-rt-interpreter-executor';

describe('Validation of GtfsRTInterpreterExecutor', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  let locator: AstNodeLocator;
  let services: JayveeServices;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../test/assets/gtfs-rt-interpreter-executor/',
  );

  function readTestFile(fileName: string): R.BinaryFile {
    const absoluteFileName = path.resolve(
      __dirname,
      '../test/assets/gtfs-rt-interpreter-executor/gtfs/',
      fileName,
    );
    return createBinaryFileFromLocalFile(absoluteFileName);
  }

  async function parseAndExecuteExecutor(
    input: string,
    IOInput: R.BinaryFile,
  ): Promise<R.Result<R.Sheet>> {
    const document = await parse(input, { validationChecks: 'all' });
    expectNoParserAndLexerErrors(document);

    const block = locator.getAstNode<BlockDefinition>(
      document.parseResult.value,
      'pipelines@0/blocks@1',
    ) as BlockDefinition;

    return new GtfsRTInterpreterExecutor().doExecute(
      IOInput,
      getTestExecutionContext(locator, document, services, [block]),
    );
  }

  beforeAll(async () => {
    // Create language services
    services = createJayveeServices(NodeFileSystem).Jayvee;
    await loadTestExtensions(services, [
      path.resolve(__dirname, '../test/test-extension/TestBlockTypes.jv'),
    ]);
    locator = services.workspace.AstNodeLocator;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  it('should diagnose no error on valid trip update gtfs file', async () => {
    const text = readJvTestAsset('valid-trip-update-gtfs-interpreter.jv');

    const testFile = readTestFile('valid-trip-update');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(10);
      expect(result.right.getNumberOfRows()).toEqual(23);
      expect(result.right.getData()[0]).toContain(
        'entity.trip_update.trip.trip_id',
      );
    }
  });

  it('should diagnose no error on valid alert gtfs file', async () => {
    const text = readJvTestAsset('valid-alerts-gtfs-interpreter.jv');

    const testFile = readTestFile('valid-alerts.json');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(7);
      expect(result.right.getNumberOfRows()).toEqual(2);
      expect(result.right.getData()[0]).toContain(
        'entity.alert.informed_entity.route_id',
      );
    }
  });

  it('should diagnose no error on valid vehicle gtfs file', async () => {
    const text = readJvTestAsset('valid-vehicle-gtfs-interpreter.jv');

    const testFile = readTestFile('valid-vehicle');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(10);
      expect(result.right.getNumberOfRows()).toEqual(2);
      expect(result.right.getData()[0]).toContain(
        'entity.vehicle_position.vehicle_descriptor.id',
      );
    }
  });

  it('should diagnose no error on wrong gtfs file for specified entity parameter', async () => {
    const text = readJvTestAsset('valid-trip-update-gtfs-interpreter.jv');

    const testFile = readTestFile('valid-alerts.json');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isErr(result)).toEqual(false);
    if (R.isOk(result)) {
      expect(result.right.ioType).toEqual(IOType.SHEET);
      expect(result.right.getNumberOfColumns()).toEqual(10);
      expect(result.right.getNumberOfRows()).toEqual(1); // only header row
    }
  });

  it('should diagnose error on invalid entity parameter', async () => {
    const text = readJvTestAsset('invalid-entity-parameter.jv');

    const testFile = readTestFile('valid-trip-update');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Entity invalid not allowed for block GtfsRTInterpreterblock, expected "trip_update", "alert" or "vehicle".',
      );
    }
  });

  it('should diagnose error on invalid gtfs file input', async () => {
    const text = readJvTestAsset('invalid-entity-parameter.jv');

    const testFile = readTestFile('invalid-gtfs');
    const result = await parseAndExecuteExecutor(text, testFile);

    expect(R.isOk(result)).toEqual(false);
    if (R.isErr(result)) {
      expect(result.left.message).toEqual(
        'Failed to decode gtfs file: invalid wire type 4 at offset 1',
      );
    }
  });
});
