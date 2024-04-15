// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DefaultWorkspaceManager,
  type LangiumDocument,
  type LangiumDocumentFactory,
  type LangiumServices,
  type LangiumSharedServices,
} from 'langium';
import { type WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

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
}

/**
 * Initializes the workspace with all workspace folders.
 * Also loads additional required files, e.g., the standard library
 */
export async function initializeWorkspace(
  services: LangiumServices,
  workspaceFolders: WorkspaceFolder[] = [],
): Promise<void> {
  await services.shared.workspace.WorkspaceManager.initializeWorkspace(
    workspaceFolders,
  );
}
