// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type PrimitiveValueTypeProvider,
  type ValueType,
} from '../../wrappers/value-type';
import { DefaultTernaryOperatorTypeComputer } from '../operator-type-computer';

export class ReplaceOperatorTypeComputer extends DefaultTernaryOperatorTypeComputer {
  constructor(
    protected readonly valueTypesProvider: PrimitiveValueTypeProvider,
  ) {
    super(
      valueTypesProvider.Primitives.Text,
      valueTypesProvider.Primitives.Regex,
      valueTypesProvider.Primitives.Text,
    );
  }

  override doComputeType(): ValueType {
    return this.valueTypesProvider.Primitives.Text;
  }
}
