// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DefaultWorkspaceManager,
  type LangiumDocument,
  type LangiumDocumentFactory,
} from 'langium';
import { type LangiumSharedServices } from 'langium/lsp';
import { type WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import { type JayveeServices } from '../jayvee-module';

import { getStdLib } from './stdlib';

export class JayveeWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory;

  constructor(services: LangiumSharedServices) {
    super(services);
    this.documentFactory = services.workspace.LangiumDocumentFactory;
  }

  override async loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument) => void,
  ): Promise<void> {
    await super.loadAdditionalDocuments(folders, collector);

    Object.entries(getStdLib()).forEach(([libName, libCode]) => {
      collector(this.documentFactory.fromString(libCode, URI.parse(libName)));
    });
  }

  override getRootFolder(workspaceFolder: WorkspaceFolder): URI {
    const uri = super.getRootFolder(workspaceFolder);
    console.log(`WorkspaceManager.getRootFolder: ${uri.toString()}`);
    return uri;
  }

  override async traverseFolder(
    workspaceFolder: WorkspaceFolder,
    folderPath: URI,
    fileExtensions: string[],
    collector: (document: LangiumDocument) => void,
  ): Promise<void> {
    const content = await this.fileSystemProvider.readDirectory(folderPath);
    console.log(
      `WorkspaceManager.traverseFolder: ${workspaceFolder.uri}\n${content
        .map((entry) => entry.uri.toString())
        .join('\n')}`,
    );

    return super.traverseFolder(
      workspaceFolder,
      folderPath,
      fileExtensions,
      collector,
    );
  }
}

/**
 * Initializes the workspace with all workspace folders.
 * Also loads additional required files, e.g., the standard library
 */
export async function initializeWorkspace(
  services: JayveeServices,
  workspaceFolders: WorkspaceFolder[] = [],
): Promise<void> {
  await services.shared.workspace.WorkspaceManager.initializeWorkspace(
    workspaceFolders,
  );
}
