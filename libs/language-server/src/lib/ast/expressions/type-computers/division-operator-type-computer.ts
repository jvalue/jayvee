// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type/index.js';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer.js';

export class DivisionOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(
      valueTypeProvider.Primitives.Decimal,
      valueTypeProvider.Primitives.Decimal,
    );
  }

  override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Decimal;
  }
}
