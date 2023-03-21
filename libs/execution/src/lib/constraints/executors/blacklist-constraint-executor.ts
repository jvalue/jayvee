import { ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { ConstraintExecutorClass } from '../constraint-executor-class';

@implementsStatic<ConstraintExecutorClass>()
export class BlacklistConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'BlacklistConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const blacklist = context.getTextCollectionPropertyValue('blacklist');
    const blacklistValues = blacklist.map(
      (blacklistElement) => blacklistElement.value,
    );
    return !blacklistValues.includes(value);
  }
}
