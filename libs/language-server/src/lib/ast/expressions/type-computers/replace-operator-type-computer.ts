// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type WrapperFactoryProvider } from '../../wrappers';
import { type ValueType } from '../../wrappers/value-type';
import { DefaultTernaryOperatorTypeComputer } from '../operator-type-computer';

export class ReplaceOperatorTypeComputer extends DefaultTernaryOperatorTypeComputer {
  constructor(protected readonly wrapperFactories: WrapperFactoryProvider) {
    super(
      wrapperFactories.ValueType.Primitives.Text,
      wrapperFactories.ValueType.Primitives.Regex,
      wrapperFactories.ValueType.Primitives.Text,
    );
  }

  override doComputeType(): ValueType {
    return this.wrapperFactories.ValueType.Primitives.Text;
  }
}
