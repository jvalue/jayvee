import { AstNode, findCommentNode } from 'langium';
import { JSDocDocumentationProvider } from 'langium/lib/documentation/documentation-provider';

export class JayveeDocumentationProvider extends JSDocDocumentationProvider {
  override getDocumentation(node: AstNode): string | undefined {
    const lastNode = findCommentNode(
      node.$cstNode,
      this.grammarConfig.multilineCommentRules,
    );
    if (lastNode === undefined) {
      return;
    }
    return lastNode.text.replace('/*', '').replace('*/', '');
  }
}
