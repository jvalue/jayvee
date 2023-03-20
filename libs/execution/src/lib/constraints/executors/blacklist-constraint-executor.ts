import { ExecutionContext } from '../../execution-context';
import { ConstraintExecutor } from '../constraint-executor';

export class BlacklistConstraintExecutor implements ConstraintExecutor {
  public readonly constraintType = 'BlacklistConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const blacklist = context.getTextCollectionAttributeValue('blacklist');
    const blacklistValues = blacklist.map(
      (blacklistElement) => blacklistElement.value,
    );
    return !blacklistValues.includes(value);
  }
}
