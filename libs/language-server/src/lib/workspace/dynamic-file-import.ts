// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { DocumentState } from 'langium';
import { type URI } from 'vscode-uri';

import { type JayveeModel, isJayveeModel } from '../ast';
import { type JayveeServices } from '../jayvee-module';

export function addDynamicFileImport(services: JayveeServices): void {
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

  await services.shared.workspace.WorkspaceLock.write(() => {
    if (!langiumDocuments.hasDocument(document.uri)) {
      langiumDocuments.addDocument(document);
    }
  });
}

async function loadFileFromUri(
  uri: URI,
  services: JayveeServices,
): Promise<string | undefined> {
  const fileSystemProvider = services.shared.workspace.FileSystemProvider;

  try {
    return await fileSystemProvider.readFile(uri);
  } catch {
    return undefined;
  }
}
