// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import {
  InternalValueRepresentation,
  InternalValueRepresentationTypeguard,
} from '../evaluation';
import { DefaultBinaryOperatorEvaluator } from '../operator-evaluator';
import { NUMBER_TYPEGUARD, STRING_TYPEGUARD } from '../typeguards';

export class InOperatorEvaluator extends DefaultBinaryOperatorEvaluator<
  InternalValueRepresentation,
  Array<InternalValueRepresentation>,
  boolean
> {
  constructor() {
    super(
      'in',
      isLeftOperandMatchingValuePreresentationTypeguard,
      isRightOperandMatchingValuePreresentationTypeguard,
    );
  }
  override doEvaluate(
    left: string | number,
    right: Array<string | number>,
  ): boolean {
    return right.includes(left);
  }
}

const isLeftOperandMatchingValuePreresentationTypeguard: InternalValueRepresentationTypeguard<
  string | number
> = (value: InternalValueRepresentation): value is string | number => {
  return STRING_TYPEGUARD(value) || NUMBER_TYPEGUARD(value);
};

const isRightOperandMatchingValuePreresentationTypeguard: InternalValueRepresentationTypeguard<
  Array<string | number>
> = (value: InternalValueRepresentation): value is Array<string | number> => {
  return (
    Array.isArray(value) &&
    value.every(isLeftOperandMatchingValuePreresentationTypeguard)
  );
};
