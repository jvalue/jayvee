import { PropertyValuetype } from '../ast/model-util';
import { ConstraintMetaInformation } from '../meta-information/constraint-meta-inf';

export class RangeConstraintMetaInformation extends ConstraintMetaInformation {
  constructor() {
    super(
      'RangeConstraint',
      {
        lowerBound: {
          type: PropertyValuetype.DECIMAL,
          defaultValue: Number.NEGATIVE_INFINITY,
        },
        lowerBoundInclusive: {
          type: PropertyValuetype.BOOLEAN,
          defaultValue: true,
        },
        upperBound: {
          type: PropertyValuetype.DECIMAL,
          defaultValue: Number.POSITIVE_INFINITY,
        },
        upperBoundInclusive: {
          type: PropertyValuetype.BOOLEAN,
          defaultValue: true,
        },
      },
      ['integer', 'decimal'],
    );
  }
}
