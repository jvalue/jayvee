// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type JayveeServices,
  createJayveeServices,
  initializeWorkspace,
} from '@jvalue/jayvee-language-server';
import {
  type LangiumSharedServices,
  addCallHierarchyHandler,
  addCodeActionHandler,
  addCodeLensHandler,
  addCompletionHandler,
  addConfigurationChangeHandler,
  addDiagnosticsHandler,
  addDocumentHighlightsHandler,
  addDocumentLinkHandler,
  addDocumentSymbolHandler,
  addDocumentUpdateHandler,
  addExecuteCommandHandler,
  addFileOperationHandler,
  addFindReferencesHandler,
  addFoldingRangeHandler,
  addFormattingHandler,
  addGoToDeclarationHandler,
  addGoToImplementationHandler,
  addGoToTypeDefinitionHandler,
  addGotoDefinitionHandler,
  addHoverHandler,
  addInlayHintHandler,
  addRenameHandler,
  addSemanticTokenHandler,
  addSignatureHelpHandler,
  addTypeHierarchyHandler,
  addWorkspaceSymbolHandler,
} from 'langium/lsp';
import { NodeFileSystem } from 'langium/node';
import { ProposedFeatures, createConnection } from 'vscode-languageserver/node';

// Create a connection to the client
const connection = createConnection(ProposedFeatures.all);

// Inject the shared services and language-specific services
const services = createJayveeServices({
  connection,
  ...NodeFileSystem,
});

startLanguageServer(services.shared, services.Jayvee);

/**
 * Starts the language server and registers hooks.
 * Adapted from 'langium/lsp' to initialize workspace correctly.
 */
function startLanguageServer(
  shared: LangiumSharedServices,
  jayvee: JayveeServices,
): void {
  const connection = shared.lsp.Connection;
  if (!connection) {
    throw new Error(
      'Starting a language server requires the languageServer.Connection service to be set.',
    );
  }

  addDocumentUpdateHandler(connection, shared);
  addFileOperationHandler(connection, shared);
  addDiagnosticsHandler(connection, shared);
  addCompletionHandler(connection, shared);
  addFindReferencesHandler(connection, shared);
  addDocumentSymbolHandler(connection, shared);
  addGotoDefinitionHandler(connection, shared);
  addGoToTypeDefinitionHandler(connection, shared);
  addGoToImplementationHandler(connection, shared);
  addDocumentHighlightsHandler(connection, shared);
  addFoldingRangeHandler(connection, shared);
  addFormattingHandler(connection, shared);
  addCodeActionHandler(connection, shared);
  addRenameHandler(connection, shared);
  addHoverHandler(connection, shared);
  addInlayHintHandler(connection, shared);
  addSemanticTokenHandler(connection, shared);
  addExecuteCommandHandler(connection, shared);
  addSignatureHelpHandler(connection, shared);
  addCallHierarchyHandler(connection, shared);
  addTypeHierarchyHandler(connection, shared);
  addCodeLensHandler(connection, shared);
  addDocumentLinkHandler(connection, shared);
  addConfigurationChangeHandler(connection, shared);
  addGoToDeclarationHandler(connection, shared);
  addWorkspaceSymbolHandler(connection, shared);

  connection.onInitialize(async (params) => {
    const initResult = shared.lsp.LanguageServer.initialize(params);
    await initializeWorkspace(jayvee, []); // Initialize workspace to register dynamic document loading hooks
    return initResult;
  });
  connection.onInitialized((params) => {
    shared.lsp.LanguageServer.initialized(params);
  });

  // Make the text document manager listen on the connection for open, change and close text document events.
  const documents = shared.workspace.TextDocuments;
  documents.listen(connection);

  // Start listening for incoming messages from the client.
  connection.listen();
}
