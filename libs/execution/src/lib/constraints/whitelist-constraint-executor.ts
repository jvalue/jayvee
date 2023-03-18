import { ExecutionContext } from '../execution-context';

import { ConstraintExecutor } from './constraint-executor';

export class WhitelistConstraintExecutor implements ConstraintExecutor {
  public readonly constraintType = 'WhitelistConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const whitelist = context.getTextCollectionAttributeValue('whitelist');
    const whitelistValues = whitelist.map(
      (whitelistElement) => whitelistElement.value,
    );
    return whitelistValues.includes(value);
  }
}
