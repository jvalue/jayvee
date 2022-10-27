import * as E from 'fp-ts/lib/Either';
import { CstNode } from 'langium';

/**
 * Data structure collecting all information relevant to an execution error.
 */
export interface ExecutionErrorDetails {
  message: string;
  hint?: string;
  cstNode?: CstNode | undefined;
}
/**
 * Type guard for @see ExecutionErrorDetails
 */
export function isExecutionErrorDetails(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: any,
): obj is ExecutionErrorDetails {
  return 'message' in obj;
}

/**
 * Convendience interfaces and methods wrapping @see Either of fp-ts library.
 * Left is the @see ExecutionErrorDetails
 * Right is a generic T
 */

export type Result<T> = E.Either<ExecutionErrorDetails, T>;
export type Err = E.Left<ExecutionErrorDetails>;
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
 * Creates an @Err object from an @ExecutionErrorDetails object.
 * @param details the @ExecutionErrorDetails object
 * @returns the created @Err object
 */
export function err<T>(details: ExecutionErrorDetails): Result<T> {
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
 * Convenience method to get the @ExecutionErrorDetails data of an @see Err object.
 */
export function errDetails(err: Err): ExecutionErrorDetails {
  return err.left;
}
/**
 * Convenience method to get wrapped data if it is an @see Ok object.
 * Otherwise, throws the @ExecutionErrorDetails object.
 */
export function dataOrThrow<T>(r: Result<T>): T {
  if (isErr(r)) {
    throw errDetails(r);
  }
  return r.right;
}
/**
 * Convenience method to get wrapped data if resolves to an @see Ok object.
 * Otherwise, throws the @ExecutionErrorDetails object.
 */
export async function dataOrThrowAsync<T>(r: Promise<Result<T>>): Promise<T> {
  return dataOrThrow(await r);
}
