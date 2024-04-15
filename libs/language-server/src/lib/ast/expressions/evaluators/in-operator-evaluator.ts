// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import {
  type InternalValueRepresentation,
  type InternalValueRepresentationTypeguard,
} from '../internal-value-representation';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { NUMBER_TYPEGUARD, STRING_TYPEGUARD } from '../typeguards';

export class InOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  InternalValueRepresentation,
  InternalValueRepresentation[],
  boolean
> {
  constructor() {
    super(
      'in',
      isLeftOperandMatchingValueRepresentationTypeguard,
      isRightOperandMatchingValueRepresentationTypeguard,
    );
  }
  override doEvaluate(
    left: string | number,
    right: (string | number)[],
  ): boolean {
    return right.includes(left);
  }
}

const isLeftOperandMatchingValueRepresentationTypeguard: InternalValueRepresentationTypeguard<
  string | number
> = (value: InternalValueRepresentation): value is string | number => {
  return STRING_TYPEGUARD(value) || NUMBER_TYPEGUARD(value);
};

const isRightOperandMatchingValueRepresentationTypeguard: InternalValueRepresentationTypeguard<
  (string | number)[]
> = (value: InternalValueRepresentation): value is (string | number)[] => {
  return (
    Array.isArray(value) &&
    value.every(isLeftOperandMatchingValueRepresentationTypeguard)
  );
};
