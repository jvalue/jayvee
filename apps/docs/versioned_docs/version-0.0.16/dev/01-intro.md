---
sidebar_position: 1
---

# Introduction for Jayvee Developers

## How to contribute

In order to contribute to the Jayvee project, please have a look at our [contribution guide](https://github.com/jvalue/jayvee/blob/main/CONTRIBUTING.md).

The overall project is licensed under the `AGPL-3.0-only` license and is compliant to the [REUSE Specification](https://reuse.software/spec/) by the [Free Software Foundation Europe](https://fsfe.org/).
Because of this, contributions are required to adhere to the license and follow that specification.
More details on this topic can be found [here](./02-licensing-and-copyright.md).

And last but not least, please read and follow our [code of conduct](https://github.com/jvalue/jayvee/blob/main/CODE_OF_CONDUCT.md).

## Project overview

The Jayvee repository is located [here](https://github.com/jvalue/jayvee) on GitHub.
It uses an [Nx mono-repository](https://nx.dev/) setup and contains all related projects, most notably the Jayvee language server and interpreter.
Please have a look at the [architecture overview](./04-architecture-overview.md) for more details.

## Prerequisites

Node.js and npm are required for development.
It is recommended to use their LTS version to avoid any potential compatibility issues.
Also, refer to this [quick start guide](https://github.com/jvalue/jayvee#development-quickstart) for developers.

In order to run the Jayvee VS Code extension during development, VS Code is required as IDE.
Using VS Code also allows installing the [Langium VS Code extension](https://marketplace.visualstudio.com/items?itemName=langium.langium-vscode) for better IDE support when working with Langium grammar files.

## Resources for getting started

### Langium

- [**Langium documentation**](https://langium.org/docs/)
- Practical examples using Langium:
  - [Langium examples](https://github.com/langium/langium/tree/main/examples): Official example languages by Langium
  - [Langium's grammar language](https://github.com/langium/langium/tree/main/packages/langium): The implementation of Langium's own grammar language
  - [Language server for SQL](https://github.com/langium/langium-sql): An implementation of a language server for SQL
  - [MiniLogo DSL](https://github.com/langium/langium-minilogo): A domain-specific language for drawing pictures
  - [Lox language](https://github.com/langium/langium-lox): An implementation of the Lox scripting language (also see the "Crafting Interpreters" book below)
  - [SimpleUI DSL](https://github.com/TypeFox/langium-ui-framework): A domain-specific language for generating user interfaces
  - [STPA-DSL](https://github.com/kieler/stpa): A domain-specific language for System-Theoretic Process Analysis
- [Langium playground](https://langium.org/playground/): A tool for testing Langium grammars and visualizing resulting ASTs
- [Typefox blog](https://www.typefox.io/blog/): A blog by the company behind Langium, mostly posting Langium-related content.

### Building compilers / interpreters / DSLs

- [Crafting Interpreters](https://craftinginterpreters.com/contents.html): A book by Robert Nystrom on implementing an interpreter for the Lox scripting language
- [DSL Engineering](https://voelter.de/dslbook/markusvoelter-dslengineering-1.0.pdf): A book by Markus Voelter on designing, implementing and using domain-specific languages
- [Awesome Compilers](https://github.com/aalhour/awesome-compilers#readme): A list featuring many resources on compilers and interpreters
