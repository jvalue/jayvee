import { PropertyValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class LengthConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'LengthConstraint',
      {
        minLength: {
          type: PropertyValueType.INTEGER,
          defaultValue: 0,
        },
        maxLength: {
          type: PropertyValueType.INTEGER,
          defaultValue: Number.POSITIVE_INFINITY,
        },
      },
      ['text'],
    );
  }
}
