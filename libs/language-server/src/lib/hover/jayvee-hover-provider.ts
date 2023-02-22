import { AstNode, AstNodeHoverProvider, MaybePromise } from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import { Attribute, BlockType, isAttribute, isBlockType } from '../ast';
import {
  buildLspBlockAttributeDoc,
  buildLspBlockTypeDoc,
  getMetaInformation,
} from '../meta-information';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  override getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    let doc = undefined;
    if (isBlockType(astNode)) {
      doc = this.getBlockTypeMarkdownDoc(astNode);
    }
    if (isAttribute(astNode)) {
      doc = this.getAttributeMarkdownDoc(astNode);
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

  private getBlockTypeMarkdownDoc(blockType: BlockType): string | undefined {
    const blockMetaInf = getMetaInformation(blockType);
    if (blockMetaInf === undefined) {
      return;
    }

    return buildLspBlockTypeDoc(blockMetaInf);
  }

  private getAttributeMarkdownDoc(attribute: Attribute): string | undefined {
    const block = attribute.$container;
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return;
    }

    return buildLspBlockAttributeDoc(blockMetaInf, attribute.name);
  }
}
