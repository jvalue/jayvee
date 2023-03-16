import { ConstraintExecutor } from './constraint-executor';

export class RangeConstraintExecutor extends ConstraintExecutor {
  constructor() {
    super('RangeConstraint');
  }

  isValid(value: unknown): boolean {
    let numericValue: number;
    if (typeof value === 'string') {
      numericValue = Number.parseFloat(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      return false;
    }

    const lowerBound = this.getNumericAttributeValue('lowerBound');
    const lowerBoundInclusive = this.getBooleanAttributeValue(
      'lowerBoundInclusive',
    );
    const upperBound = this.getNumericAttributeValue('upperBound');
    const upperBoundInclusive = this.getBooleanAttributeValue(
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
