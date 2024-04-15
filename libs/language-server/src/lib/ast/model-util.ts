// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type AstNode, type LangiumDocuments } from 'langium';

import {
  type BuiltinBlockTypeDefinition,
  type BuiltinConstrainttypeDefinition,
  isBuiltinBlockTypeDefinition,
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
      parsedDocument.blockTypes.forEach((blockTypeDefinition) => {
        if (!isBuiltinBlockTypeDefinition(blockTypeDefinition)) {
          return;
        }

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
      parsedDocument.constrainttypes.forEach((constraintTypeDefinition) => {
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
