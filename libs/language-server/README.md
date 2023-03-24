<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# Language Server

## Important project files

- `language-configuration.json` - the language configuration used in monaco editors, defining the tokens that are used for comments and brackets.
- `src/grammar/` - a folder containing the grammar definition of the language.
- `langium-config.json` - the configuration for the Langium generator.

## FAQ

### Why is the linting rule `@typescript-eslint/no-unnecessary-condition` sometimes disabled?

The rule is disabled in places, where we work with potentially incomplete AST nodes.

Langium generates separate interfaces for each kind of AST node.
According to the generated interfaces, their properties are never `undefined` but in reality they might be.

So, in order to write safe code, we need to handle those cases where properties may be `undefined` and thus use 
conditions for checking the actual value against `undefined`.
ESLint considers such conditions unnecessary (due to the interfaces), which is the reason for disabling that particular 
rule.
