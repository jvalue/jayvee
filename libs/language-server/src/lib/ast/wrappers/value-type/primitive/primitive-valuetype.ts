// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions';
// eslint-disable-next-line import/no-cycle
import { AbstractValuetype, Valuetype } from '../valuetype';

export type PrimitiveType = string | number | boolean;

export abstract class PrimitiveValuetype<
  I extends InternalValueRepresentation = InternalValueRepresentation,
> extends AbstractValuetype<I> {
  constructor() {
    super(undefined);
  }

  isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }
}
