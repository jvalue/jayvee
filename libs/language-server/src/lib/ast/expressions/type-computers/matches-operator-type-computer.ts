// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type ValueType,
  type ValueTypeProvider,
} from '../../wrappers/value-type';
import { DefaultBinaryOperatorTypeComputer } from '../operator-type-computer';

export class MatchesOperatorTypeComputer extends DefaultBinaryOperatorTypeComputer {
  constructor(protected readonly valueTypesProvider: ValueTypeProvider) {
    super(
      valueTypesProvider.Primitives.Text,
      valueTypesProvider.Primitives.Regex,
    );
  }

  override doComputeType(): ValueType {
    return this.valueTypesProvider.Primitives.Boolean;
  }
}
