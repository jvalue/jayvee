// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

// eslint-disable-next-line import/no-cycle
import { Valuetype, ValuetypeVisitor } from '../valuetype';

import { PrimitiveValuetype } from './primitive-valuetype';

class TransformValuetypeImpl extends PrimitiveValuetype {
  override isConvertibleTo(target: Valuetype): boolean {
    return target === this;
  }

  acceptVisitor<R>(visitor: ValuetypeVisitor<R>): R {
    return visitor.visitTransform(this);
  }

  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override getName(): 'transform' {
    return 'transform';
  }
}

// Only export instance to enforce singleton
export const Transform = new TransformValuetypeImpl();

// Only export type to allow narrowing down in visitors
export type TransformValuetype = InstanceType<typeof TransformValuetypeImpl>;

export function isTransformValuetype(v: unknown): v is TransformValuetype {
  return v === Transform;
}
