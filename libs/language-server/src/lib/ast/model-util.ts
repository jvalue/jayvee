// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line unicorn/prefer-node-protocol
import { strict as assert } from 'assert';

import { type AstNode, AstUtils, type LangiumDocuments } from 'langium';

import {
  type ExportDefinition,
  type ExportableElement,
  type JayveeModel,
  type ReferenceableBlockTypeDefinition,
  isExportDefinition,
  isExportableElement,
  isExportableElementDefinition,
  isJayveeModel,
  isReferenceableBlockTypeDefinition,
} from './generated/ast';
import { type BlockTypeWrapper, type WrapperFactoryProvider } from './wrappers';

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
 * Utility function that gets all referenceable block types, optionally filtered by a provided filter function.
 * Duplicates are only added once.
 * Make sure to call {@link initializeWorkspace} first so that the file system is initialized.
 */
export function getAllReferenceableBlockTypes(
  documentService: LangiumDocuments,
  wrapperFactories: WrapperFactoryProvider,
  filter: (
    blockTypeDefinition: ReferenceableBlockTypeDefinition,
  ) => boolean = () => true,
): BlockTypeWrapper[] {
  const allBlockTypes: BlockTypeWrapper[] = [];
  const visitedBlockTypeDefinitions =
    new Set<ReferenceableBlockTypeDefinition>();

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      const allReferenceableBlockTypes = AstUtils.streamAllContents(
        parsedDocument,
      )
        .filter(isReferenceableBlockTypeDefinition)
        .filter(filter);
      allReferenceableBlockTypes.forEach((blockTypeDefinition) => {
        const wasAlreadyVisited =
          visitedBlockTypeDefinitions.has(blockTypeDefinition);
        if (wasAlreadyVisited) {
          return;
        }

        if (wrapperFactories.BlockType.canWrap(blockTypeDefinition)) {
          allBlockTypes.push(
            wrapperFactories.BlockType.wrap(blockTypeDefinition),
          );
          visitedBlockTypeDefinitions.add(blockTypeDefinition);
        }
      });
    });
  return allBlockTypes;
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

    `Could not get container of exportable element ${element.name ?? ''}`,
  );

  const isExported = model.exports.some(
    (exportDefinition) => exportDefinition.element.ref === element,
  );
  return isExported;
}
