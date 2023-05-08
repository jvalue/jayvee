// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { PropertyValuetype } from '../../model-util';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class BasicArithmeticOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor() {
    super(PropertyValuetype.DECIMAL, PropertyValuetype.DECIMAL);
  }

  override doComputeType(
    leftOperandType: PropertyValuetype,
    rightOperandType: PropertyValuetype,
  ): PropertyValuetype {
    if (
      leftOperandType === PropertyValuetype.INTEGER &&
      rightOperandType === PropertyValuetype.INTEGER
    ) {
      return PropertyValuetype.INTEGER;
    }
    return PropertyValuetype.DECIMAL;
  }
}
