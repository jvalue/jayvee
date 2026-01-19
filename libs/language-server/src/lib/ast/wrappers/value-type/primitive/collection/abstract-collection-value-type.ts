// SPDX-FileCopyrightText: 2023 Friedrich-Alexander-Universitat Erlangen-Nurnberg
//
// SPDX-License-Identifier: AGPL-3.0-only

import { type InternalValidValueRepresentation } from '../../../../expressions/internal-value-representation';
import { PrimitiveValueType } from '../primitive-value-type';

export type ToArray<I extends InternalValidValueRepresentation | undefined> =
  I extends InternalValidValueRepresentation ? I[] : [];

export abstract class AbstractCollectionValueType<
  I extends InternalValidValueRepresentation | undefined,
> extends PrimitiveValueType<ToArray<I>> {
  override isAllowedAsRuntimeParameter(): boolean {
    return false;
  }

  override isReferenceableByUser(): boolean {
    return true;
  }
}
