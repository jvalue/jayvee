// SPDX-FileCopyrightText: 2024 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { DefaultUnaryOperatorTypeComputer } from '../operator-type-computer';

export class AsDecimalOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(valueTypeProvider.Primitives.Text);
  }

  override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Decimal;
  }
}

export class AsTextOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(valueTypeProvider.Primitives.Text);
  }

  override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Text;
  }
}

export class AsIntegerOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(valueTypeProvider.Primitives.Text);
  }

  override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Integer;
  }
}

export class AsBooleanOperatorTypeComputer extends DefaultUnaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(valueTypeProvider.Primitives.Text);
  }

  override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Boolean;
  }
}
