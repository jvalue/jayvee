// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type WrapperFactoryProvider } from '../../wrappers';
import { type ValueType } from '../../wrappers/value-type';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class LogicalOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor(protected readonly wrapperFactories: WrapperFactoryProvider) {
    super(
      wrapperFactories.ValueType.Primitives.Boolean,
      wrapperFactories.ValueType.Primitives.Boolean,
    );
  }

  protected override doComputeType(): ValueType {
    return this.wrapperFactories.ValueType.Primitives.Boolean;
  }
}
