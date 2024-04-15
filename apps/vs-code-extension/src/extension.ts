// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import * as path from 'path';

import * as vscode from 'vscode';
import {
  LanguageClient,
  type LanguageClientOptions,
  type ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

import { StandardLibraryFileSystemProvider } from './standard-library-file-system-provider';

let client: LanguageClient;

// This function is called when the extension is activated.
export function activate(context: vscode.ExtensionContext): void {
  StandardLibraryFileSystemProvider.register(context);
  client = startLanguageClient(context);
}

// This function is called when the extension is deactivated.
export function deactivate(): Thenable<void> | undefined {
  return client.stop();
}

function startLanguageClient(context: vscode.ExtensionContext): LanguageClient {
  const serverModule = context.asAbsolutePath(path.join('language-server.cjs'));
  // The debug options for the server
  // --inspect=6009: runs the server in Node's Inspector mode so VS Code can attach to the server for debugging.
  // By setting `process.env.DEBUG_BREAK` to a truthy value, the language server will wait until a debugger is attached.
  const debugOptions = {
    execArgv: [
      '--nolazy',
      `--inspect${process.env.DEBUG_BREAK !== undefined ? '-brk' : ''}=${
        process.env.DEBUG_SOCKET ?? '6009'
      }`,
    ],
  };

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  const fileSystemWatcher = vscode.workspace.createFileSystemWatcher('**/*.jv');
  context.subscriptions.push(fileSystemWatcher);

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'jayvee' }],
    synchronize: {
      // Notify the server about file changes to files contained in the workspace
      fileEvents: fileSystemWatcher,
    },
  };

  // Create the language client and start the client.
  const client = new LanguageClient(
    'jayvee',
    'Jayvee',
    serverOptions,
    clientOptions,
  );

  // Start the client. This will also launch the server
  void client.start();
  return client;
}
