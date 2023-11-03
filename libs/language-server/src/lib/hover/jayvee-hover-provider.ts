// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeHoverProvider, MaybePromise } from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import {
  BlockTypeWrapper,
  BuiltinBlocktypeDefinition,
  BuiltinConstrainttypeDefinition,
  ConstraintWrapper,
  PropertyAssignment,
  getMetaInformation,
  isBuiltinBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isPropertyAssignment,
} from '../ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  override getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    let doc = undefined;
    if (isBuiltinBlocktypeDefinition(astNode)) {
      doc = this.getBlockTypeMarkdownDoc(astNode);
    }
    if (isBuiltinConstrainttypeDefinition(astNode)) {
      doc = this.getConstraintTypeMarkdownDoc(astNode);
    }
    if (isPropertyAssignment(astNode)) {
      doc = this.getPropertyMarkdownDoc(astNode);
    }

    if (doc === undefined) {
      return undefined;
    }
    const hover: Hover = {
      contents: {
        kind: 'markdown',
        value: doc,
      },
    };
    return hover;
  }

  private getBlockTypeMarkdownDoc(
    blockType: BuiltinBlocktypeDefinition,
  ): string | undefined {
    if (!BlockTypeWrapper.canBeWrapped(blockType)) {
      return;
    }
    const blockMetaInf = new BlockTypeWrapper(blockType);

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateBlockTypeDoc(blockMetaInf);
  }

  private getConstraintTypeMarkdownDoc(
    constraintType: BuiltinConstrainttypeDefinition,
  ): string | undefined {
    if (!ConstraintWrapper.canBeWrapped(constraintType)) {
      return;
    }
    const constraintMetaInf = new ConstraintWrapper(constraintType);

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateConstraintTypeDoc(constraintMetaInf);
  }

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const container = property.$container.$container;
    const metaInf = getMetaInformation(container.type);
    if (metaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(metaInf, property.name);
  }
}
