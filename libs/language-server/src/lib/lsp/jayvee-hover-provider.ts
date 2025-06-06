// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type MaybePromise } from 'langium';
import { AstNodeHoverProvider } from 'langium/lsp';
import { type Hover } from 'vscode-languageserver-protocol';

import {
  type BuiltinBlockTypeDefinition,
  type PropertyAssignment,
  type WrapperFactoryProvider,
  isBuiltinBlockTypeDefinition,
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

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const container = property.$container.$container;
    const wrapper =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      container.type !== undefined
        ? this.wrapperFactories.BlockType.wrap(container.type)
        : undefined;
    if (wrapper === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(wrapper, property.name);
  }
}
