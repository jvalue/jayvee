// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

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
  addCollectUnresolvedImportHook(services);

  await services.shared.workspace.WorkspaceManager.initializeWorkspace(
    workspaceFolders,
  );
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
  const allowedFileExtensions = services.shared.ServiceRegistry.all.flatMap(
    (e) => e.LanguageMetaData.fileExtensions,
  );
  const hasAllowedFileExtension = allowedFileExtensions.some((ext) =>
    importURI.fsPath.endsWith(ext),
  );
  if (!hasAllowedFileExtension) {
    console.log(importURI.fsPath);
    return;
  }

  const langiumDocuments = services.shared.workspace.LangiumDocuments;
  const documentBuilder = services.shared.workspace.DocumentBuilder;
  const documentFactory = services.shared.workspace.LangiumDocumentFactory;

  const file = await loadFileFromUri(importURI, services);
  if (file === undefined) {
    return;
  }

  const document = documentFactory.fromString<JayveeModel>(file, importURI);
  await documentBuilder.build([document], { validation: true });
  langiumDocuments.addDocument(document);
}

async function loadFileFromUri(
  uri: URI,
  services: JayveeServices,
): Promise<string | undefined> {
  const fileSystemProvider = services.shared.workspace.FileSystemProvider;

  try {
    return await fileSystemProvider.readFile(uri);
  } catch (e) {
    return undefined;
  }
}
