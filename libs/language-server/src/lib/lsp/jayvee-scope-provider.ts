// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
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
  type ExportDefinition,
  type ExportableElement,
  type JayveeModel,
  isExportDefinition,
  isExportableElement,
  isExportableElementDefinition,
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
    ExportableElement[]
  >;

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

    // TODO: add caching to avoid performance issues

    const importedUris = new Set<string>();
    this.gatherImports(jayveeModel, importedUris);
    this.gatherBuiltins(importedUris);

    const importedDocuments = [...importedUris].map((importedUri) =>
      this.langiumDocuments.getDocument(URI.parse(importedUri)),
    );

    const importedElements: AstNodeDescription[] = [];
    for (const importedDocument of importedDocuments) {
      if (importedDocument === undefined) {
        continue;
      }

      const publishedElements = this.availableElementsPerDocumentCache.get(
        importedDocument.uri,
        'exports', // we only need one key here as it is on document basis
        () => this.getExportedElements(importedDocument),
      );
      importedElements.push(
        ...publishedElements.map((e) =>
          this.descriptions.createDescription(e, e.name),
        ),
      );
    }

    return new MapScope(importedElements);
  }

  /**
   * Gets all exported elements from a document.
   * This logic cannot reside in a {@link ScopeComputationProvider} but should be handled here:
   * https://github.com/eclipse-langium/langium/discussions/1508#discussioncomment-9524544
   */
  protected getExportedElements(
    document: LangiumDocument,
  ): ExportableElement[] {
    const model = document.parseResult.value as JayveeModel;
    const exportedElements: ExportableElement[] = [];

    for (const node of AstUtils.streamAllContents(model)) {
      if (isExportableElementDefinition(node) && node.isPublished) {
        assert(
          isExportableElement(node),
          'Exported node is not an ExportableElement',
        );
        exportedElements.push(node);
      }

      if (isExportDefinition(node)) {
        const originalDefinition = this.followExportDefinitionChain(node);
        if (originalDefinition !== undefined) {
          exportedElements.push(originalDefinition);
        }
      }
    }
    return exportedElements;
  }

  /**
   * Follow an export statement to its original definition.
   */
  protected followExportDefinitionChain(
    exportDefinition: ExportDefinition,
  ): ExportableElement | undefined {
    const referenced = exportDefinition.element.ref;

    if (referenced === undefined) {
      return undefined; // Cannot follow reference to original definition
    }

    if (!this.isElementExported(referenced)) {
      return undefined;
    }

    return referenced; // Reached original definition
  }

  /**
   * Checks whether an exportable @param element is exported (either in definition or via an delayed export definition).
   */
  protected isElementExported(element: ExportableElement): boolean {
    if (isExportableElementDefinition(element) && element.isPublished) {
      return true;
    }

    const model = AstUtils.getContainerOfType(element, isJayveeModel);
    assert(
      model !== undefined,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      `Could not get container of exportable element ${element.name ?? ''}`,
    );

    const isExported = model.exports.some(
      (exportDefinition) => exportDefinition.element.ref === element,
    );
    return isExported;
  }

  /**
   * Add all builtins' URIs to @param importedUris
   */
  protected gatherBuiltins(importedUris: Set<string>) {
    const builtins = getStdLib();
    const uris = Object.keys(builtins);

    for (const uri of uris) {
      // without formatting, the document might not be found
      const formattedUri = URI.parse(uri).toString();
      importedUris.add(formattedUri);
    }
  }

  /**
   * Add all imported URIs of the given @jayveeModel to @param importedUris
   */
  protected gatherImports(
    jayveeModel: JayveeModel,
    importedUris: Set<string>,
  ): void {
    for (const importDefinition of jayveeModel.imports) {
      const uri = this.importResolver.resolveImportUri(importDefinition);
      if (uri === undefined) {
        continue;
      }

      if (importedUris.has(uri.toString())) {
        continue;
      }

      importedUris.add(uri.toString());
      const importedDocument = this.langiumDocuments.getDocument(uri);
      if (importedDocument === undefined) {
        continue;
      }
    }
  }
}
