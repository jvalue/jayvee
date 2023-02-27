# Jayvee

## Projects overview

| Name                                                              | Description                                                                                                                      |
|-------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| [`language-server`](./libs/language-server)                       | Jayvee language definition and language server implementation                                                                    |
| [`interpreter`](./apps/interpreter)                               | Command line tool for interpreting Jayvee files                                                                                  |
| [`language-server-web-worker`](./apps/language-server-web-worker) | Ready-to-use Jayvee language server, bundled as a [Web Worker](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API) |
| [`vs-code-extension`](./apps/vs-code-extension)                   | Visual Studio Code extension for editing Jayvee files                                                                            |
| [`docs`](./apps/docs)                                             | Website for Jayvee user documentation                                                                                            |
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

## Using Jayvee in VS Code

To set up Jayvee locally in VS Code, you need to install the latest Jayvee VS Code extension and the Jayvee interpreter.

To install the most recent extension, go to our [latest release](https://github.com/jvalue/jayvee/releases/latest) 
and download the `jayvee.vsix` file from the release assets.
Next, go to [this page](https://code.visualstudio.com/docs/editor/extension-marketplace#_install-from-a-vsix) and 
follow the instructions for installing the downloaded extension.

For globally installing the latest version of the Jayvee interpreter,
see [here](./apps/interpreter/README.md#actual-installation).

## Documentation

**User documentation** and **developer documentation** can be found in our `docs` project.
Start the documentation app locally and open the browser on the URL of the output:
```bash
npx nx serve docs
```


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

#### Load GTFS data into SQLite db

```bash
npm run example:gtfs
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
