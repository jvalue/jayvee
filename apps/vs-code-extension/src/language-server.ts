import { StdExtension } from '@jayvee/extensions/std';
import { createJayveeServices, useExtension } from '@jayvee/language-server';
import { startLanguageServer } from 'langium';
import { NodeFileSystem } from 'langium/node';
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

useExtension(new StdExtension());

// Inject the shared services and language-specific services
const { shared } = createJayveeServices({
  connection,
  ...NodeFileSystem,
});

// Start the language server with the shared services
startLanguageServer(shared);
