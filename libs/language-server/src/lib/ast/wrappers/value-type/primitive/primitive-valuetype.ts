// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValueRepresentation } from '../../../expressions/internal-value-representation';
// eslint-disable-next-line import/no-cycle
import { AbstractValuetype, Valuetype } from '../valuetype';

export abstract class PrimitiveValuetype<
  I extends InternalValueRepresentation = InternalValueRepresentation,
> extends AbstractValuetype<I> {
  constructor() {
    super();
  }

  override isConvertibleTo(target: Valuetype): boolean {
    return target.equals(this);
  }

  override equals(target: Valuetype): boolean {
    return target === this;
  }

  protected override doGetSupertype(): undefined {
    return undefined;
  }

  /**
   * Flag whether an atomic value type can be based on this primitive value type.
   */
  isUserExtendable(): boolean {
    return false;
  }
  // TODO: write validation and tests for this in valuetype validation

  /**
   * The user documentation for the value type.
   * Text only, no comment characters.
   * Should be given for all user extendable value types @see isUserExtendable
   */
  getUserDoc(): string | undefined {
    return undefined;
  }
}

export function isPrimitiveValuetype(v: unknown): v is PrimitiveValuetype {
  return v instanceof PrimitiveValuetype;
}
