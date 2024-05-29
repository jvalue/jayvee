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
  type ExportableElement,
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
    importedElements.push(
      ...this.getBuiltinElements().map((x) =>
        this.descriptions.createDescription(x.element, x.exportName),
      ),
    );
    importedElements.push(
      ...this.getImportedElements(jayveeModel).map((x) =>
        this.descriptions.createDescription(x.element, x.importName),
      ),
    );

    return new MapScope(importedElements);
  }

  protected getImportedElements(model: JayveeModel): ImportDetails[] {
    const importedElements: ImportDetails[] = [];
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
  ): ImportDetails[] {
    const publishedElements =
      this.getPublishedElementsFromDocument(importedDocument);

    if (importDefinition.useAll) {
      return publishedElements.map((exportDetails) => {
        return {
          element: exportDetails.element,
          importName: exportDetails.exportName,
        };
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const namedImports = importDefinition.usedElements ?? [];

    const importedElements: ImportDetails[] = [];
    for (const namedImport of namedImports) {
      const matchingExportedElement = publishedElements.find(
        (x) => x.exportName === namedImport.element,
      );
      if (
        matchingExportedElement === undefined ||
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        matchingExportedElement.element === undefined
      ) {
        continue;
      }

      const importedElementName = namedImport.alias ?? namedImport.element;
      importedElements.push({
        element: matchingExportedElement.element,
        importName: importedElementName,
      });
    }
    return importedElements;
  }

  protected getBuiltinElements(): ExportDetails[] {
    const builtinUris = this.getBuiltinUris();

    const importedDocuments = [...builtinUris].map((importedUri) =>
      this.langiumDocuments.getDocument(URI.parse(importedUri)),
    );

    const importedElements: ExportDetails[] = [];
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
  ): ExportDetails[] {
    const model = document.parseResult.value as JayveeModel;

    const publishedElements = this.availableElementsPerDocumentCache.get(
      document.uri,
      'exports', // we only need one key here as it is on document basis
      () => getExportedElements(model),
    );
    return publishedElements;
  }

  /**
   * Gets all builtins' URIs
   */
  protected getBuiltinUris(): Set<string> {
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

interface ImportDetails {
  element: ExportableElement;
  importName: string;
}
