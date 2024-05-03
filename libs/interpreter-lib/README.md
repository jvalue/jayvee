<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# Jayvee interpreter Library

This library can be used to interpret a Jayvee model. For example, the [interpreter app](/apps/interpreter/) uses this library after parsing the command line input.

## Example Usage

For interpreting a string, you can simply use the method 
```javascript
interpretString(
  modelString,  // string
  options,      // RunOptions
)
```

If you want to interpret anything else, you need to define a function that instantiates the `JayveeModel`, e.g., from a file: 
```javascript
const extractAstNodeFn = async (
    services: JayveeServices,
    loggerFactory: LoggerFactory,
  ) =>
    await extractAstNodeFromFile<JayveeModel>(
        fileName,
        services,
        loggerFactory.createLogger(),
    );
const exitCode = await interpretModel(extractAstNodeFn, options);
```

## Building

Run `nx build interpreter-lib` to build the library.

## Running unit tests

Run `nx test interpreter-lib` to execute the unit tests via [vitest](https://vitest.dev).
