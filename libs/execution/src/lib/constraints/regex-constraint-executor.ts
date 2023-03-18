import { ExecutionContext } from '../execution-context';

import { ConstraintExecutor } from './constraint-executor';

export class RegexConstraintExecutor implements ConstraintExecutor {
  public readonly constraintType = 'RegexConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const regex = context.getRegexAttributeValue('regex');
    return regex.test(value);
  }
}
