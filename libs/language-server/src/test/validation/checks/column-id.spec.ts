// eslint-disable-next-line @nrwl/nx/enforce-module-boundaries
import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { AstNode, LangiumDocument } from 'langium';
import { NodeFileSystem } from 'langium/node';

import {
  ColumnId,
  ValidationContext,
  createJayveeServices,
  useExtension,
} from '../../../lib';
import { validateColumnId } from '../../../lib/validation/checks/column-id';
import {
  ParseHelperOptions,
  extractColumnIdFromBlockProperty,
  parseHelper,
  validationAcceptorMockImpl,
} from '../../utils';

describe('column-id validation tests', () => {
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

  it('should have no error if denoted with capital letter', async () => {
    const text = `
      pipeline Test {
        block Test oftype HttpExtractor {
          url: column TEST;
        }
      }
      `;

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('should have no error if denoted with *', async () => {
    const text = `
      pipeline Test {
        block Test oftype HttpExtractor {
          url: column *;
        }
      }
      `;

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(0);
  });

  it('error on lower case denotion', async () => {
    const text = `
      pipeline Test {
        block Test oftype HttpExtractor {
          url: column test;
        }
      }
      `;

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });

  it('error on camel case', async () => {
    const text = `
      pipeline Test {
        block Test oftype HttpExtractor {
          url: column testTest;
        }
      }
      `;

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });

  it('error on snake case', async () => {
    const text = `
      pipeline Test {
        block Test oftype HttpExtractor {
          url: column test_test;
        }
      }
      `;

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });

  it('error on pascal case', async () => {
    const text = `
      pipeline Test {
        block Test oftype HttpExtractor {
          url: column TestTest;
        }
      }
      `;

    const parseResult = await parse(text);

    const columnId: ColumnId = extractColumnIdFromBlockProperty(parseResult);

    validateColumnId(columnId, new ValidationContext(validationAcceptorMock));

    expect(validationAcceptorMock).toHaveBeenCalledTimes(1);
    expect(validationAcceptorMock).toHaveBeenCalledWith(
      'error',
      `Columns need to be denoted via capital letters or the * character`,
      expect.any(Object),
    );
  });
});
