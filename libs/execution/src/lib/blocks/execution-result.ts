// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { either as E } from 'fp-ts';
import { type AstNode, type DiagnosticInfo } from 'langium';

export interface ExecutionErrorDetails<N extends AstNode = AstNode> {
  message: string;
  diagnostic: DiagnosticInfo<N>;
}

/**
 * Convenience interfaces and methods wrapping {@link Either} of fp-ts library.
 * Left is the {@link ExecutionErrorDetails}
 * Right is a generic T
 */

export type Result<T> = E.Either<ExecutionErrorDetails, T>;
export type Err = E.Left<ExecutionErrorDetails>;
export type Ok<T> = E.Right<T>;

/**
 * Creates an {@link Ok} object from a data object typed T.
 * @param data the data object
 * @returns the created {@link Ok} object
 */
export function ok<T>(data: T): Result<T> {
  return E.right(data);
}
/**
 * Creates an {@link Err} object from a {@link ExecutionErrorDetails} object.
 * @param details the {@link ExecutionErrorDetails} object
 * @returns the created {@link Err} object
 */
export function err<T>(details: ExecutionErrorDetails): Result<T> {
  return E.left(details);
}

/**
 * Type guard for {@link Ok}
 */
export function isOk<T>(result: Result<T>): result is Ok<T> {
  return E.isRight(result);
}
/**
 * Type guard for {@link Err}
 */
export function isErr<T>(result: Result<T>): result is Err {
  return E.isLeft(result);
}

/**
 * Convenience method to get wrapped data of an {@link Ok} object.
 */
export function okData<T>(ok: Ok<T>): T {
  return ok.right;
}
