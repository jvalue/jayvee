import {
  AstNode,
  AstNodeHoverProvider,
  CstNode,
  LangiumDocument,
  MaybePromise,
  findDeclarationNodeAtOffset,
} from 'langium';
import { Hover, HoverParams } from 'vscode-languageserver-protocol';

import { Attribute, Block, isAttribute, isBlock } from '../ast';
import {
  getMetaInformation,
  getRegisteredBlockTypes,
} from '../meta-information';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  /**
   * We override this method as getBlockTypeHoverContent does not give us enough freedom.
   * The main parts of this method was copied from the superclass.
   * If issues arise, make sure to check if the superclass was updated by langium.
   */
  override getHoverContent(
    document: LangiumDocument,
    params: HoverParams,
  ): MaybePromise<Hover | undefined> {
    const rootNode = document.parseResult.value.$cstNode;
    if (rootNode) {
      const offset = document.textDocument.offsetAt(params.position);
      const cstNode = findDeclarationNodeAtOffset(
        rootNode,
        offset,
        this.grammarConfig.nameRegexp,
      );

      if (cstNode && cstNode.offset + cstNode.length > offset) {
        if (isBlockTypeToken(cstNode)) {
          const hoverContent = this.getBlockTypeHoverContent(cstNode.element);
          if (hoverContent !== undefined) {
            return hoverContent;
          }
        }

        const targetNode = this.references.findDeclaration(cstNode);
        if (targetNode) {
          return this.getAstNodeHoverContent(targetNode);
        }
      }
    }
    return undefined;
  }

  getBlockTypeHoverContent(astNode: AstNode): MaybePromise<Hover | undefined> {
    if (isBlock(astNode)) {
      const doc = this.getBlockTypeMarkdownDoc(astNode);
      if (doc !== undefined) {
        const hover: Hover = {
          contents: {
            kind: 'markdown',
            value: doc,
          },
        };
        return hover;
      }
    }
    return undefined;
  }

  override getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    let doc = undefined;
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

  private getBlockTypeMarkdownDoc(block: Block): string | undefined {
    const blockMetaInf = getMetaInformation(block.type);
    return blockMetaInf?.getMarkdownDoc();
  }

  private getAttributeMarkdownDoc(attribute: Attribute): string | undefined {
    const block = attribute.$container;
    const blockMetaInf = getMetaInformation(block.type);
    return blockMetaInf?.getAttributeMarkdownDoc(attribute.name);
  }
}

function isBlockTypeToken(cstNode: CstNode) {
  for (const blockType of getRegisteredBlockTypes()) {
    if (cstNode.text === blockType) {
      return true;
    }
  }
  return false;
}
