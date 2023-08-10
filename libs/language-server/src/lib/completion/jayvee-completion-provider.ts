// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { strict as assert } from 'assert';

import {
  CompletionAcceptor,
  CompletionContext,
  CompletionValueItem,
  DefaultCompletionProvider,
  LangiumDocuments,
  LangiumServices,
  MaybePromise,
  NextFeature,
} from 'langium';
import { CompletionItemKind } from 'vscode-languageserver';

import { createValuetype } from '../ast';
import {
  BlockDefinition,
  ConstraintDefinition,
  ConstraintTypeLiteral,
  PropertyAssignment,
  PropertyBody,
  ValuetypeReference,
  isBlockDefinition,
  isConstraintDefinition,
  isConstraintTypeLiteral,
  isJayveeModel,
  isPropertyAssignment,
  isPropertyBody,
} from '../ast/generated/ast';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { MetaInformation } from '../meta-information/meta-inf';
import {
  getMetaInformation,
  getRegisteredBlockMetaInformation,
  getRegisteredConstraintMetaInformation,
} from '../meta-information/meta-inf-registry';

const RIGHT_ARROW_SYMBOL = '\u{2192}';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  protected langiumDocumentService: LangiumDocuments;

  constructor(services: LangiumServices) {
    super(services);
    this.langiumDocumentService = services.shared.workspace.LangiumDocuments;
  }

  override completionFor(
    context: CompletionContext,
    next: NextFeature,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    const astNode = context.node;
    if (astNode !== undefined) {
      const isBlockTypeCompletion =
        isBlockDefinition(astNode) && next.property === 'type';
      if (isBlockTypeCompletion) {
        return this.completionForBlockType(acceptor);
      }

      const isConstraintTypeCompletion =
        (isConstraintDefinition(astNode) || isConstraintTypeLiteral(astNode)) &&
        next.type === ConstraintTypeLiteral;
      if (isConstraintTypeCompletion) {
        return this.completionForConstraintType(acceptor);
      }

      const isValuetypeDefinitionCompletion = next.type === ValuetypeReference;
      if (isValuetypeDefinitionCompletion) {
        return this.completionForValuetype(context, acceptor);
      }

      const isFirstPropertyCompletion =
        isPropertyBody(astNode) && next.type === PropertyAssignment;
      const isOtherPropertyCompletion =
        isPropertyAssignment(astNode) && next.type === PropertyAssignment;
      if (isFirstPropertyCompletion || isOtherPropertyCompletion) {
        return this.completionForPropertyName(astNode, acceptor);
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
          detail: ` ${metaInf.compatibleValuetype.getName()}`,
        },
        kind: CompletionItemKind.Class,
        detail: `(constraint type)`,
      });
    });
  }

  private completionForValuetype(
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    this.langiumDocumentService.all
      .map((document) => document.parseResult.value)
      .forEach((parsedDocument) => {
        if (!isJayveeModel(parsedDocument)) {
          throw new Error('Expected parsed document to be a JayveeModel');
        }
        parsedDocument.valuetypes.forEach((valuetypeDefinition) => {
          const valuetype = createValuetype(valuetypeDefinition);
          if (valuetype !== undefined && valuetype.isReferenceableByUser()) {
            acceptor({
              label: valuetypeDefinition.name,
              kind: CompletionItemKind.Class,
              detail: `(valuetype)`,
            });
          }
        });
      });
  }

  private completionForPropertyName(
    astNode: PropertyBody | PropertyAssignment,
    acceptor: CompletionAcceptor,
  ) {
    let container: BlockDefinition | ConstraintDefinition;
    if (isPropertyBody(astNode)) {
      container = astNode.$container;
    } else {
      container = astNode.$container.$container;
    }

    const metaInf = getMetaInformation(container.type);
    if (metaInf === undefined) {
      return;
    }
    const presentPropertyNames = container.body.properties.map(
      (attr) => attr.name,
    );

    const propertyKinds: Array<'optional' | 'required'> = [
      'required',
      'optional',
    ];
    for (const propertyKind of propertyKinds) {
      const propertyNames = metaInf.getPropertyNames(
        propertyKind,
        presentPropertyNames,
      );
      this.constructPropertyCompletionValueItems(
        metaInf,
        propertyNames,
        propertyKind,
      ).forEach(acceptor);
    }
  }

  private constructPropertyCompletionValueItems(
    metaInf: MetaInformation,
    propertyNames: string[],
    kind: 'required' | 'optional',
  ): CompletionValueItem[] {
    return propertyNames.map((propertyName) => {
      const propertySpec = metaInf.getPropertySpecification(propertyName);
      assert(propertySpec !== undefined);

      const completionValueItem: CompletionValueItem = {
        label: propertyName,
        labelDetails: {
          detail: ` ${propertySpec.type.getName()}`,
        },
        kind: CompletionItemKind.Field,
        detail: `(${kind} property)`,
        sortText: kind === 'required' ? '1' : '2',
      };
      if (propertySpec.defaultValue !== undefined) {
        const defaultValueString = JSON.stringify(propertySpec.defaultValue);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        completionValueItem.labelDetails!.detail += ` = ${defaultValueString}`;
      }

      const lspDocBuilder = new LspDocGenerator();
      const markdownDoc = lspDocBuilder.generatePropertyDoc(
        metaInf,
        propertyName,
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
