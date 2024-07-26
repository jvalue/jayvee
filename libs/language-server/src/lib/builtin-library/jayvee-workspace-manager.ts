// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { readFile } from 'node:fs/promises';

import {
  DefaultWorkspaceManager,
  DocumentState,
  type LangiumDocument,
  type LangiumDocumentFactory,
} from 'langium';
import { type LangiumSharedServices } from 'langium/lsp';
import { type WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import { type JayveeModel, isJayveeModel } from '../ast';
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

  addCollectUnresolvedImportHook(services);
}

function addCollectUnresolvedImportHook(services: JayveeServices): void {
  const documentBuilder = services.shared.workspace.DocumentBuilder;
  const importResolver = services.ImportResolver;

  documentBuilder.onBuildPhase(DocumentState.IndexedContent, async (docs) => {
    for (const doc of docs) {
      const model = doc.parseResult.value;
      if (!isJayveeModel(model)) {
        return;
      }
      const importURIs = importResolver.findUnresolvedImportURIs(model);

      for (const importURI of importURIs) {
        await loadDocumentFromFs(importURI, services);
      }
    }
  });
}

async function loadDocumentFromFs(
  importURI: URI,
  services: JayveeServices,
): Promise<void> {
  const langiumDocuments = services.shared.workspace.LangiumDocuments;
  const documentBuilder = services.shared.workspace.DocumentBuilder;
  const documentFactory = services.shared.workspace.LangiumDocumentFactory;

  const file = await loadFileFromUri(importURI);
  if (file === undefined) {
    return;
  }

  const document = documentFactory.fromString<JayveeModel>(file, importURI);
  await documentBuilder.build([document], { validation: true });
  langiumDocuments.addDocument(document);
}

async function loadFileFromUri(uri: URI): Promise<string | undefined> {
  try {
    const path = uri.fsPath;
    const fileBuffer = await readFile(path);
    return fileBuffer.toString();
  } catch (e) {
    return undefined;
  }
}
