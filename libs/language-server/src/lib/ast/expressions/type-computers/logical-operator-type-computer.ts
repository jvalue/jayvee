// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type/index.js';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer.js';

export class LogicalOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(
      valueTypeProvider.Primitives.Boolean,
      valueTypeProvider.Primitives.Boolean,
    );
  }

  protected override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Boolean;
  }
}
