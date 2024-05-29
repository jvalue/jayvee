// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  type AstNodeDescription,
  AstUtils,
  DefaultScopeProvider,
  DocumentCache,
  EMPTY_SCOPE,
  type LangiumDocument,
  type LangiumDocuments,
  MapScope,
  type ReferenceInfo,
  type Scope,
  URI,
} from 'langium';

import {
  type ExportDetails,
  type ImportDefinition,
  type JayveeModel,
  getExportedElements,
  isJayveeModel,
} from '../ast';
import { getStdLib } from '../builtin-library';
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
    importedElements.push(...this.getBuiltinElements());
    importedElements.push(...this.getExplicitlyImportedElements(jayveeModel));

    return new MapScope(importedElements);
  }

  protected getExplicitlyImportedElements(
    model: JayveeModel,
  ): AstNodeDescription[] {
    const importedElements: AstNodeDescription[] = [];
    for (const importDefinition of model.imports) {
      const importedDocument =
        this.importResolver.resolveImportedDocument(importDefinition);
      if (importedDocument === undefined) {
        continue;
      }

      importedElements.push(
        ...this.getImportedElementsFromDocument(
          importDefinition,
          importedDocument,
        ),
      );
    }
    return importedElements;
  }

  protected getImportedElementsFromDocument(
    importDefinition: ImportDefinition,
    importedDocument: LangiumDocument,
  ): AstNodeDescription[] {
    const publishedElements =
      this.getPublishedElementsFromDocument(importedDocument);

    if (importDefinition.useAll) {
      return publishedElements;
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const namedImports = importDefinition.usedElements ?? [];

    const importedElements: AstNodeDescription[] = [];
    for (const namedImport of namedImports) {
      const matchingExportedElement = publishedElements.find(
        (x) => x.name === namedImport.element,
      );
      if (
        matchingExportedElement === undefined ||
        matchingExportedElement.node === undefined
      ) {
        continue;
      }

      const importedElementName = namedImport.alias ?? namedImport.element;
      importedElements.push(
        this.descriptions.createDescription(
          matchingExportedElement.node,
          importedElementName,
        ),
      );
    }
    return importedElements;
  }

  protected getBuiltinElements(): AstNodeDescription[] {
    const builtinUris = this.getBuiltins();

    const importedDocuments = [...builtinUris].map((importedUri) =>
      this.langiumDocuments.getDocument(URI.parse(importedUri)),
    );

    const importedElements: AstNodeDescription[] = [];
    for (const importedDocument of importedDocuments) {
      if (importedDocument === undefined) {
        continue;
      }

      importedElements.push(
        ...this.getPublishedElementsFromDocument(importedDocument),
      );
    }

    return importedElements;
  }

  protected getPublishedElementsFromDocument(
    document: LangiumDocument<AstNode>,
  ): AstNodeDescription[] {
    const model = document.parseResult.value as JayveeModel;

    const publishedElements = this.availableElementsPerDocumentCache.get(
      document.uri,
      'exports', // we only need one key here as it is on document basis
      () => getExportedElements(model),
    );
    return publishedElements.map((e) =>
      this.descriptions.createDescription(e.element, e.alias),
    );
  }

  /**
   * Add all builtins' URIs to @param importedUris
   */
  protected getBuiltins(): Set<string> {
    const importedUris: Set<string> = new Set();

    const builtins = getStdLib();
    const uris = Object.keys(builtins);

    for (const uri of uris) {
      // without formatting, the document might not be found
      const formattedUri = URI.parse(uri).toString();
      importedUris.add(formattedUri);
    }

    return importedUris;
  }
}
