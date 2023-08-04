---
title: The Jayvee grammar
sidebar_position: 1
---

The grammar of Jayvee describes the syntax and structure of the language.
It is located in the language server project.
The grammar itself is written in [Langium's own grammar language](https://langium.org/docs/grammar-language/) which is similar to [Xtext](https://www.eclipse.org/Xtext/) grammars.
Such grammar files are easily identifiable via their `.langium` file extension.

The grammar is used to generate TypeScript interfaces that represent the Abstract Syntax Tree (AST) and different, semantically equivalent files to define syntax highlighting for different applications.
For instance, a [TextMate](https://macromates.com/manual/en/language_grammars) file is generated for the syntax highlighting in the Jayvee VS Code extension whereas a [Monarch](https://microsoft.github.io/monaco-editor/monarch.html) file is generated for the syntax highlighting in the Monaco editor.

For further information on the grammar language of Langium, visit the corresponding [Langium documentation](https://langium.org/docs/grammar-language/).

## Working with the grammar

To run the code generation, either use `npm run generate` for solely the code generation or `npm run build` for an entire build. The code generation also generates further code, like the standard library. 

Whenever the grammar is changed and the code generation is run during development, it is advisory to **close and reopen the IDE**, so the changes are noticed and the file indexing is updated.

## How to rename AST nodes

Renaming AST nodes is not as straight forward as one might initially assume.
When renaming individual rules in the grammar, just the generated TypeScript code in `ast.ts` will reflect the renaming, but not the rest of the codebase.

The following steps explain how to rename an AST node, so the change is reflected in the entire codebase. As an example, an AST node called `A` is supposed to be renamed to `B`:

- Open the `ast.ts` file in the language server project
- Locate the `A` interface / type and the `isA` typeguard
- Use the rename feature by the IDE to perform the renaming from `A` to `B` and from `isA` to `isB`
- Open the grammar and locate the `A` rule
- Use the rename feature by the Langium VS Code extension to perform the renaming from `A` to `B`
- Run `npm run generate`
