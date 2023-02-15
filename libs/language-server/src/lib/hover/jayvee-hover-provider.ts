import { AstNode, AstNodeHoverProvider, MaybePromise } from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import { Attribute, isAttribute } from '../ast';
import { getMetaInformation } from '../meta-information';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  protected getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    if (isAttribute(astNode)) {
      const doc = this.getAttributeMarkdownDocumentation(astNode);
      if (doc !== undefined) {
        const hover: Hover = {
          contents: {
            kind: 'markdown',
            value: doc,
          },
        };
        return Promise.resolve(hover);
      }
    }
    return Promise.resolve(undefined);
  }

  private getAttributeMarkdownDocumentation(
    attribute: Attribute,
  ): string | undefined {
    const block = attribute.$container;
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return undefined;
    }
    return blockMetaInf.getMarkdownForAttributeDocumentation(attribute.name);
  }
}
