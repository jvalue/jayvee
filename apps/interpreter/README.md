<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# Interpreter

## Run the interpreter locally

Build the interpreter:

```console
npx nx run interpreter:build
```

See [Usage](#usage) for how to use the interpreter. Replace `jv` with `node dist/apps/interpreter/main.js` when running the commands.

## Global installation

See the [official docs](https://jvalue.github.io/jayvee).


## Important project files

- `package.json` - used for publishing the interpreter as npm package.
- `src/index.ts` - the entry point of the command line interface (CLI).
