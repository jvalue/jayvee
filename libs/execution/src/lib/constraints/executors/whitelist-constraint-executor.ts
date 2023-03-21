import { ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { ConstraintExecutorClass } from '../constraint-executor-class';

@implementsStatic<ConstraintExecutorClass>()
export class WhitelistConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'WhitelistConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const whitelist = context.getTextCollectionPropertyValue('whitelist');
    const whitelistValues = whitelist.map(
      (whitelistElement) => whitelistElement.value,
    );
    return whitelistValues.includes(value);
  }
}
