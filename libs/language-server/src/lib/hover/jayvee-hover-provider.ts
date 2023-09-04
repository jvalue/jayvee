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
  BlockMetaInformation,
  MetaInformation,
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
    if (!BlockMetaInformation.canBeWrapped(blockType)) {
      return;
    }
    const blockMetaInf = new BlockMetaInformation(blockType);

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
    const container = property.$container.$container;
    let metaInf: MetaInformation | undefined;
    if (isTypedConstraintDefinition(container)) {
      metaInf = getConstraintMetaInf(container.type);
    } else if (isBlockDefinition(container)) {
      if (!BlockMetaInformation.canBeWrapped(container.type)) {
        return;
      }
      metaInf = new BlockMetaInformation(container.type);
    } else {
      assertUnreachable(container);
    }
    if (metaInf === undefined) {
      return;
    }

    const lspDocBuilder = new LspDocGenerator();
    return lspDocBuilder.generatePropertyDoc(metaInf, property.name);
  }
}
