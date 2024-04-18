// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { DefaultTernaryOperatorTypeComputer } from '../operator-type-computer';

export class ReplaceOperatorTypeComputer extends DefaultTernaryOperatorTypeComputer {
  constructor(protected readonly valueTypeProvider: ValueTypeProvider) {
    super(
      valueTypeProvider.Primitives.Text,
      valueTypeProvider.Primitives.Regex,
      valueTypeProvider.Primitives.Text,
    );
  }

  override doComputeType(): ValueType {
    return this.valueTypeProvider.Primitives.Text;
  }
}
