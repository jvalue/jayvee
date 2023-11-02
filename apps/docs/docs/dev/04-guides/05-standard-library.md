---
title: Working with the Standard Library
sidebar_position: 5
---

Jayvee ships with its own standard library on board, including the most often used valuetypes, transformations, and so on.
The standard library itself is written in `.jv` files [here](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/stdlib/).

## Standard Library Contents

The following elements are part of the standard library:

## Builtin Contents

The implementations of builtin contents are not expressed in Jayvee itself but on the TypeScript layer. Examples:

- **Builtin valuetypes**: These valuetypes are the base for defining user-defined valuetypes in Jayvee, e.g., `text`, `integer`, `decimal`, `boolean`.
- **Builtin iotypes**: These iotypes are used to describe in inputs and outputs of blocktypes, e.g., `Sheet`, `File`.
- **Builtin blocktypes**: These blocktypes are the very basic building blocks in Jayvee, e.g., `HttpExtractor`, `SqliteLoader`.
- **Builtin constraint types**: These constraint types are constraints with custom logic, e.g., `LengthConstraint`, `RegexConstraint`.

Builtin definitions are usually generated and added to the standard library from the internal representations of the concepts.

### User-defined Contents

The implementations of user-defined contents are expressed in Jayvee itself. Examples:

- **User-defined valuetypes**: These valuetypes are based on builtin or other user-defined valuetypes. Their definition is expressed natively in Jayvee, e.g., `Percent`.
- **User-defined blocktypes**: These blocktypes are based on builtin or other user-defined blocktypes. Their definition is expressed natively in Jayvee.

We use `jv` files to add user-defined valuetypes to the standard library (see below).

## Extending the Standard Library

Just add `jv` files to the directory [here](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/stdlib/). It is crawled hierarchically, meaning that you can also organize files in folders.

## Implementation

### 1. Code generation

We use code generation to transform these `.jv` files into TypeScript files that the language server can used. The [generation script](https://github.com/jvalue/jayvee/tree/main/tools/scripts/language-server/generate-stdlib.mjs) is run via `npm run generate` next to the AST generation.

### 2. Builtin libraries

The solution we chose to implement the standard library mechanism is close to the [builtin library tutorial](https://langium.org/guides/builtin-library/) by Langium. The following components are of interest:

- [JayveeWorkspaceManager](https://github.com/jvalue/jayvee/tree/main/libs/language-server/src/lib/builtin-library/jayvee-workspace-manager.ts) in the `language-server` that registers all libraries with the langium framework.
- [StandardLibraryFileSystemProvider](https://github.com/jvalue/jayvee/tree/main/apps/vs-code-extension/src/standard-library-file-system-provider.ts) in the `vs-code-extension` that registers all libraries with the vscode plugin framework.
