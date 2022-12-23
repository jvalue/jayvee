import {
  AstNode,
  CompletionAcceptor,
  DefaultCompletionProvider,
  MaybePromise,
  NextFeature,
} from 'langium';
import { AbstractRule, isRuleCall } from 'langium/lib/grammar/generated/ast';
import { CompletionItemKind } from 'vscode-languageserver-types';

import { Attribute, Block, isAttribute, isBlock } from '../ast/generated/ast';
import { getMetaInformation } from '../meta-information';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  override completionFor(
    astNode: AstNode | undefined,
    next: NextFeature,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    if (isRuleCall(next.feature) && next.feature.rule.ref !== undefined) {
      if (
        next.type === Attribute &&
        (isAttribute(astNode) || isBlock(astNode))
      ) {
        return this.completionForAttribute(
          next.feature.rule.ref,
          astNode,
          acceptor,
        );
      }
    }
    return super.completionFor(astNode, next, acceptor);
  }

  private completionForAttribute(
    rule: AbstractRule,
    astNode: Block | Attribute,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    if (rule.name === 'ID') {
      const block = isBlock(astNode) ? astNode : astNode.$container;
      this.completionForAttributeName(block, acceptor);
    }
  }

  private completionForAttributeName(
    block: Block,
    acceptor: CompletionAcceptor,
  ) {
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
        detail: `Attribute of ${block.type}`,
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
        detail: `Optional Attribute of ${block.type}`,
        sortText: '2',
      }),
    );
  }
}
