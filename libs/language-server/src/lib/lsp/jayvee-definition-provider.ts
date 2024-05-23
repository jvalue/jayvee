// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
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

import { isImportDefinition } from '../ast';
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

      const jumpTarget = importedModel;

      const selectionRange =
        this.nameProvider.getNameNode(jumpTarget)?.range ??
        Range.create(0, 0, 0, 0);
      const previewRange =
        jumpTarget.$cstNode?.range ?? Range.create(0, 0, 0, 0);

      return [
        LocationLink.create(
          importedModel.$document.uri.toString(),
          previewRange,
          selectionRange,
          sourceCstNode.range,
        ),
      ];
    }
    return super.collectLocationLinks(sourceCstNode, params);
  }
}
