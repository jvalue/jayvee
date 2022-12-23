import {
  CompletionAcceptor,
  CompletionContext,
  DefaultCompletionProvider,
  MaybePromise,
  NextFeature,
} from 'langium';
import { isRuleCall } from 'langium/lib/grammar/generated/ast';
import { CompletionItemKind } from 'vscode-languageserver';

import { Attribute, Block, isAttribute, isBlock } from '../ast/generated/ast';
import {
  getMetaInformation,
  getRegisteredBlockTypes,
} from '../meta-information/meta-inf-util';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  override completionFor(
    context: CompletionContext,
    next: NextFeature,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    const astNode = context.node;
    if (
      astNode !== undefined &&
      isRuleCall(next.feature) &&
      next.feature.rule.ref !== undefined
    ) {
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
    return super.completionFor(context, next, acceptor);
  }

  private completionForBlockType(
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    getRegisteredBlockTypes().forEach((blockType) => {
      acceptor({
        label: blockType,
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
      acceptor({
        label: attributeName,
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
      acceptor({
        label: attributeName,
        kind: CompletionItemKind.Field,
        detail: `Optional ${block.type} Attribute`,
        sortText: '2',
      }),
    );
  }
}
