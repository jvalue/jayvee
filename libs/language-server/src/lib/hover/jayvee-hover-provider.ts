import { AstNode, AstNodeHoverProvider, MaybePromise } from 'langium';
import { Hover } from 'vscode-languageserver-protocol';

import { isAttribute } from '../ast';

export class JayveeHoverProvider extends AstNodeHoverProvider {
  protected getAstNodeHoverContent(
    astNode: AstNode,
  ): MaybePromise<Hover | undefined> {
    if (isAttribute(astNode)) {
      const hover: Hover = {
        contents: {
          kind: 'markdown',
          value: this.getAttributeDocumentation(),
        },
      };
      return Promise.resolve(hover);
    }
    return Promise.resolve(undefined);
  }

  private getAttributeDocumentation(): string {
    return 'todo';
  }
}
