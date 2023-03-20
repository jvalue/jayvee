import { AttributeValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RegexConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RegexConstraint',
      {
        regex: {
          type: AttributeValueType.REGEX,
        },
      },
      ['text'],
    );
  }
}
