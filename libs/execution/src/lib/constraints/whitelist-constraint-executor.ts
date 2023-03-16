import { ConstraintExecutor } from './constraint-executor';

export class WhitelistConstraintExecutor extends ConstraintExecutor {
  constructor() {
    super('WhitelistConstraint');
  }

  isValid(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const whitelist = this.getTextCollectionAttributeValue('whitelist');
    const whitelistValues = whitelist.map(
      (whitelistElement) => whitelistElement.value,
    );
    return whitelistValues.includes(value);
  }
}
