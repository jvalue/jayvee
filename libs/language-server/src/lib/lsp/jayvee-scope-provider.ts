// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AstUtils,
  DefaultScopeProvider,
  EMPTY_SCOPE,
  type LangiumDocuments,
  MapScope,
  type ReferenceInfo,
  type Scope,
  URI,
} from 'langium';

import { type JayveeModel, isJayveeModel } from '../ast';
import { getStdLib } from '../builtin-library';
import { type JayveeServices } from '../jayvee-module';
import { type JayveeImportResolver } from '../services/import-resolver';

export class JayveeScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;
  protected readonly importResover: JayveeImportResolver;

  constructor(services: JayveeServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.importResover = services.ImportResolver;
  }

  protected override getGlobalScope(
    referenceType: string,
    context: ReferenceInfo,
  ): Scope {
    const jayveeModel = AstUtils.getContainerOfType(
      context.container,
      isJayveeModel,
    );
    if (!jayveeModel) {
      return EMPTY_SCOPE;
    }

    const importedUris = new Set<string>();
    this.gatherImports(jayveeModel, importedUris);
    this.gatherBuiltins(importedUris);

    const importedElements = this.indexManager.allElements(
      referenceType,
      importedUris,
    );

    return new MapScope(importedElements);
  }

  /**
   * Add all builtins URIs to @param importedUris
   */
  private gatherBuiltins(importedUris: Set<string>) {
    const builtins = getStdLib();
    const uris = Object.keys(builtins);

    for (const uri of uris) {
      // without formatting, the document might not be found
      const formattedUri = URI.parse(uri).toString();
      importedUris.add(formattedUri);
    }
  }

  /**
   * Recursively add all imported URIs to @param importedUris
   */
  private gatherImports(
    jayveeModel: JayveeModel,
    importedUris: Set<string>,
  ): void {
    for (const importDefinition of jayveeModel.imports) {
      const uri = this.importResover.resolveImportUri(importDefinition);
      if (uri === undefined) {
        break;
      }

      if (importedUris.has(uri.toString())) {
        break; // end recursion
      }

      importedUris.add(uri.toString());
      const importedDocument = this.langiumDocuments.getDocument(uri);
      if (importedDocument === undefined) {
        break;
      }

      const rootNode = importedDocument.parseResult.value;
      if (!isJayveeModel(rootNode)) {
        break;
      }
      this.gatherImports(rootNode, importedUris);
    }
  }
}
