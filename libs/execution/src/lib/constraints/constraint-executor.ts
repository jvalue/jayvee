import { ExecutionContext } from '../execution-context';

export interface ConstraintExecutor {
  isValid(value: unknown, context: ExecutionContext): boolean;
}
