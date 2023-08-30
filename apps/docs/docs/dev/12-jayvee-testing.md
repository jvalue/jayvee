---
title: Writing tests for Jayvee
---

In order to ensure that Jayvee works as intended and to catch breaking changes, we have implemented the following components for regression testing:  
- Testing utils: utils to create Langium Typescript objects from *.jv test assets (see [here](#testing-utils)) as well as mocks for execution testing (see [here](#testing-utils-1))
- [Grammar tests](#grammar-tests): test the grammar parsing and validation
- [Execution tests](#execution-tests): test the execution of blocks

## Conventions
All of the existing tests follow these conventions:
1. The `<file-name>.spec.ts` file is located next to the `<file-name>.ts` file itself.
2. The `*.jv` assets are located inside a `test/assets/<file-name>` folder.
Take a look at one of the exisiting tests for more details.

## Grammar tests
These kind of tests are mainly located inside the [language-server](https://github.com/jvalue/jayvee/tree/main/libs/language-server) as well as the language parts of each extension (for example [std/lang](https://github.com/jvalue/jayvee/tree/main/libs/extensions/std/lang)).

### Testing utils
The testing utils are located inside the `language-server` in a dedicated [test folder](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/test).  
These utils can be imported using `@jvalue/jayvee-language-server/test` and contain the following parts:

[**langium-utils.ts**](https://github.com/jvalue/jayvee/blob/main/libs/language-server/src/test/langium-utils.ts):  
This utils file contains two functions: 
- `parseHelper` to simplify parsing the input (content of a *.jv file) and returning the corresponding `LangiumDocument`, and 
- `validationHelper` parse and validate the created document. 
They are kept in a separate file due to being copied from the Langium repository and thus subject to a different code license and copyright.

[**utils.ts**](https://github.com/jvalue/jayvee/blob/main/libs/language-server/src/test/utils.ts):  
This file contains custom testing utility utils functions, like `readJvTestAssetHelper` for reading jv test assets. 
Example:
``` ts
import * as path from 'path';

import { createJayveeServices } from '@jvalue/jayvee-language-server';
import {
  ParseHelperOptions,
  expectNoParserAndLexerErrors,
  parseHelper,
  readJvTestAssetHelper,
} from '@jvalue/jayvee-language-server/test';
import { AstNode, LangiumDocument } from 'langium';

describe('My example test', () => {
  let parse: (
    input: string,
    options?: ParseHelperOptions,
  ) => Promise<LangiumDocument<AstNode>>;

  const readJvTestAsset = readJvTestAssetHelper(
    __dirname,
    '../../test/assets/', // localized path to test assets folder
  );

  beforeAll(() => {
    // [...] register extensions etc
    const services = createJayveeServices(NodeFileSystem).Jayvee; // Or retrieve them if services already exist
    // Parse function for Jayvee (without validation)
    parse = parseHelper(services);
  });

  // [...]

  it('My dummy test', () => {
    const text = readJvTestAsset('<sub-folder>/<test-asset-name>.jv');

    const document = await parse(text);
    expectNoParserAndLexerErrors(document);
    // Rest of test
  });
});
```
If you want to simply validate the test assets, simply replace `parseHelper` with `validationHelper` (and adjust the types).  
You can find detailed documentation of all the utility functions directly in the code.

[**extension/**](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/test/extension):  
This folder contains a Jayvee extension for testing.  
If there are certain blocks required for testing a certain feature, they can be defined here.  
One such example is the already defined `TestProperty` block which has a multitude of different properties, each with a different type.  
This block is used for testing properties and property-assignments.  
The extension provides loader and extractor blocks for all IOTypes without any properties.  
These blocks are automatically generated at runtime with the following naming scheme:  
`Test${ioType}${io === 'input' ? 'Loader' : 'Extractor'}` (Example: `TestFileExtractor`).  
This allows for easy (grammar) testing of non loader/extractor blocks:
``` jv
pipeline Pipeline {

  TestExtractor -> BlockUnderTest -> TestLoader;

  block BlockUnderTest oftype CellWriter {
    at: range A1:A3;
    write: ['values', 'to', 'write'];
  }

  block TestExtractor oftype TestSheetExtractor { }
  block TestLoader oftype TestSheetLoader { }
}
```

### Existing tests
Currently there are already tests for the following parts:
- Language-server validation checks (located [here](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/lib/validation))
- Language-server constraint validation (located [here](https://github.com/jvalue/jayvee/tree/dev/libs/language-server/src/lib/constraint))
- Custom block (property) validation of the three existing extensions (std extension located [here](https://github.com/jvalue/jayvee/blob/dev/libs/extensions/std/lang/src))
- Grammar validation tests for all official full examples from the [/example](https://github.com/jvalue/jayvee/tree/main/example) folder (located [here](https://github.com/jvalue/jayvee/blob/dev/libs/extensions/std/lang/src/example-validation.spec.ts))
- Grammar validation tests for all block examples of the std extension (located [here](https://github.com/jvalue/jayvee/blob/dev/libs/extensions/std/lang/src/meta-inf-example-validation.spec.ts))

## Execution tests
These kind of tests are mainly located inside the [interpreter](https://github.com/jvalue/jayvee/tree/main/libs/language-server), the [interpreter-lib](https://github.com/jvalue/jayvee/tree/dev/libs/interpreter-lib), the [execution lib](https://github.com/jvalue/jayvee/tree/dev/libs/execution) as well as the execution parts of each extension (for example [std/exec](https://github.com/jvalue/jayvee/tree/main/libs/extensions/std/exec)).

### Testing utils
The testing utils for execution tests are spread between the extensions, with the interfaces and base utils located inside the [execution lib](https://github.com/jvalue/jayvee/tree/dev/libs/execution).  
They can be imported using `@jvalue/jayvee-extensions/rdbms/test`, `@jvalue/jayvee-extensions/std/test` and `@jvalue/jayvee-execution/test`.

[**utils.ts**](https://github.com/jvalue/jayvee/blob/dev/libs/execution/test/utils.ts):  
At the moment this only contains two functions: 
- `clearBlockExecutorRegistry` for clearing the registry containing all `BlockExecutor`s, and 
- `clearConstraintExecutorRegistry` clearing the corresponding `ConstraintExecutor`s registry. 
They are required in case the tested method initializes Jayvee itself (see [smoke test](#existing-tests-1)).

[**block-executor-mocks.ts**](https://github.com/jvalue/jayvee/blob/dev/libs/execution/test/block-executor-mock.ts):  
`BlockExecutorMock` interface for defining mocks for `AbstractBlockExecutor`. Generally only loader and executor blocks require mocks, because they interact with "the outside world" (i.e. `HttpExtractor` making http calls).  
Due to how vastly different each `BlockExecutor` can be, this interface is very simple, containing only a `setup(...args: unknown[])` and a `restore()` method. See below for existing implementations.

[**rdbms/exec/test**](https://github.com/jvalue/jayvee/tree/dev/libs/extensions/rdbms/exec/test):  
Contains the implementation of `BlockExecutorMock` for `PostgresLoaderExecutor` and `SQLiteLoaderExecutor`.  
Both of these executors are mocked using `jest.mock` to mock the corresponding libraries (`pg` and `sqlite3`)  
**Usage:**
``` ts
import {
  PostgresLoaderExecutorMock,
  SQLiteLoaderExecutorMock,
} from '@jvalue/jayvee-extensions/rdbms/test';

// Global mocking of external library at the top of test file required, 
// even though the mocking is encapsulated in helper classes
jest.mock('pg', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Client: jest.fn(() => mClient) };
});
jest.mock('sqlite3', () => {
  const mockDB = {
    close: jest.fn(),
    run: jest.fn(),
  };
  return { Database: jest.fn(() => mockDB) };
});

describe('Dummy describe', () => {
  // [...] 

  let postgresLoaderMock: PostgresLoaderExecutorMock;
  let sqliteLoaderMock: SQLiteLoaderExecutorMock;

  beforeAll(() => {
    postgresLoaderMock = new PostgresLoaderExecutorMock();
    sqliteLoaderMock = new SQLiteLoaderExecutorMock();
  });

  afterEach(() => {
    postgresLoaderMock.restore();
    sqliteLoaderMock.restore();
  });

  it('Dummy test', async () => {
    // Prepare mocks
    postgresLoaderMock.setup();
    sqliteLoaderMock.setup();

    // [...] execute test

    expect(postgresLoaderMock.pgClient.connect).toBeCalledTimes(1);
    expect(postgresLoaderMock.pgClient.query).toBeCalledTimes(1);
    expect(postgresLoaderMock.pgClient.end).toBeCalledTimes(1);
    expect(sqliteLoaderMock.sqliteClient.run).toBeCalledTimes(1);
    expect(sqliteLoaderMock.sqliteClient.close).toBeCalledTimes(1);
  });
});
```

[**std/exec/test/mocks**](https://github.com/jvalue/jayvee/tree/dev/libs/extensions/std/exec/test):  
Contains the implementation of `BlockExecutorMock` for `HttpExtractorExecutorMock`.  
This implementation uses [nock](https://www.npmjs.com/package/nock) for mocking HTTP(S) responses.  
The `setup` method is further specified requiring one parameter `registerMocks: () => Array<nock.Scope>`, which returns all used `nock.Scope` (i.e. the return value of `nock('<URL>')`), see usage below:  
**Usage:**
``` ts
import * as path from 'path';

import { HttpExtractorExecutorMock } from '@jvalue/jayvee-extensions/std/test';

describe('Dummy describe', () => {
  // [...]

  let httpExtractorMock: HttpExtractorExecutorMock;

  beforeAll(() => {
    httpExtractorMock = new HttpExtractorExecutorMock();
  });

  afterEach(() => {
    httpExtractorMock.restore();
  });

  it('should have no errors when executing gtfs-static-and-rt.jv example', async () => {
    // Prepare mocks
    httpExtractorMock.setup(() => {
      return [
        nock(
          '<URL_1>',
        )
          .get('<PATH>')
          .replyWithFile(
            200,
            path.resolve(__dirname, '../test/assets/file1.zip'),
            {
              'Content-Type': 'application/octet-stream',
            },
          ),
        nock('<URL_2>')
          .get('<PATH_1>')
          .replyWithFile(
            200,
            path.resolve(
              __dirname,
              '../test/assets/file2',
            ),
            {
              'Content-Type': 'application/octet-stream',
            },
          )
          .get('<PATH_2>')
          .reply(200, { content: "My dummy json reply." }),
      ];
    })

    // [...] execute test

    expect(httpExtractorMock.nockScopes.every((scope) => scope.isDone()));
  });
});
```

### Existing tests
Currently there are already tests for the following parts:
- Smoke test for official examples (located [here](https://github.com/jvalue/jayvee/blob/dev/apps/interpreter/src/examples-smoke-test.spec.ts))
