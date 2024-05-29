// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNode,
  AstUtils,
  GrammarUtils,
  type LangiumDocuments,
  type LeafCstNode,
  type MaybePromise,
} from 'langium';
import { DefaultDefinitionProvider } from 'langium/lsp';
import {
  type DefinitionParams,
  LocationLink,
  Range,
} from 'vscode-languageserver-protocol';

import {
  getExportedElements,
  isImportDefinition,
  isJayveeModel,
  isNamedImportElement,
} from '../ast';
import { type JayveeServices } from '../jayvee-module';
import { type JayveeImportResolver } from '../services/import-resolver';

export class JayveeDefinitionProvider extends DefaultDefinitionProvider {
  protected documents: LangiumDocuments;
  protected importResolver: JayveeImportResolver;

  constructor(services: JayveeServices) {
    super(services);
    this.documents = services.shared.workspace.LangiumDocuments;
    this.importResolver = services.ImportResolver;
  }

  protected override collectLocationLinks(
    sourceCstNode: LeafCstNode,
    params: DefinitionParams,
  ): MaybePromise<LocationLink[] | undefined> {
    const sourceAstNode = sourceCstNode.astNode;

    if (
      isImportDefinition(sourceAstNode) &&
      GrammarUtils.findAssignment(sourceCstNode)?.feature === 'path'
    ) {
      const importedModel = this.importResolver.resolveImport(sourceAstNode);

      if (importedModel?.$document === undefined) {
        return undefined;
      }

      return this.getLocationLink(sourceCstNode, importedModel);
    }

    if (
      isNamedImportElement(sourceAstNode) &&
      GrammarUtils.findAssignment(sourceCstNode)?.feature === 'element'
    ) {
      const importDefinition = sourceAstNode.$container;
      assert(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        importDefinition !== undefined,
        'Could not traverse to ImportDefinition',
      );
      const importedModel = this.importResolver.resolveImport(importDefinition);

      if (importedModel?.$document === undefined) {
        return undefined;
      }

      const allExportDefinitions = getExportedElements(importedModel);

      const referencedExport = allExportDefinitions.find((x) => {
        return x.exportName === sourceAstNode.element;
      });
      if (referencedExport === undefined) {
        return;
      }

      return this.getLocationLink(sourceCstNode, referencedExport.element);
    }
    return super.collectLocationLinks(sourceCstNode, params);
  }

  protected getLocationLink(
    sourceCstNode: LeafCstNode,
    jumpTarget: AstNode,
  ): LocationLink[] | undefined {
    // need to go over model as jumpTarget might not have $document associated
    const containingDocument = AstUtils.getContainerOfType(
      jumpTarget,
      isJayveeModel,
    )?.$document;

    if (containingDocument === undefined) {
      return undefined;
    }

    const selectionRange =
      this.nameProvider.getNameNode(jumpTarget)?.range ??
      Range.create(0, 0, 0, 0);
    const previewRange = jumpTarget.$cstNode?.range ?? Range.create(0, 0, 0, 0);

    return [
      LocationLink.create(
        containingDocument.uri.toString(),
        previewRange,
        selectionRange,
        sourceCstNode.range,
      ),
    ];
  }
}
