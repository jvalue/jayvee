---
title: Working with the Standard Library
---

Jayvee ships with its own standard library on board, including the most often used valuetypes, transformations, and so on.
The standard library itself is written in `.jv` files [here](/libs/language-server/src/stdlib/).

## Extending the Standard Library

Just add `jv` files to the directory [here](/libs/language-server/src/stdlib/). It is crawled hierarchically, meaning that you can also organize files in folders.

## Implementation

### 1. Code generation

We use code generation to transform these `.jv` files into TypeScript files that the language server can used. The [generation script](/tools/scripts/language-server/generate-stdlib.mjs) is run via `npm run generate` next to the AST generation.

### 2. Builtin libraries

The solution we chose to implement the standard library mechanism is close to the [builtin library tutorial](https://langium.org/guides/builtin-library/) by Langium. The following components are of interest:
- [JayveeWorkspaceManager](/libs/language-server/src/lib/builtin-library/jayvee-workspace-manager.ts) in the `language-server` that registers all libraries with the langium framework.
- [StandardLibraryFileSystemProvider](/apps/vs-code-extension/src/standard-library-file-system-provider.ts) in the `vs-code-extension` that registers all libraries with the vscode plugin framework.