// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AstNode,
  AstNodeHoverProvider,
  MaybePromise,
  isReference,
} from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import {
  BuiltinBlocktypeDefinition,
  ConstraintTypeLiteral,
  PropertyAssignment,
  isBuiltinBlocktypeDefinition,
  isConstraintTypeLiteral,
  isPropertyAssignment,
} from '../ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import {
  ConstraintMetaInformation,
  getMetaInformation,
} from '../meta-information';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  override getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    let doc = undefined;
    if (isBuiltinBlocktypeDefinition(astNode)) {
      // TODO: check if this rather is isReference()
      doc = this.getBlockTypeMarkdownDoc(astNode);
    }
    if (isConstraintTypeLiteral(astNode)) {
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
    const blockMetaInf = getMetaInformation(blockType);
    if (blockMetaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateBlockTypeDoc(blockMetaInf);
  }

  private getConstraintTypeMarkdownDoc(
    constraintType: ConstraintTypeLiteral,
  ): string | undefined {
    const constraintMetaInf = getMetaInformation(constraintType);
    if (
      constraintMetaInf === undefined ||
      !(constraintMetaInf instanceof ConstraintMetaInformation) // TODO: check why this had to be changed!
    ) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateConstraintTypeDoc(constraintMetaInf);
  }

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const block = property.$container.$container;
    const metaInf = isReference(block.type)
      ? // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        getMetaInformation(block.type?.ref)
      : getMetaInformation(block.type);
    if (metaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(metaInf, property.name);
  }
}
