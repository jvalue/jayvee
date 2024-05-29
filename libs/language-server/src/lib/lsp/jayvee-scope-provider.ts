// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNodeDescription,
  AstUtils,
  DefaultScopeProvider,
  DocumentCache,
  EMPTY_SCOPE,
  type LangiumDocuments,
  MapScope,
  type ReferenceInfo,
  type Scope,
} from 'langium';

import { type ExportDetails, isJayveeModel } from '../ast';
import { type JayveeServices } from '../jayvee-module';
import { type JayveeImportResolver } from '../services/import-resolver';

export class JayveeScopeProvider extends DefaultScopeProvider {
  protected readonly langiumDocuments: LangiumDocuments;
  protected readonly importResolver: JayveeImportResolver;

  protected readonly availableElementsPerDocumentCache: DocumentCache<
    string,
    ExportDetails[]
  >; // DocumentCache becomes invalidated as soon the corresponding document is updated
  constructor(services: JayveeServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.importResolver = services.ImportResolver;
    this.availableElementsPerDocumentCache = new DocumentCache(services.shared);
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

    const importedElements: AstNodeDescription[] = [];
    const allBuiltinElements = this.importResolver.getBuiltinElements();
    const allBuiltinElementDescriptions = allBuiltinElements.map((x) =>
      this.descriptions.createDescription(x.element, x.exportName),
    );
    importedElements.push(...allBuiltinElementDescriptions);

    const allImportedElements =
      this.importResolver.getImportedElements(jayveeModel);
    const allImportedElementDescriptions = allImportedElements.map((x) =>
      this.descriptions.createDescription(x.element, x.importName),
    );
    importedElements.push(...allImportedElementDescriptions);

    return new MapScope(importedElements);
  }
}
