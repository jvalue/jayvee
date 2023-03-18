import { ExecutionContext } from '../execution-context';

export interface ConstraintExecutor {
  readonly constraintType: string;

  isValid(value: unknown, context: ExecutionContext): boolean;
}
