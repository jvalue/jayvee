// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, AstNodeHoverProvider, MaybePromise } from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import {
  BuiltinBlocktypeDefinition,
  BuiltinConstrainttypeDefinition,
  PropertyAssignment,
  type WrapperFactory,
  isBuiltinBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isPropertyAssignment,
} from '../ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { type JayveeServices } from '../jayvee-module';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  protected readonly wrapperFactory: WrapperFactory;

  constructor(services: JayveeServices) {
    super(services);
    this.wrapperFactory = services.WrapperFactory;
  }

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
    if (!this.wrapperFactory.BlockType.canWrap(blockTypeDefinition)) {
      return;
    }
    const blockType = this.wrapperFactory.BlockType.wrap(blockTypeDefinition);

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateBlockTypeDoc(blockType);
  }

  private getConstraintTypeMarkdownDoc(
    constraintTypeDefinition: BuiltinConstrainttypeDefinition,
  ): string | undefined {
    if (!this.wrapperFactory.ConstraintType.canWrap(constraintTypeDefinition)) {
      return;
    }
    const constraintType = this.wrapperFactory.ConstraintType.wrap(
      constraintTypeDefinition,
    );

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateConstraintTypeDoc(constraintType);
  }

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const container = property.$container.$container;
    const wrapper = this.wrapperFactory.wrapTypedObject(container.type);
    if (wrapper === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(wrapper, property.name);
  }
}
