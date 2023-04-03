// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { StdLangExtension } from '@jvalue/jayvee-extensions/std/lang';
import { createJayveeServices, useExtension } from '@jvalue/jayvee-language-server';
import { startLanguageServer } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

useExtension(new StdLangExtension());

// Inject the shared services and language-specific services
const { shared } = createJayveeServices({
  connection,
  ...NodeFileSystem,
});

// Start the language server with the shared services
startLanguageServer(shared);
