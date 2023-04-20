// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedServices,
} from 'langium';
import { WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import {
  STANDARD_LIBRARY_FILENAME,
  STANDARD_LIBRARY_SOURCECODE,
} from './jayvee-standard-library';

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
    collector(
      this.documentFactory.fromString(
        STANDARD_LIBRARY_SOURCECODE,
        URI.parse(`builtin:///${STANDARD_LIBRARY_FILENAME}`),
      ),
    );
  }
}
