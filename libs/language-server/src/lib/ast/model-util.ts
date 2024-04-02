// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { AstNode, LangiumDocuments } from 'langium';

import {
  BuiltinBlocktypeDefinition,
  BuiltinConstrainttypeDefinition,
  isBuiltinBlocktypeDefinition,
  isJayveeModel,
} from './generated/ast';
// eslint-disable-next-line import/no-cycle
import {
  BlockTypeWrapper,
  ConstraintTypeWrapper,
  type WrapperFactory,
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
 * Utility function that gets all builtin blocktypes.
 * Duplicates are only added once.
 * Make sure to call @see initializeWorkspace first so that the file system is initialized.
 */
export function getAllBuiltinBlocktypes(
  documentService: LangiumDocuments,
  wrapperFactory: WrapperFactory,
): BlockTypeWrapper[] {
  const allBuiltinBlocktypes: BlockTypeWrapper[] = [];
  const visitedBuiltinBlocktypeDefinitions =
    new Set<BuiltinBlocktypeDefinition>();

  documentService.all
    .map((document) => document.parseResult.value)
    .forEach((parsedDocument) => {
      if (!isJayveeModel(parsedDocument)) {
        throw new Error('Expected parsed document to be a JayveeModel');
      }
      parsedDocument.blocktypes.forEach((blocktypeDefinition) => {
        if (!isBuiltinBlocktypeDefinition(blocktypeDefinition)) {
          return;
        }

        const wasAlreadyVisited =
          visitedBuiltinBlocktypeDefinitions.has(blocktypeDefinition);
        if (wasAlreadyVisited) {
          return;
        }

        if (wrapperFactory.BlockType.canWrap(blocktypeDefinition)) {
          allBuiltinBlocktypes.push(
            wrapperFactory.BlockType.wrap(blocktypeDefinition),
          );
          visitedBuiltinBlocktypeDefinitions.add(blocktypeDefinition);
        }
      });
    });
  return allBuiltinBlocktypes;
}

/**
 * Utility function that gets all builtin constraint types.
 * Duplicates are only added once.
 * Make sure to call @see initializeWorkspace first so that the file system is initialized.
 */
export function getAllBuiltinConstraintTypes(
  documentService: LangiumDocuments,
  wrapperFactory: WrapperFactory,
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

        if (wrapperFactory.ConstraintType.canWrap(constraintTypeDefinition)) {
          allBuiltinConstraintTypes.push(
            wrapperFactory.ConstraintType.wrap(constraintTypeDefinition),
          );
          visitedBuiltinConstraintTypeDefinitions.add(constraintTypeDefinition);
        }
      });
    });
  return allBuiltinConstraintTypes;
}
