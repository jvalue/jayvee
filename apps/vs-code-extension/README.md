<!--
SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg

SPDX-License-Identifier: AGPL-3.0-only
-->

# VS Code Extension

## Important project files

- `package.json` - the manifest file where the language support is declared.
- `src/extension.ts` - the main code of the extension, which is responsible for launching a language server and client.
- `src/language-server.ts` - the entry point of the language server process.
