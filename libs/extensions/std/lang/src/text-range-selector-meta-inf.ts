import { strict as assert } from 'assert';

import {
  BlockMetaInformation,
  IOType,
  PropertyAssignment,
  PropertyValuetype,
  isNumericLiteral,
} from '@jvalue/language-server';
import { ValidationAcceptor } from 'langium';

export class TextRangeSelectorMetaInformation extends BlockMetaInformation {
  constructor() {
    super(
      'TextRangeSelector',
      {
        lineFrom: {
          type: PropertyValuetype.INTEGER,
          defaultValue: 1,
          validation: greaterThanZeroValidation,
        },
        lineTo: {
          type: PropertyValuetype.INTEGER,
          defaultValue: Number.POSITIVE_INFINITY,
          validation: greaterThanZeroValidation,
        },
      },
      // Input type:
      IOType.TEXT_FILE,

      // Output type:
      IOType.TEXT_FILE,
    );
    this.docs.description = 'Selects a range of lines from a `TextFile`.';
  }
}

function greaterThanZeroValidation(
  property: PropertyAssignment,
  accept: ValidationAcceptor,
) {
  const propertyValue = property.value;
  assert(isNumericLiteral(propertyValue));

  if (propertyValue.value <= 0) {
    accept('error', `Line numbers need to be greater than zero`, {
      node: propertyValue,
    });
  }
}
