import { ConstraintExecutor } from './constraint-executor';

export class BlacklistConstraintExecutor extends ConstraintExecutor {
  constructor() {
    super('BlacklistConstraint');
  }

  isValid(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const blacklist = this.getTextCollectionAttributeValue('blacklist');
    const blacklistValues = blacklist.map(
      (blacklistElement) => blacklistElement.value,
    );
    return !blacklistValues.includes(value);
  }
}
