// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  PropertyBody,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import { validatePropertyBody } from '../../../lib/validation/checks/property-body';
import {
  ParseHelperOptions,
  extractPropertyBodyFromBlock,
  parseHelper,
  validationAcceptorMockImpl,
} from '../../utils';

describe('property-body validation tests', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const validationAcceptorMock = jest.fn(validationAcceptorMockImpl);

  beforeAll(() => {
    // Register std extension
    useExtension(new StdLangExtension());
    // Create language services
    const services = createJayveeServices(NodeFileSystem).Jayvee;
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  afterEach(() => {
    // Reset mock
    validationAcceptorMock.mockReset();
  });

  it('error on missing properties', async () => {
    const text = `
    pipeline Test {
      block CarsExtractor oftype HttpExtractor {
      }
    }
    `;

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The following required properties are missing: "url"`,
      expect.any(Object),
    );
  });

  it('should have no error on missing properties with default values', async () => {
    const text = `
    pipeline Test {
      block CarsLoader oftype SQLiteLoader {
        table: "Cars";
        file: "./cars.sqlite";
      }
    }
    `;

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  // TODO
  // - validatePropertyAssignment
  //    -> test with a RuntimeParameterLiteral
  // - checkCustomPropertyValidation

  it('error on invalid property name', async () => {
    const text = `
    pipeline Test {
      block CarsExtractor oftype HttpExtractor {
        url: "test";
        name: "teste";
      }
    }
    `;

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Invalid property name "name".`,
      expect.any(Object),
    );
  });

  describe('runtime parameter for property', () => {
    // TODO test that for all forbidden types:
    // - constraint
    // TODO SHOULD THIS REALLY BE TESTED HERE?!?!?!?
    // -> IDEA: just test for one and in valuetype tests test if isAllowedAsRuntimeParameter returns expected value
    it('should have no error on runtime parameter for text property', async () => {
      const text = `
      pipeline Test {
        block GasReserveLoader oftype PostgresLoader {
          host: requires DB_HOST;
          port: requires DB_PORT;
          username: requires DB_USERNAME;
          password: requires DB_PASSWORD;
          database: requires DB_DATABASE;
          table: requires DB_TABLE;
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);

      validatePropertyBody(
        propertyBody,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
    });

    it('error on runtime parameter for regex property', async () => {
      const text = `
      pipeline Test {
        block CarsTextFileInterpreter oftype TextFileInterpreter {
          lineBreak: requires LINE_BREAK;
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);

      validatePropertyBody(
        propertyBody,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Runtime parameters are not allowed for properties of type regex`,
        expect.any(Object),
      );
    });

    it('error on runtime parameter for cell-range property', async () => {
      const text = `
      pipeline Test {
        block NameHeaderWriter oftype CellWriter {
          at: requires AT;
          write: ["name"];
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);

      validatePropertyBody(
        propertyBody,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Runtime parameters are not allowed for properties of type cellRange`,
        expect.any(Object),
      );
    });

    it('error on runtime parameter for collection property', async () => {
      const text = `
      pipeline Test {
        block NameHeaderWriter oftype CellWriter {
          at: cell A1;
          write: requires WRITE;
        }
      }
      `;

      const parseResult = await parse(text);

      const propertyBody: PropertyBody =
        extractPropertyBodyFromBlock(parseResult);

      validatePropertyBody(
        propertyBody,
        new ValidationContext(validationAcceptorMock),
      );

      expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
      expect(validationAcceptorMock).toHaveBeenCalledWith(
        'error',
        `Runtime parameters are not allowed for properties of type collection`,
        expect.any(Object),
      );
    });
  });

  it('error on invalid property typing', async () => {
    const text = `
    pipeline Test {
      block CarsExtractor oftype HttpExtractor {
        url: 2;
      }
    }
    `;

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `The value needs to be of type text but is of type integer`,
      expect.any(Object),
    );
  });

  it('info on simplifiable property expression', async () => {
    const text = `
    pipeline Test {
      block GasReserveLoader oftype PostgresLoader {
        host: requires DB_HOST;
        port: 345 + 674;
        username: requires DB_USERNAME;
        password: requires DB_PASSWORD;
        database: requires DB_DATABASE;
        table: requires DB_TABLE;
      }
    }
    `;

    const parseResult = await parse(text);

    const propertyBody: PropertyBody =
      extractPropertyBodyFromBlock(parseResult);

    validatePropertyBody(
      propertyBody,
      new ValidationContext(validationAcceptorMock),
    );

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'info',
      `The expression can be simplified to 1019`,
      expect.any(Object),
    );
  });
});
