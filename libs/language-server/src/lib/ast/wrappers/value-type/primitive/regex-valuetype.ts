// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class RegexValuetypeImpl extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitRegex(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'regex' {
    return 'regex';
  }
}

// Only export instance to enforce singleton
export const Regex = new RegexValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type RegexValuetype = InstanceType<typeof RegexValuetypeImpl>;

export function isRegexValuetype(v: unknown): v is RegexValuetype {
  return v === Regex;
}
