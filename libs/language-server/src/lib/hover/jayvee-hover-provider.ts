// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  AstNode,
  AstNodeHoverProvider,
  MaybePromise,
  assertUnreachable,
} from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import {
  BuiltinBlocktypeDefinition,
  BuiltinConstrainttypeDefinition,
  PropertyAssignment,
  isBlockDefinition,
  isBuiltinBlocktypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isPropertyAssignment,
  isTypedConstraintDefinition,
} from '../ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import {
  MetaInformation,
  getBlockMetaInf,
  getConstraintMetaInf,
} from '../meta-information';

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
    const blockMetaInf = getBlockMetaInf(blockType);
    if (blockMetaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateBlockTypeDoc(blockMetaInf);
  }

  private getConstraintTypeMarkdownDoc(
    constraintType: BuiltinConstrainttypeDefinition,
  ): string | undefined {
    const constraintMetaInf = getConstraintMetaInf(constraintType);
    if (constraintMetaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generateConstraintTypeDoc(constraintMetaInf);
  }

  private getPropertyMarkdownDoc(
    property: PropertyAssignment,
  ): string | undefined {
    const block = property.$container.$container;
    let metaInf: MetaInformation | undefined;
    if (isTypedConstraintDefinition(block)) {
      metaInf = getConstraintMetaInf(block.type);
    } else if (isBlockDefinition(block)) {
      metaInf = getBlockMetaInf(block.type);
    } else {
      assertUnreachable(block);
    }
    if (metaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(metaInf, property.name);
  }
}
