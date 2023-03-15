import { AttributeValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class LengthConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'LengthConstraint',
      {
        minLength: {
          type: AttributeValueType.INTEGER,
          defaultValue: 0,
        },
        maxLength: {
          type: AttributeValueType.INTEGER,
          defaultValue: Number.POSITIVE_INFINITY,
        },
      },
      'text',
    );
  }
}
