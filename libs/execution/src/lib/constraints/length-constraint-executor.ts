import { ExecutionContext } from '../execution-context';

import { ConstraintExecutor } from './constraint-executor';

export class LengthConstraintExecutor implements ConstraintExecutor {
  public readonly constraintType = 'LengthConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const minLength = context.getNumericAttributeValue('minLength');
    const maxLength = context.getNumericAttributeValue('maxLength');

    return minLength <= value.length && value.length <= maxLength;
  }
}
