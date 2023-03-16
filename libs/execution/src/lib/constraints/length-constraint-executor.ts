import { ConstraintExecutor } from './constraint-executor';

export class LengthConstraintExecutor extends ConstraintExecutor {
  constructor() {
    super('LengthConstraint');
  }

  isValid(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const minLength = this.getNumericAttributeValue('minLength');
    const maxLength = this.getNumericAttributeValue('maxLength');

    return minLength <= value.length && value.length <= maxLength;
  }
}
