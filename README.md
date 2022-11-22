# Jayvee

## Projects overview

| Name                                                      | Description                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------- |
| [`language-server`](./libs/language-server/README.md)     | Jayvee language definition and language server implementation |
| [`vs-code-extension`](./apps/vs-code-extension/README.md) | Visual Studio Code extension for the language                 |
| [`interpreter`](./apps/interpreter/README.md)             | Command line tool for interpreting `.jv` files                |

## Quick start

1. Run `npm ci` to install the dependencies.
2. Run `npm run generate` to generate TypeScript code from the Jayvee grammar definition.
3. Run `npm run build` to compile all projects.
4. In Visual Studio Code, press `F5` to open a new window with the Jayvee extension loaded.
5. Create a new file with a `.jv` file name suffix or open an existing file in the directory `example`.
6. Verify that syntax highlighting, validation, completion etc. are working as expected.
7. Run `node dist/apps/interpreter/main.js` to see options for the CLI of the interpreter; `node dist/apps/interpreter/main.js <file>` interprets a given `.jv` file.

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

### Quickly running the interpreter with the cars example

1. Start postgres database

```bash
docker compose -f ./example/docker-compose.example.yml up
```

2. Run example

```bash
npm run example
```
