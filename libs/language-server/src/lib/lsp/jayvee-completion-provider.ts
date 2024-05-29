// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import {
  type AstNode,
  AstUtils,
  type LangiumDocument,
  type LangiumDocuments,
  type MaybePromise,
  UriUtils,
} from 'langium';
import {
  type CompletionAcceptor,
  type CompletionContext,
  type CompletionValueItem,
  DefaultCompletionProvider,
  type NextFeature,
} from 'langium/lsp';
import { CompletionItemKind, type Range } from 'vscode-languageserver';

import { type TypedObjectWrapper, type WrapperFactoryProvider } from '../ast';
import {
  type BlockDefinition,
  type ConstraintDefinition,
  type ImportDefinition,
  PropertyAssignment,
  type PropertyBody,
  ValueTypeReference,
  isBlockDefinition,
  isConstraintDefinition,
  isImportDefinition,
  isJayveeModel,
  isPropertyAssignment,
  isPropertyBody,
  isValuetypeDefinition,
} from '../ast/generated/ast';
import {
  getAllBuiltinBlockTypes,
  getAllBuiltinConstraintTypes,
  getExportedElements,
} from '../ast/model-util';
import { LspDocGenerator } from '../docs/lsp-doc-generator';
import { type JayveeServices } from '../jayvee-module';
import { type JayveeImportResolver } from '../services';

const RIGHT_ARROW_SYMBOL = '\u{2192}';

export class JayveeCompletionProvider extends DefaultCompletionProvider {
  protected langiumDocuments: LangiumDocuments;
  protected readonly wrapperFactories: WrapperFactoryProvider;
  protected readonly importResolver: JayveeImportResolver;

  constructor(services: JayveeServices) {
    super(services);
    this.langiumDocuments = services.shared.workspace.LangiumDocuments;
    this.wrapperFactories = services.WrapperFactories;
    this.importResolver = services.ImportResolver;
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

      const isImportPathCompletion =
        isImportDefinition(astNode) && next.property === 'path';
      if (isImportPathCompletion) {
        return this.completionForImportPath(astNode, context, acceptor);
      }

      const isImportElementCompletion =
        isImportDefinition(astNode) && next.property === 'element';
      if (isImportElementCompletion) {
        return this.completionForImportElement(astNode, context, acceptor);
      }
    }
    return super.completionFor(context, next, acceptor);
  }

  private completionForBlockType(
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ): MaybePromise<void> {
    const blockTypes = getAllBuiltinBlockTypes(
      this.langiumDocuments,
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
      this.langiumDocuments,
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
    this.langiumDocuments.all
      .map((document) => document.parseResult.value)
      .forEach((parsedDocument) => {
        if (!isJayveeModel(parsedDocument)) {
          throw new Error('Expected parsed document to be a JayveeModel');
        }
        const allValueTypes = AstUtils.streamAllContents(parsedDocument).filter(
          isValuetypeDefinition,
        );
        allValueTypes.forEach((valueTypeDefinition) => {
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

  private completionForImportPath(
    astNode: ImportDefinition,
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ) {
    const documentText = context.textDocument.getText();
    const existingImportPath = documentText.substring(
      context.tokenOffset,
      context.offset,
    );

    const hasSemicolonAfterPath =
      documentText.substring(
        context.tokenEndOffset,
        context.tokenEndOffset + 1,
      ) === ';';
    const pathDelimiter = existingImportPath.startsWith("'") ? "'" : '"';

    const existingImportPathWithoutDelimiter = existingImportPath.replace(
      pathDelimiter,
      '',
    );

    const allPaths = this.getImportPathsFormatted(context.document);
    const insertRange: Range = {
      start: context.textDocument.positionAt(context.tokenOffset),
      end: context.textDocument.positionAt(context.tokenEndOffset),
    };

    const suitablePaths = allPaths.filter((path) =>
      path.startsWith(existingImportPathWithoutDelimiter),
    );

    for (const path of suitablePaths) {
      const completionValue = `${pathDelimiter}${path}${pathDelimiter}${
        hasSemicolonAfterPath ? '' : ';'
      }`;
      acceptor(context, {
        label: completionValue, // using path here somehow doesn't work
        textEdit: {
          newText: completionValue,
          range: insertRange,
        },
        kind: CompletionItemKind.File,
      });
    }
  }

  private completionForImportElement(
    importDefinition: ImportDefinition,
    context: CompletionContext,
    acceptor: CompletionAcceptor,
  ) {
    const resolvedModel = this.importResolver.resolveImport(importDefinition);
    if (resolvedModel === undefined) {
      return;
    }

    const documentText = context.textDocument.getText();
    const existingElementName = documentText.substring(
      context.tokenOffset,
      context.offset,
    );

    const exportedElementNames = getExportedElements(resolvedModel).map(
      (x) => x.exportName,
    );

    const suggestedElementNames = exportedElementNames.filter((x) =>
      x.startsWith(existingElementName),
    );

    const insertRange: Range = {
      start: context.textDocument.positionAt(context.tokenOffset),
      end: context.textDocument.positionAt(context.tokenEndOffset),
    };

    for (const elementName of suggestedElementNames) {
      acceptor(context, {
        label: elementName,
        textEdit: {
          newText: elementName,
          range: insertRange,
        },
        kind: CompletionItemKind.Reference,
      });
    }
  }

  /**
   * Gets all paths to available documents, formatted as relative paths.
   * Does not include path to stdlib files as they don't need to be imported.
   * The paths don't include string delimiters.
   */
  private getImportPathsFormatted(
    currentDocument: LangiumDocument<AstNode>,
  ): string[] {
    const allDocuments = this.langiumDocuments.all;
    const currentDocumentUri = currentDocument.uri.toString();

    const currentDocumentDir = UriUtils.dirname(currentDocument.uri).toString();

    const paths: string[] = [];
    for (const doc of allDocuments) {
      if (UriUtils.equals(doc.uri, currentDocumentUri)) {
        continue;
      }

      const docUri = doc.uri.toString();
      if (docUri.includes('builtin:/stdlib')) {
        continue; // builtins don't need to be imported
      }

      const relativePath = UriUtils.relative(currentDocumentDir, docUri);

      const relativePathFormatted = relativePath.startsWith('.')
        ? relativePath
        : `./${relativePath}`;
      paths.push(relativePathFormatted);
    }
    return paths;
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
