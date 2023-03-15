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
  AttributeBody,
  Block,
  BlockType,
  Constraint,
  ConstraintType,
  isAttribute,
  isAttributeBody,
  isBlock,
  isBlockType,
  isConstraint,
  isConstraintType,
} from '../ast/generated/ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { MetaInformation } from '../meta-information/meta-inf';
import {
  getMetaInformation,
  getRegisteredBlockMetaInformation,
  getRegisteredConstraintMetaInformation,
} from '../meta-information/meta-inf-util';

const RIGHT_ARROW_SYMBOL = '\u{2192}';

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
      next.type === ConstraintType;
      if (isBlockTypeCompletion) {
        return this.completionForBlockType(acceptor);
      }

      const isConstraintTypeCompletion =
        (isConstraint(astNode) || isConstraintType(astNode)) &&
        next.type === ConstraintType;
      if (isConstraintTypeCompletion) {
        return this.completionForConstraintType(acceptor);
      }

      const isFirstAttributeCompletion =
        isAttributeBody(astNode) && next.type === Attribute;
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
    getRegisteredBlockMetaInformation().forEach((metaInf) => {
      const lspDocBuilder = new LspDocGenerator();
      const markdownDoc = lspDocBuilder.generateBlockTypeDoc(metaInf);
      acceptor({
        label: metaInf.type,
        labelDetails: {
          detail: ` ${metaInf.inputType} ${RIGHT_ARROW_SYMBOL} ${metaInf.outputType}`,
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

  private completionForConstraintType(
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    getRegisteredConstraintMetaInformation().forEach((metaInf) => {
      acceptor({
        label: metaInf.type,
        labelDetails: {
          detail: ` ${metaInf.primitiveValuetype}`,
        },
        kind: CompletionItemKind.Class,
        detail: `(constraint type)`,
      });
    });
  }

  private completionForAttributeName(
    astNode: AttributeBody | Attribute,
    acceptor: CompletionAcceptor,
  ) {
    let container: Block | Constraint;
    if (isAttributeBody(astNode)) {
      container = astNode.$container;
    } else {
      container = astNode.$container.$container;
    }

    const metaInf = getMetaInformation(container.type);
    if (metaInf === undefined) {
      return;
    }
    const presentAttributeNames = container.body.attributes.map(
      (attr) => attr.name,
    );

    const attributeKinds: Array<'optional' | 'required'> = [
      'required',
      'optional',
    ];
    for (const attributeKind of attributeKinds) {
      const attributeNames = metaInf.getAttributeNames(
        attributeKind,
        presentAttributeNames,
      );
      this.constructAttributeCompletionValueItems(
        metaInf,
        attributeNames,
        attributeKind,
      ).forEach(acceptor);
    }
  }

  private constructAttributeCompletionValueItems(
    metaInf: MetaInformation,
    attributeNames: string[],
    kind: 'required' | 'optional',
  ): CompletionValueItem[] {
    return attributeNames.map((attributeName) => {
      const attributeSpec = metaInf.getAttributeSpecification(attributeName);
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
      if (attributeSpec.defaultValue !== undefined) {
        const defaultValueString = JSON.stringify(attributeSpec.defaultValue);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        completionValueItem.labelDetails!.detail += ` = ${defaultValueString}`;
      }

      const lspDocBuilder = new LspDocGenerator();
      const markdownDoc = lspDocBuilder.generateAttributeDoc(
        metaInf,
        attributeName,
      );
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
