# Jayvee

## Projects overview

| Name                                                              | Description                                                                                                                      |
|-------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| [`language-server`](./libs/language-server)                       | Jayvee language definition and language server implementation                                                                    |
| [`interpreter`](./apps/interpreter)                               | Command line tool for interpreting Jayvee files                                                                                  |
| [`language-server-web-worker`](./apps/language-server-web-worker) | Ready-to-use Jayvee language server, bundled as a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) |
| [`vs-code-extension`](./apps/vs-code-extension)                   | Visual Studio Code extension for editing Jayvee files                                                                            |
| [`monaco-editor`](./libs/monaco-editor)                           | React component for editing Jayvee files                                                                                         |
| [`execution`](./libs/execution)                                   | Shared code for Jayvee extensions and the interpreter                                                                            |
| [`extensions/std`](./libs/extensions/std)                         | Standard Jayvee extension consisting of the extensions below                                                                     |
| [`extensions/rdbms`](./libs/extensions/rdbms)                     | Jayvee extension for relational databases                                                                                        |
| [`extensions/tabular`](./libs/extensions/tabular)                 | Jayvee extension for tabular data                                                                                                |

## Quick start

1. Run `npm ci` to install the dependencies.
2. Run `npm run generate` to generate TypeScript code from the Jayvee grammar definition.
3. Run `npm run build` to compile all projects.
4. In Visual Studio Code, press `F5` to open a new window with the Jayvee extension loaded.
5. Create a new file with a `.jv` file name suffix or open an existing file in the directory `example`.
6. Verify that syntax highlighting, validation, completion etc. are working as expected.
7. Run `node dist/apps/interpreter/main.js` to see options for the CLI of the interpreter; `node dist/apps/interpreter/main.js <file>` interprets a given `.jv` file.

In case you run into problems, make sure to use the current LTS version of Node.js and npm.


## Language Design Process

We use RFCs to discuss changes to the language before implementing them. You can have a look at all closed (accepted / rejected) RFCs [here](https://github.com/jvalue/jayvee/pulls?q=is%3Apr+is%3Aclosed+RFC+), and all RFCs under discussion [here](https://github.com/jvalue/jayvee/pulls?q=is%3Apr+is%3Aopen+RFC).

If you want to contribute a RFC please follow these steps:
1. Make a copy of the [template](./rfc/0000-rfc-template.md) and place it into the `rfc` folder.
2. Create a draft for the RFC on a new branch. Follow the `TODOs` in template to do so.
3. Open a pull request with appendix `RFC <number>` in the title.
4. Address the reviews. Consider opening a new PR if major things need to be addressed and the discussion log becomes too confusing.
5. Once accepted, create an issue with the necessary steps to implement the RFC.


## Development

### Building all projects

```bash
npm run build
```

### Linting all projects

```bash
npm run lint
```

### Formatting project files via Nx

```bash
npm run format
```

### Testing all projects

```bash
npm run test
```

### Generating TypeScript code from the grammar definition

```bash
npm run generate
```

### Examples

#### Load data about cars into a local SQLite db

```bash
npm run example:cars
```

#### Load data about german gas reserves into a postgres database

1. Start postgres database

```bash
docker compose -f ./example/docker-compose.example.yml up
```

2. Run example

```bash
npm run example:gas
```
