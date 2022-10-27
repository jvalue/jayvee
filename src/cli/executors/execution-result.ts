import * as E from 'fp-ts/lib/Either';
import { Task } from 'fp-ts/lib/Task';
import { CstNode } from 'langium';

export interface ExecutionErrorDetails {
  message: string;
  hint?: string;
  cstNode?: CstNode | undefined;
}

type Err = E.Left<ExecutionErrorDetails>;
export type Ok<T> = E.Right<T>;
export type Result<T> = E.Either<ExecutionErrorDetails, T>;

export function ok<T>(data: T): Result<T> {
  return E.right(data);
}
export function err<T>(details: ExecutionErrorDetails): Result<T> {
  return E.left(details);
}

export function isOk<T>(result: Result<T>): result is Ok<T> {
  return E.isRight(result);
}
export function isErr<T>(result: Result<T>): result is Err {
  return E.isLeft(result);
}

export function okData<T>(ok: Ok<T>): T {
  return ok.right;
}
export function errDetails(err: Err): ExecutionErrorDetails {
  return err.left;
}

export type ResultTask<T> = Task<Result<T>>;
