// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeHoverProvider, MaybePromise } from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import {
  BlockTypeWrapper,
  BuiltinBlocktypeDefinition,
  BuiltinConstrainttypeDefinition,
  ConstraintTypeWrapper,
  PropertyAssignment,
  getTypedObjectWrapper,
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
    blockTypeDefinition: BuiltinBlocktypeDefinition,
  ): string | undefined {
    if (!BlockTypeWrapper.canBeWrapped(blockTypeDefinition)) {
      return;
    }
    const blockType = new BlockTypeWrapper(blockTypeDefinition);

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateBlockTypeDoc(blockType);
  }

  private getConstraintTypeMarkdownDoc(
    constraintTypeDefinition: BuiltinConstrainttypeDefinition,
  ): string | undefined {
    if (!ConstraintTypeWrapper.canBeWrapped(constraintTypeDefinition)) {
      return;
    }
    const constraintType = new ConstraintTypeWrapper(constraintTypeDefinition);

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateConstraintTypeDoc(constraintType);
  }

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const container = property.$container.$container;
    const wrapper = getTypedObjectWrapper(container.type);
    if (wrapper === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(wrapper, property.name);
  }
}
