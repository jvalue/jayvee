import { ConstraintExecutor } from './constraint-executor';

export class RegexConstraintExecutor extends ConstraintExecutor {
  constructor() {
    super('RegexConstraint');
  }

  isValid(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const regex = this.getRegexAttributeValue('regex');
    return regex.test(value);
  }
}
