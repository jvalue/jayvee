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
  MaybePromise,
  NextFeature,
} from 'langium';
import { CompletionItemKind } from 'vscode-languageserver';

import { TypedObjectWrapper, WrapperFactory, createValuetype } from '../ast';
import {
  BlockDefinition,
  ConstraintDefinition,
  PropertyAssignment,
  PropertyBody,
  ValuetypeReference,
  isBlockDefinition,
  isConstraintDefinition,
  isJayveeModel,
  isPropertyAssignment,
  isPropertyBody,
} from '../ast/generated/ast';
import {
  getAllBuiltinBlocktypes,
  getAllBuiltinConstraintTypes,
} from '../ast/model-util';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { type JayveeServices } from '../jayvee-module';

const RIGHT_ARROW_SYMBOL = '\u{2192}';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  protected langiumDocumentService: LangiumDocuments;
  protected readonly wrapperFactory: WrapperFactory;

  constructor(services: JayveeServices) {
    super(services);
    this.langiumDocumentService = services.shared.workspace.LangiumDocuments;
    this.wrapperFactory = services.WrapperFactory;
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

      const isValuetypeDefinitionCompletion = next.type === ValuetypeReference;
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
    const blockTypes = getAllBuiltinBlocktypes(
      this.langiumDocumentService,
      this.wrapperFactory,
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
      this.wrapperFactory,
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
        parsedDocument.valuetypes.forEach((valuetypeDefinition) => {
          const valuetype = createValuetype(valuetypeDefinition);
          if (valuetype !== undefined && valuetype.isReferenceableByUser()) {
            acceptor(context, {
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
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ) {
    let container: BlockDefinition | ConstraintDefinition;
    if (isPropertyBody(astNode)) {
      container = astNode.$container;
    } else {
      container = astNode.$container.$container;
    }

    const wrapper = this.wrapperFactory.wrapTypedObject(container.type);
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
