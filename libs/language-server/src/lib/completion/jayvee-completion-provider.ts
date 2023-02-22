import { strict as assert } from 'assert';

import {
  CompletionAcceptor,
  CompletionContext,
  CompletionValueItem,
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
import { BlockMetaInformation } from '../meta-information/block-meta-inf';
import {
  getMetaInformation,
  getRegisteredMetaInformation,
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
    getRegisteredMetaInformation().forEach((metaInf) => {
      const markdownDoc = metaInf.getMarkdownDoc();
      acceptor({
        label: metaInf.blockType,
        labelDetails: {
          detail: ` ${metaInf.inputType} \u{2192} ${metaInf.outputType}`,
        },
        kind: CompletionItemKind.Class,
        detail: `(block type)`,
        documentation: {
          kind: 'markdown',
          value: markdownDoc,
        },
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

    const attributeKinds: Array<'optional' | 'required'> = [
      'required',
      'optional',
    ];
    for (const attributeKind of attributeKinds) {
      const attributeNames = blockMetaInf.getAttributeNames(
        attributeKind,
        presentAttributeNames,
      );
      this.constructAttributeCompletionValueItems(
        blockMetaInf,
        attributeNames,
        attributeKind,
      ).forEach(acceptor);
    }
  }

  private constructAttributeCompletionValueItems(
    blockMetaInf: BlockMetaInformation,
    attributeNames: string[],
    kind: 'required' | 'optional',
  ): CompletionValueItem[] {
    return attributeNames.map((attributeName) => {
      const attributeSpec =
        blockMetaInf.getAttributeSpecification(attributeName);
      assert(attributeSpec !== undefined);

      const completionValueItem: CompletionValueItem = {
        label: attributeName,
        labelDetails: {
          detail: ` ${attributeSpec.type}`,
        },
        kind: CompletionItemKind.Field,
        detail: `(${kind} attribute)`,
        sortText: kind === 'required' ? '1' : '2',
      };
      const markdownDoc = blockMetaInf.getAttributeMarkdownDoc(attributeName);
      if (markdownDoc !== undefined) {
        completionValueItem.documentation = {
          kind: 'markdown',
          value: markdownDoc,
        };
      }
      return completionValueItem;
    });
  }
}
