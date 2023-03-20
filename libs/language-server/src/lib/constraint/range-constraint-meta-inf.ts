import { AttributeValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RangeConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RangeConstraint',
      {
        lowerBound: {
          type: AttributeValueType.DECIMAL,
          defaultValue: Number.NEGATIVE_INFINITY,
        },
        lowerBoundInclusive: {
          type: AttributeValueType.BOOLEAN,
          defaultValue: true,
        },
        upperBound: {
          type: AttributeValueType.DECIMAL,
          defaultValue: Number.POSITIVE_INFINITY,
        },
        upperBoundInclusive: {
          type: AttributeValueType.BOOLEAN,
          defaultValue: true,
        },
      },
      ['integer', 'decimal'],
    );
  }
}
