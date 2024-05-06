// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type LangiumDocuments, type MaybePromise } from 'langium';
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionValueItem,
  DefaultCompletionProvider,
  type NextFeature,
} from 'langium/lsp';
import { CompletionItemKind } from 'vscode-languageserver';

import { type TypedObjectWrapper, type WrapperFactoryProvider } from '../ast';
import {
  type BlockDefinition,
  type ConstraintDefinition,
  PropertyAssignment,
  type PropertyBody,
  ValueTypeReference,
  isBlockDefinition,
  isConstraintDefinition,
  isJayveeModel,
  isPropertyAssignment,
  isPropertyBody,
} from '../ast/generated/ast';
import {
  getAllBuiltinBlockTypes,
  getAllBuiltinConstraintTypes,
} from '../ast/model-util';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { type JayveeServices } from '../jayvee-module';

const RIGHT_ARROW_SYMBOL = '\u{2192}';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  protected langiumDocumentService: LangiumDocuments;
  protected readonly wrapperFactories: WrapperFactoryProvider;

  constructor(services: JayveeServices) {
    super(services);
    this.langiumDocumentService = services.shared.workspace.LangiumDocuments;
    this.wrapperFactories = services.WrapperFactories;
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
        return this.completionForBlockType(context, acceptor);
      }

      const isConstraintTypeCompletion =
        isConstraintDefinition(astNode) && next.property === 'type';
      if (isConstraintTypeCompletion) {
        return this.completionForConstraintType(context, acceptor);
      }

      const isValuetypeDefinitionCompletion = next.type === ValueTypeReference;
      if (isValuetypeDefinitionCompletion) {
        return this.completionForValuetype(context, acceptor);
      }

      const isFirstPropertyCompletion =
        isPropertyBody(astNode) && next.type === PropertyAssignment;
      const isOtherPropertyCompletion =
        isPropertyAssignment(astNode) && next.type === PropertyAssignment;
      if (isFirstPropertyCompletion || isOtherPropertyCompletion) {
        return this.completionForPropertyName(astNode, context, acceptor);
      }
    }
    return super.completionFor(context, next, acceptor);
  }

  private completionForBlockType(
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    const blockTypes = getAllBuiltinBlockTypes(
      this.langiumDocumentService,
      this.wrapperFactories,
    );
    blockTypes.forEach((blockType) => {
      const lspDocBuilder = new LspDocGenerator();
      const markdownDoc = lspDocBuilder.generateBlockTypeDoc(blockType);
      acceptor(context, {
        label: blockType.type,
        labelDetails: {
          detail: ` ${blockType.inputType} ${RIGHT_ARROW_SYMBOL} ${blockType.outputType}`,
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
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    const constraintTypes = getAllBuiltinConstraintTypes(
      this.langiumDocumentService,
      this.wrapperFactories,
    );
    constraintTypes.forEach((constraintType) => {
      const lspDocBuilder = new LspDocGenerator();
      const markdownDoc =
        lspDocBuilder.generateConstraintTypeDoc(constraintType);
      acceptor(context, {
        label: constraintType.type,
        labelDetails: {
          detail: ` on ${constraintType.on.getName()}`,
        },
        kind: CompletionItemKind.Class,
        detail: `(constraint type)`,
        documentation: {
          kind: 'markdown',
          value: markdownDoc,
        },
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
        parsedDocument.valueTypes.forEach((valueTypeDefinition) => {
          const valueType =
            this.wrapperFactories.ValueType.wrap(valueTypeDefinition);
          if (valueType !== undefined && valueType.isReferenceableByUser()) {
            acceptor(context, {
              label: valueTypeDefinition.name,
              kind: CompletionItemKind.Class,
              detail: `(valueType)`,
            });
          }
        });
      });
  }

  private completionForPropertyName(
    astNode: PropertyBody | PropertyAssignment,
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ) {
    let container: BlockDefinition | ConstraintDefinition;
    if (isPropertyBody(astNode)) {
      container = astNode.$container;
    } else {
      container = astNode.$container.$container;
    }

    const wrapper = this.wrapperFactories.TypedObject.wrap(container.type);
    if (wrapper === undefined) {
      return;
    }

    const presentPropertyNames = container.body.properties.map(
      (attr) => attr.name,
    );

    const propertyKinds: ('optional' | 'required')[] = ['required', 'optional'];
    for (const propertyKind of propertyKinds) {
      const propertyNames = wrapper.getPropertyNames(
        propertyKind,
        presentPropertyNames,
      );
      this.constructPropertyCompletionValueItems(
        wrapper,
        propertyNames,
        propertyKind,
      ).forEach((item) => acceptor(context, item));
    }
  }

  private constructPropertyCompletionValueItems(
    wrapper: TypedObjectWrapper,
    propertyNames: string[],
    kind: 'required' | 'optional',
  ): CompletionValueItem[] {
    return propertyNames.map((propertyName) => {
      const propertySpec = wrapper.getPropertySpecification(propertyName);
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
        wrapper,
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
