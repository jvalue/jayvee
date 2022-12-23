import {
  AstNode,
  CompletionAcceptor,
  DefaultCompletionProvider,
  MaybePromise,
  NextFeature,
} from 'langium';
import { isRuleCall } from 'langium/lib/grammar/generated/ast';
import { CompletionItemKind } from 'vscode-languageserver-types';

import { Attribute, Block, isAttribute, isBlock } from '../ast/generated/ast';
import {
  getMetaInformation,
  getRegisteredBlockTypes,
} from '../meta-information';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  override completionFor(
    astNode: AstNode | undefined,
    next: NextFeature,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    if (isRuleCall(next.feature) && next.feature.rule.ref !== undefined) {
      if (isBlock(astNode)) {
        if (next.type === Attribute) {
          return this.completionForAttributeName(astNode, acceptor);
        }
        if (next.property === 'type') {
          return this.completionForBlockType(acceptor);
        }
      }
      if (isAttribute(astNode)) {
        if (next.property === 'name') {
          return this.completionForAttributeName(astNode, acceptor);
        }
      }
    }
    return super.completionFor(astNode, next, acceptor);
  }

  private completionForBlockType(
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    getRegisteredBlockTypes().forEach((blockType) => {
      acceptor(blockType, {
        kind: CompletionItemKind.Class,
        detail: `Block Type`,
      });
    });
  }

  private completionForAttributeName(
    astNode: Block | Attribute,
    acceptor: CompletionAcceptor,
  ) {
    const block = isBlock(astNode) ? astNode : astNode.$container;
    const blockMetaInf = getMetaInformation(block.type);
    if (blockMetaInf === undefined) {
      return;
    }
    const presentAttributeNames = block.attributes.map((attr) => attr.name);
    const missingRequiredAttributeNames = blockMetaInf.getAttributeNames(
      'required',
      presentAttributeNames,
    );
    missingRequiredAttributeNames.forEach((attributeName) =>
      acceptor(attributeName, {
        kind: CompletionItemKind.Field,
        detail: `${block.type} Attribute`,
        sortText: '1',
      }),
    );

    const missingOptionalAttributeNames = blockMetaInf.getAttributeNames(
      'optional',
      presentAttributeNames,
    );
    missingOptionalAttributeNames.forEach((attributeName) =>
      acceptor(attributeName, {
        kind: CompletionItemKind.Field,
        detail: `Optional ${block.type} Attribute`,
        sortText: '2',
      }),
    );
  }
}
