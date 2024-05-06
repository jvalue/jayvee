// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type MaybePromise } from 'langium';
import { AstNodeHoverProvider } from 'langium/lsp';
import { type Hover } from 'vscode-languageserver-protocol';

import {
  type BuiltinBlockTypeDefinition,
  type BuiltinConstrainttypeDefinition,
  type PropertyAssignment,
  type WrapperFactoryProvider,
  isBuiltinBlockTypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isPropertyAssignment,
} from '../ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { type JayveeServices } from '../jayvee-module';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  protected readonly wrapperFactories: WrapperFactoryProvider;

  constructor(services: JayveeServices) {
    super(services);
    this.wrapperFactories = services.WrapperFactories;
  }

  override getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    let doc = undefined;
    if (isBuiltinBlockTypeDefinition(astNode)) {
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
    blockTypeDefinition: BuiltinBlockTypeDefinition,
  ): string | undefined {
    if (!this.wrapperFactories.BlockType.canWrap(blockTypeDefinition)) {
      return;
    }
    const blockType = this.wrapperFactories.BlockType.wrap(blockTypeDefinition);

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateBlockTypeDoc(blockType);
  }

  private getConstraintTypeMarkdownDoc(
    constraintTypeDefinition: BuiltinConstrainttypeDefinition,
  ): string | undefined {
    if (
      !this.wrapperFactories.ConstraintType.canWrap(constraintTypeDefinition)
    ) {
      return;
    }
    const constraintType = this.wrapperFactories.ConstraintType.wrap(
      constraintTypeDefinition,
    );

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateConstraintTypeDoc(constraintType);
  }

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const container = property.$container.$container;
    const wrapper = this.wrapperFactories.TypedObject.wrap(container.type);
    if (wrapper === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(wrapper, property.name);
  }
}
