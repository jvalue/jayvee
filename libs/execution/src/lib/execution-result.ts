import * as E from 'fp-ts/lib/Either';

import { Diagnostic } from './diagnostic';

/**
 * Convendience interfaces and methods wrapping @see Either of fp-ts library.
 * Left is the @see ExecutionErrorDetails
 * Right is a generic T
 */

export type Result<T> = E.Either<Diagnostic, T>;
export type Err = E.Left<Diagnostic>;
export type Ok<T> = E.Right<T>;

/**
 * Creates an @Ok object from a data object typed T.
 * @param data the data object
 * @returns the created @Ok object
 */
export function ok<T>(data: T): Result<T> {
  return E.right(data);
}
/**
 * Creates an @Err object from a @Diagnostic object.
 * @param details the @Diagnostic object
 * @returns the created @Err object
 */
export function err<T>(details: Diagnostic): Result<T> {
  return E.left(details);
}

/**
 * Type guard for @see Ok
 */
export function isOk<T>(result: Result<T>): result is Ok<T> {
  return E.isRight(result);
}
/**
 * Type guard for @see Err
 */
export function isErr<T>(result: Result<T>): result is Err {
  return E.isLeft(result);
}

/**
 * Convenience method to get wrapped data of an @see Ok object.
 */
export function okData<T>(ok: Ok<T>): T {
  return ok.right;
}
/**
 * Convenience method to get the @Diagnostic data of an @see Err object.
 */
export function errDetails(err: Err): Diagnostic {
  return err.left;
}
/**
 * Convenience method to get wrapped data if it is an @see Ok object.
 * Otherwise, throws the @Diagnostic object.
 */
export function dataOrThrow<T>(r: Result<T>): T {
  if (isErr(r)) {
    throw errDetails(r);
  }
  return r.right;
}
/**
 * Convenience method to get wrapped data if resolves to an @see Ok object.
 * Otherwise, throws the @Diagnostic object.
 */
export async function dataOrThrowAsync<T>(r: Promise<Result<T>>): Promise<T> {
  return dataOrThrow(await r);
}
