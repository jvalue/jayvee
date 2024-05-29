// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type AstNode, AstUtils, type LangiumDocuments } from 'langium';

import {
  type BuiltinBlockTypeDefinition,
  type BuiltinConstrainttypeDefinition,
  type ExportDefinition,
  type ExportableElement,
  type JayveeModel,
  isBuiltinBlockTypeDefinition,
  isBuiltinConstrainttypeDefinition,
  isExportDefinition,
  isExportableElement,
  isExportableElementDefinition,
  isJayveeModel,
} from './generated/ast';
import {
  type BlockTypeWrapper,
  type ConstraintTypeWrapper,
  type WrapperFactoryProvider,
} from './wrappers';

export type AstTypeGuard<T extends AstNode = AstNode> = (
  obj: unknown,
) => obj is T;

/**
 * Recursively goes upwards through the AST until it finds an AST node that satisfies the given type guard.
 * The entered AST node itself cannot be the result.
 * @param node The current AST node to start the search from.
 * @param guard The type guard function to check if a container matches the desired type.
 * @returns The desired container node that satisfies the type guard, or undefined if not found.
 */
export function getNextAstNodeContainer<T extends AstNode>(
  node: AstNode,
  guard: AstTypeGuard<T>,
): T | undefined {
  if (node.$container === undefined) {
    return undefined;
  }
  if (guard(node.$container)) {
    return node.$container;
  }
  return getNextAstNodeContainer(node.$container, guard);
}

/**
 * Utility function that gets all builtin block types.
 * Duplicates are only added once.
 * Make sure to call @see initializeWorkspace first so that the file system is initialized.
 */
export function getAllBuiltinBlockTypes(
  documentService: LangiumDocuments,
  wrapperFactories: WrapperFactoryProvider,
): BlockTypeWrapper[] {
  const allBuiltinBlockTypes: BlockTypeWrapper[] = [];
  const visitedBuiltinBlockTypeDefinitions =
    new Set<BuiltinBlockTypeDefinition>();

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      const allBlockTypes = AstUtils.streamAllContents(parsedDocument).filter(
        isBuiltinBlockTypeDefinition,
      );
      allBlockTypes.forEach((blockTypeDefinition) => {
        const wasAlreadyVisited =
          visitedBuiltinBlockTypeDefinitions.has(blockTypeDefinition);
        if (wasAlreadyVisited) {
          return;
        }

        if (wrapperFactories.BlockType.canWrap(blockTypeDefinition)) {
          allBuiltinBlockTypes.push(
            wrapperFactories.BlockType.wrap(blockTypeDefinition),
          );
          visitedBuiltinBlockTypeDefinitions.add(blockTypeDefinition);
        }
      });
    });
  return allBuiltinBlockTypes;
}

/**
 * Utility function that gets all builtin constraint types.
 * Duplicates are only added once.
 * Make sure to call @see initializeWorkspace first so that the file system is initialized.
 */
export function getAllBuiltinConstraintTypes(
  documentService: LangiumDocuments,
  wrapperFactories: WrapperFactoryProvider,
): ConstraintTypeWrapper[] {
  const allBuiltinConstraintTypes: ConstraintTypeWrapper[] = [];
  const visitedBuiltinConstraintTypeDefinitions =
    new Set<BuiltinConstrainttypeDefinition>();

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      const allConstraintTypes = AstUtils.streamAllContents(
        parsedDocument,
      ).filter(isBuiltinConstrainttypeDefinition);
      allConstraintTypes.forEach((constraintTypeDefinition) => {
        const wasAlreadyVisited = visitedBuiltinConstraintTypeDefinitions.has(
          constraintTypeDefinition,
        );
        if (wasAlreadyVisited) {
          return;
        }

        if (wrapperFactories.ConstraintType.canWrap(constraintTypeDefinition)) {
          allBuiltinConstraintTypes.push(
            wrapperFactories.ConstraintType.wrap(constraintTypeDefinition),
          );
          visitedBuiltinConstraintTypeDefinitions.add(constraintTypeDefinition);
        }
      });
    });
  return allBuiltinConstraintTypes;
}

export interface ExportDetails {
  /**
   * The exported element
   */
  element: ExportableElement;

  /**
   * The name which the exported element is available under.
   */
  exportName: string;
}

/**
 * Gets all exported elements from a document.
 * This logic cannot reside in a {@link ScopeComputationProvider} but should be handled here:
 * https://github.com/eclipse-langium/langium/discussions/1508#discussioncomment-9524544
 */
export function getExportedElements(model: JayveeModel): ExportDetails[] {
  const exportedElements: ExportDetails[] = [];

  for (const node of AstUtils.streamAllContents(model)) {
    if (isExportableElementDefinition(node) && node.isPublished) {
      assert(
        isExportableElement(node),
        'Exported node is not an ExportableElement',
      );
      exportedElements.push({
        element: node,
        exportName: node.name,
      });
    }

    if (isExportDefinition(node)) {
      const originalDefinition = followExportDefinitionChain(node);
      if (originalDefinition !== undefined) {
        const exportName = node.alias ?? originalDefinition.name;
        exportedElements.push({
          element: originalDefinition,
          exportName: exportName,
        });
      }
    }
  }
  return exportedElements;
}

/**
 * Follow an export statement to its original definition.
 */
export function followExportDefinitionChain(
  exportDefinition: ExportDefinition,
): ExportableElement | undefined {
  const referenced = exportDefinition.element.ref;

  if (referenced === undefined) {
    return undefined; // Cannot follow reference to original definition
  }

  if (!isElementExported(referenced)) {
    return undefined;
  }

  return referenced; // Reached original definition
}

/**
 * Checks whether an exportable @param element is exported (either in definition or via an delayed export definition).
 */
export function isElementExported(element: ExportableElement): boolean {
  if (isExportableElementDefinition(element) && element.isPublished) {
    return true;
  }

  const model = AstUtils.getContainerOfType(element, isJayveeModel);
  assert(
    model !== undefined,
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    `Could not get container of exportable element ${element.name ?? ''}`,
  );

  const isExported = model.exports.some(
    (exportDefinition) => exportDefinition.element.ref === element,
  );
  return isExported;
}
