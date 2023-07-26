// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumServices,
  LangiumSharedServices,
} from 'langium';
import { WorkspaceFolder } from 'vscode-languageserver';
import { URI } from 'vscode-uri';

import { PrimitiveValuetypes } from '../ast';

import { StdLib } from './generated/stdlib';

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
    this.loadBuiltinValuetypes(collector);

    Object.entries(StdLib).forEach(([libName, libCode]) => {
      collector(this.documentFactory.fromString(libCode, URI.parse(libName)));
    });
  }

  private loadBuiltinValuetypes(
    collector: (document: LangiumDocument) => void,
  ) {
    const builtinValuetypeDefinitions: string[] = [];
    Object.values(PrimitiveValuetypes)
      .filter((v) => v.isUserExtendable())
      .forEach((valueType) => {
        builtinValuetypeDefinitions.push(
          `builtin valuetype ${valueType.getName()};`,
        );
      });

    const joinedDocument = builtinValuetypeDefinitions.join('\n');
    const libName = 'builtin:///stdlib/builtin-valuetypes.jv';
    collector(
      this.documentFactory.fromString(joinedDocument, URI.parse(libName)),
    );
  }
}

/**
 * Initializes the workspace with all workspace folders.
 * Also loads additional required files, e.g., the standard library
 */
export async function initializeWorkspace(
  services: LangiumServices,
): Promise<void> {
  const workspaceFolders: WorkspaceFolder[] = [];
  await services.shared.workspace.WorkspaceManager.initializeWorkspace(
    workspaceFolders,
  );
}
