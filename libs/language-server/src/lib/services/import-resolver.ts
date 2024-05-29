// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type AstNode,
  AstUtils,
  DocumentCache,
  type LangiumDocument,
  type LangiumDocuments,
  URI,
  UriUtils,
} from 'langium';

import { type ExportDetails, getExportedElements } from '../ast';
import {
  type ExportableElement,
  type ImportDefinition,
  type JayveeModel,
  isExportableElement,
  isJayveeModel,
} from '../ast/generated/ast';
import { getStdLib } from '../builtin-library/stdlib';
import { type JayveeServices } from '../jayvee-module';

export interface ImportDetails {
  element: ExportableElement;
  importName: string;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isImportDetails(obj: any): obj is ImportDetails {
  return (
    typeof obj === 'object' &&
    'importName' in obj &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    typeof obj.importName === 'string' &&
    'element' in obj &&
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    isExportableElement(obj.element)
  );
}

export class JayveeImportResolver {
  protected readonly documents: LangiumDocuments;
  protected readonly availableElementsPerDocumentCache: DocumentCache<
    string,
    ExportDetails[]
  >; // DocumentCache becomes invalidated as soon the corresponding document is updated

  constructor(services: JayveeServices) {
    this.documents = services.shared.workspace.LangiumDocuments;
    this.availableElementsPerDocumentCache = new DocumentCache(services.shared);
  }

  resolveImport(importDefinition: ImportDefinition): JayveeModel | undefined {
    const resolvedDocument = this.resolveImportedDocument(importDefinition);
    if (resolvedDocument === undefined) {
      return undefined;
    }

    const parsedModel = resolvedDocument.parseResult.value;
    if (!isJayveeModel(parsedModel)) {
      return undefined;
    }

    return parsedModel;
  }

  resolveImportedDocument(
    importDefinition: ImportDefinition,
  ): LangiumDocument | undefined {
    const resolvedUri = this.resolveImportUri(importDefinition);
    if (resolvedUri === undefined) {
      return undefined;
    }

    const resolvedDocument = this.documents.getDocument(resolvedUri);
    if (resolvedDocument === undefined) {
      return undefined;
    }

    return resolvedDocument;
  }

  resolveImportUri(importDefinition: ImportDefinition): URI | undefined {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      importDefinition.path === undefined ||
      importDefinition.path.length === 0
    ) {
      return undefined;
    }

    const dirUri = UriUtils.dirname(AstUtils.getDocument(importDefinition).uri);
    const modelPath = importDefinition.path;

    return UriUtils.resolvePath(dirUri, modelPath);
  }

  getImportedElements(model: JayveeModel): ImportDetails[] {
    const importedElements: ImportDetails[] = [];
    for (const importDefinition of model.imports) {
      const importedDocument = this.resolveImportedDocument(importDefinition);
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

  getImportedElementsFromDocument(
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

  getBuiltinElements(): ExportDetails[] {
    const builtinUris = this.getBuiltinUris();

    const importedDocuments = [...builtinUris].map((importedUri) =>
      this.documents.getDocument(URI.parse(importedUri)),
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

  getPublishedElementsFromDocument(
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
  getBuiltinUris(): Set<string> {
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
