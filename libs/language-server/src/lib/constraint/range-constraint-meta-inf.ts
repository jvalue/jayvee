import { PropertyValueType } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RangeConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RangeConstraint',
      {
        lowerBound: {
          type: PropertyValueType.DECIMAL,
          defaultValue: Number.NEGATIVE_INFINITY,
        },
        lowerBoundInclusive: {
          type: PropertyValueType.BOOLEAN,
          defaultValue: true,
        },
        upperBound: {
          type: PropertyValueType.DECIMAL,
          defaultValue: Number.POSITIVE_INFINITY,
        },
        upperBoundInclusive: {
          type: PropertyValueType.BOOLEAN,
          defaultValue: true,
        },
      },
      ['integer', 'decimal'],
    );
  }
}
