import {
  CompletionAcceptor,
  CompletionContext,
  DefaultCompletionProvider,
  MaybePromise,
  NextFeature,
} from 'langium';
import { CompletionItemKind } from 'vscode-languageserver';

import {
  Attribute,
  Block,
  BlockType,
  isAttribute,
  isBlock,
  isBlockType,
} from '../ast/generated/ast';
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
    if (astNode !== undefined) {
      const isBlockTypeCompletion =
        (isBlock(astNode) || isBlockType(astNode)) && next.type === BlockType;
      if (isBlockTypeCompletion) {
        return this.completionForBlockType(acceptor);
      }

      const isFirstAttributeCompletion =
        isBlock(astNode) && next.type === Attribute;
      const isOtherAttributeCompletion =
        isAttribute(astNode) && next.type === Attribute;
      if (isFirstAttributeCompletion || isOtherAttributeCompletion) {
        return this.completionForAttributeName(astNode, acceptor);
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
        detail: `${block.type.name} Attribute`,
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
        detail: `Optional ${block.type.name} Attribute`,
        sortText: '2',
      }),
    );
  }
}
