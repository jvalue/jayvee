import { ExecutionContext } from '../../execution-context';
import { implementsStatic } from '../../util/implements-static-decorator';
import { ConstraintExecutor } from '../constraint-executor';
import { ConstraintExecutorClass } from '../constraint-executor-class';

@implementsStatic<ConstraintExecutorClass>()
export class RangeConstraintExecutor implements ConstraintExecutor {
  public static readonly type = 'RangeConstraint';

  isValid(value: unknown, context: ExecutionContext): boolean {
    let numericValue: number;
    if (typeof value === 'string') {
      numericValue = Number.parseFloat(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      return false;
    }

    const lowerBound = context.getNumericAttributeValue('lowerBound');
    const lowerBoundInclusive = context.getBooleanAttributeValue(
      'lowerBoundInclusive',
    );
    const upperBound = context.getNumericAttributeValue('upperBound');
    const upperBoundInclusive = context.getBooleanAttributeValue(
      'upperBoundInclusive',
    );

    const lowerBoundFulfilled =
      (lowerBoundInclusive && lowerBound <= numericValue) ||
      (!lowerBoundInclusive && lowerBound < numericValue);

    const upperBoundFulfilled =
      (upperBoundInclusive && numericValue <= upperBound) ||
      (!upperBoundInclusive && numericValue < upperBound);

    return lowerBoundFulfilled && upperBoundFulfilled;
  }
}
